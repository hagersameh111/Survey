import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { backfillPrivateSurveyCount } from "../../scripts/backfill-private-survey-count.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

describe("private survey counter backfill", () => {
  let users;
  let forms;

  beforeAll(async () => {
    await startTestDatabase();
    users = mongoose.connection.db.collection("users");
    forms = mongoose.connection.db.collection("forms");
  });
  afterAll(async () => stopTestDatabase());
  beforeEach(async () => {
    await Promise.all([users.deleteMany({}), forms.deleteMany({})]);
  });

  it("dry-runs without modifying user counters", async () => {
    const userId = new mongoose.Types.ObjectId();
    await users.insertOne({ _id: userId, activePrivateSurveyCount: 0 });
    await forms.insertMany([
      { owner: userId, visibility: "private", status: "published" },
      { owner: userId, visibility: "private", status: "draft" },
      { owner: userId, visibility: "shared", status: "published" },
    ]);

    const result = await backfillPrivateSurveyCount(users, forms);
    expect(result).toEqual({ usersMatchedCount: 1, usersUpdatedCount: 0, totalActivePrivateSurveys: 1 });
    expect((await users.findOne({ _id: userId })).activePrivateSurveyCount).toBe(0);
  });

  it("recalculates all users, includes zeros, and is idempotent", async () => {
    const [withForms, withoutForms] = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
    await users.insertMany([
      { _id: withForms, activePrivateSurveyCount: 0 },
      { _id: withoutForms },
    ]);
    await forms.insertMany([
      { owner: withForms, visibility: "private", status: "published" },
      { owner: withForms, visibility: "private", status: "published" },
      { owner: withForms, visibility: "private", status: "closed" },
    ]);

    const applied = await backfillPrivateSurveyCount(users, forms, { apply: true });
    expect(applied).toEqual({ usersMatchedCount: 2, usersUpdatedCount: 2, totalActivePrivateSurveys: 2 });
    expect((await users.findOne({ _id: withForms })).activePrivateSurveyCount).toBe(2);
    expect((await users.findOne({ _id: withoutForms })).activePrivateSurveyCount).toBe(0);

    const repeated = await backfillPrivateSurveyCount(users, forms, { apply: true });
    expect(repeated).toEqual({ usersMatchedCount: 0, usersUpdatedCount: 0, totalActivePrivateSurveys: 2 });
  });
});
