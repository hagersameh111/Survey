import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Response from "../../src/modules/response/response.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

describe("legacy Response persistence compatibility", () => {
  let testDatabaseUri;

  beforeAll(async () => {
    testDatabaseUri = await startTestDatabase();
    await Response.init();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await Response.deleteMany({});
  });

  it("reads a persisted legacy document without rewriting its missing participantInfo field", async () => {
    expect(testDatabaseUri).toMatch(/^mongodb:\/\/127\.0\.0\.1:/);
    expect(mongoose.connection.name).toBe("survey_backend_test");

    const responseId = new mongoose.Types.ObjectId();
    const formId = new mongoose.Types.ObjectId();
    const respondentUserId = new mongoose.Types.ObjectId();
    const firstQuestionId = new mongoose.Types.ObjectId();
    const secondQuestionId = new mongoose.Types.ObjectId();
    const submittedAt = new Date("2025-04-03T12:30:00.000Z");
    const legacyDocument = {
      _id: responseId,
      form: formId,
      respondentUser: respondentUserId,
      answers: [
        { questionId: firstQuestionId, value: "First legacy answer" },
        { questionId: secondQuestionId, value: ["Choice A", "Choice C"] },
      ],
      submittedAt,
      createdAt: submittedAt,
      updatedAt: submittedAt,
    };

    await Response.collection.insertOne(legacyDocument);

    const retrieved = await Response.findById(responseId);

    expect(retrieved).not.toBeNull();
    expect(retrieved.participantInfo).toEqual([]);
    expect(retrieved.answers.map((answer) => ({
      questionId: answer.questionId.toString(),
      value: answer.value,
    }))).toEqual([
      { questionId: firstQuestionId.toString(), value: "First legacy answer" },
      { questionId: secondQuestionId.toString(), value: ["Choice A", "Choice C"] },
    ]);
    expect(retrieved.form.toString()).toBe(formId.toString());
    expect(retrieved.respondentUser.toString()).toBe(respondentUserId.toString());
    expect(retrieved.submittedAt).toEqual(submittedAt);

    const rawStoredDocument = await Response.collection.findOne({ _id: responseId });
    expect(rawStoredDocument.answers).toEqual(legacyDocument.answers);
    expect(Object.hasOwn(rawStoredDocument, "participantInfo")).toBe(false);
  });
});
