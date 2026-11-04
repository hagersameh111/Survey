import dotenv from "dotenv";
import mongoose from "mongoose";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const backfillFormVersion = async (collection, { apply = false } = {}) => {
  const missingVersionFilter = { __v: { $exists: false } };

  if (!apply) {
    const matchedCount = await collection.countDocuments(missingVersionFilter);
    return { matchedCount, updatedCount: 0 };
  }

  const result = await collection.updateMany(missingVersionFilter, {
    $set: { __v: 0 },
  });

  return {
    matchedCount: result.matchedCount,
    updatedCount: result.modifiedCount,
  };
};

const runCli = async () => {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply") || args.filter((arg) => arg === "--apply").length > 1) {
    throw new Error("The only supported argument is --apply");
  }

  dotenv.config();
  const uri = process.env.MONGO_URI;
  if (typeof uri !== "string" || uri.trim().length === 0) {
    throw new Error("MONGO_URI is required to run the Form version backfill");
  }

  try {
    await mongoose.connect(uri);
    const collection = mongoose.connection.db.collection("forms");
    const result = await backfillFormVersion(collection, {
      apply: args.includes("--apply"),
    });
    const mode = args.includes("--apply") ? "Apply" : "Dry run";
    console.log(
      `${mode} complete. Matched: ${result.matchedCount}. Updated: ${result.updatedCount}.`
    );
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  runCli().catch(() => {
    console.error("Form version backfill failed. Check the required configuration and database access.");
    process.exitCode = 1;
  });
}
