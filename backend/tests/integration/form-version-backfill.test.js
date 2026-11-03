import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { backfillFormVersion } from "../../scripts/backfill-form-version.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

describe("Form version backfill against MongoDB Memory Server", () => {
  let collection;

  beforeAll(async () => {
    await startTestDatabase();
    collection = mongoose.connection.db.collection("forms");
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await collection.deleteMany({});
  });

  it("dry-runs without changing documents", async () => {
    const missingId = new mongoose.Types.ObjectId();
    const versionedId = new mongoose.Types.ObjectId();
    await collection.insertMany([
      { _id: missingId, title: "Legacy Form" },
      { _id: versionedId, title: "Versioned Form", __v: 4 },
    ]);

    const result = await backfillFormVersion(collection);

    expect(result).toEqual({ matchedCount: 1, updatedCount: 0 });
    expect(await collection.findOne({ _id: missingId })).not.toHaveProperty("__v");
    expect((await collection.findOne({ _id: versionedId })).__v).toBe(4);
  });

  it("updates only missing versions and is idempotent", async () => {
    const missingId = new mongoose.Types.ObjectId();
    const versionedId = new mongoose.Types.ObjectId();
    await collection.insertMany([
      { _id: missingId, title: "Legacy Form" },
      { _id: versionedId, title: "Versioned Form", __v: 9 },
    ]);

    const firstApply = await backfillFormVersion(collection, { apply: true });
    expect(firstApply).toEqual({ matchedCount: 1, updatedCount: 1 });
    expect((await collection.findOne({ _id: missingId })).__v).toBe(0);
    expect((await collection.findOne({ _id: versionedId })).__v).toBe(9);

    const secondApply = await backfillFormVersion(collection, { apply: true });
    expect(secondApply).toEqual({ matchedCount: 0, updatedCount: 0 });
    expect((await collection.findOne({ _id: versionedId })).__v).toBe(9);
  });
});
