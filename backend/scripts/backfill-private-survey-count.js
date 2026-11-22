import dotenv from "dotenv";
import mongoose from "mongoose";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Recalculate every user's counter from the source of truth. This must be run
// with form writes paused when applying, so concurrent publishes cannot race it.
export const backfillPrivateSurveyCount = async (users, forms, { apply = false } = {}) => {
  const counts = await forms.aggregate([
    { $match: { visibility: "private", status: "published" } },
    { $group: { _id: "$owner", count: { $sum: 1 } } },
  ]).toArray();
  const countByUser = new Map(counts.map(({ _id, count }) => [String(_id), count]));
  const userDocs = await users.find({}, { projection: { _id: 1, activePrivateSurveyCount: 1 } }).toArray();
  const updates = userDocs
    .map((user) => ({ user, count: countByUser.get(String(user._id)) || 0 }))
    .filter(({ user, count }) => user.activePrivateSurveyCount !== count);

  if (apply && updates.length) {
    await users.bulkWrite(updates.map(({ user, count }) => ({
      updateOne: { filter: { _id: user._id }, update: { $set: { activePrivateSurveyCount: count } } },
    })));
  }

  return {
    usersMatchedCount: updates.length,
    usersUpdatedCount: apply ? updates.length : 0,
    totalActivePrivateSurveys: counts.reduce((total, entry) => total + entry.count, 0),
  };
};

const runCli = async () => {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply") || args.filter((arg) => arg === "--apply").length > 1) {
    throw new Error("The only supported argument is --apply");
  }
  dotenv.config();
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required to run this backfill");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const result = await backfillPrivateSurveyCount(db.collection("users"), db.collection("forms"), {
      apply: args.includes("--apply"),
    });
    console.log(`${args.includes("--apply") ? "Apply" : "Dry run"} complete. Users needing updates: ${result.usersMatchedCount}. Updated: ${result.usersUpdatedCount}. Active Private surveys: ${result.totalActivePrivateSurveys}.`);
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  runCli().catch(() => {
    console.error("Private survey counter backfill failed. Check configuration and database access.");
    process.exitCode = 1;
  });
}
