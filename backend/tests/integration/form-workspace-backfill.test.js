import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { backfillFormWorkspaceFields } from "../../scripts/backfill-form-workspace-fields.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

describe("Form workspace-fields backfill against MongoDB Memory Server", () => {
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
    const legacyId = new mongoose.Types.ObjectId();
    const migratedId = new mongoose.Types.ObjectId();
    await collection.insertMany([
      { _id: legacyId, title: "Legacy Form" },
      { _id: migratedId, title: "Migrated Form", visibility: "shared", shortCode: "ABCDE" },
    ]);

    const result = await backfillFormWorkspaceFields(collection);

    expect(result).toEqual({
      visibilityMatchedCount: 1,
      visibilityUpdatedCount: 0,
      shortCodeMatchedCount: 1,
      shortCodeUpdatedCount: 0,
    });
    expect(await collection.findOne({ _id: legacyId })).not.toHaveProperty("visibility");
    expect(await collection.findOne({ _id: legacyId })).not.toHaveProperty("shortCode");
    expect((await collection.findOne({ _id: migratedId })).visibility).toBe("shared");
  });

  it("sets visibility/workspace and assigns short codes only where missing, and is idempotent", async () => {
    const legacyId = new mongoose.Types.ObjectId();
    const migratedId = new mongoose.Types.ObjectId();
    await collection.insertMany([
      { _id: legacyId, title: "Legacy Form" },
      { _id: migratedId, title: "Migrated Form", visibility: "shared", workspace: null, shortCode: "ABCDE" },
    ]);

    const firstApply = await backfillFormWorkspaceFields(collection, { apply: true });
    expect(firstApply).toEqual({
      visibilityMatchedCount: 1,
      visibilityUpdatedCount: 1,
      shortCodeMatchedCount: 1,
      shortCodeUpdatedCount: 1,
    });

    const legacy = await collection.findOne({ _id: legacyId });
    expect(legacy.visibility).toBe("private");
    expect(legacy.workspace).toBeNull();
    expect(typeof legacy.shortCode).toBe("string");
    expect(legacy.shortCode).toHaveLength(7);

    const migrated = await collection.findOne({ _id: migratedId });
    expect(migrated.shortCode).toBe("ABCDE");

    const secondApply = await backfillFormWorkspaceFields(collection, { apply: true });
    expect(secondApply).toEqual({
      visibilityMatchedCount: 0,
      visibilityUpdatedCount: 0,
      shortCodeMatchedCount: 0,
      shortCodeUpdatedCount: 0,
    });
    expect((await collection.findOne({ _id: legacyId })).shortCode).toBe(legacy.shortCode);
  });
});
