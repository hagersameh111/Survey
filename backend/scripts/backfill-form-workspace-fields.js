import dotenv from "dotenv";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Matches form.service.js's SHORT_CODE_ALPHABET exactly (ambiguity-free: no
// 0/O/1/I/l). Kept as a local, self-contained copy here, same as the rest
// of this script operates on the raw collection rather than importing the
// Mongoose model — see backfill-form-version.js for the precedent.
const SHORT_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const FREE_SHORT_CODE_LENGTH = 7;

const generateShortCode = (length) => {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => SHORT_CODE_ALPHABET[byte % SHORT_CODE_ALPHABET.length]).join("");
};

// Does two things in one migration, run together for operational
// simplicity (one script to run, not two):
//   1. Sets visibility:"private", workspace:null on any Form missing
//      `visibility` (pre-dates the team-workspace feature).
//   2. Assigns a shortCode (Free-tier length) to any Form missing one.
// Both are additive, idempotent, and dry-run by default.
export const backfillFormWorkspaceFields = async (collection, { apply = false } = {}) => {
  const missingVisibilityFilter = { visibility: { $exists: false } };
  const missingShortCodeFilter = { shortCode: { $exists: false } };

  if (!apply) {
    const [visibilityMatchedCount, shortCodeMatchedCount] = await Promise.all([
      collection.countDocuments(missingVisibilityFilter),
      collection.countDocuments(missingShortCodeFilter),
    ]);

    return {
      visibilityMatchedCount,
      visibilityUpdatedCount: 0,
      shortCodeMatchedCount,
      shortCodeUpdatedCount: 0,
    };
  }

  const visibilityResult = await collection.updateMany(missingVisibilityFilter, {
    $set: { visibility: "private", workspace: null },
  });

  // shortCode is unique, so it cannot be set via one updateMany — assign
  // one at a time with a bounded retry-on-collision loop.
  const docsNeedingShortCode = await collection
    .find(missingShortCodeFilter, { projection: { _id: 1 } })
    .toArray();

  let shortCodeUpdatedCount = 0;

  for (const doc of docsNeedingShortCode) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const result = await collection.updateOne(
          { _id: doc._id, shortCode: { $exists: false } },
          { $set: { shortCode: generateShortCode(FREE_SHORT_CODE_LENGTH) } }
        );

        if (result.modifiedCount === 1) {
          shortCodeUpdatedCount += 1;
        }

        break;
      } catch (error) {
        if (error.code === 11000 && attempt < 4) {
          continue;
        }

        throw error;
      }
    }
  }

  return {
    visibilityMatchedCount: visibilityResult.matchedCount,
    visibilityUpdatedCount: visibilityResult.modifiedCount,
    shortCodeMatchedCount: docsNeedingShortCode.length,
    shortCodeUpdatedCount,
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
    throw new Error("MONGO_URI is required to run the Form workspace-fields backfill");
  }

  try {
    await mongoose.connect(uri);
    const collection = mongoose.connection.db.collection("forms");
    const result = await backfillFormWorkspaceFields(collection, {
      apply: args.includes("--apply"),
    });
    const mode = args.includes("--apply") ? "Apply" : "Dry run";
    console.log(
      `${mode} complete. ` +
        `Visibility — matched: ${result.visibilityMatchedCount}, updated: ${result.visibilityUpdatedCount}. ` +
        `Short code — matched: ${result.shortCodeMatchedCount}, updated: ${result.shortCodeUpdatedCount}.`
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
    console.error("Form workspace-fields backfill failed. Check the required configuration and database access.");
    process.exitCode = 1;
  });
}
