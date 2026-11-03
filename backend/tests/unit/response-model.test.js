import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import Response from "../../src/modules/response/response.model.js";

const formId = new mongoose.Types.ObjectId();
const questionId = new mongoose.Types.ObjectId();

describe("Response model", () => {
  it("defaults participantInfo and answers to empty arrays", () => {
    const response = new Response({ form: formId });

    expect(response.participantInfo).toEqual([]);
    expect(response.answers).toEqual([]);
  });

  it("validates legacy answer entries that use questionId", async () => {
    const response = new Response({
      form: formId,
      answers: [{ questionId, value: "legacy value" }],
    });

    await expect(response.validate()).resolves.toBeUndefined();
    expect(response.answers[0].questionId.toString()).toBe(questionId.toString());
    expect(response.participantInfo).toEqual([]);
  });

  it("hydrates a legacy document without participantInfo", () => {
    const response = Response.hydrate({
      _id: new mongoose.Types.ObjectId(),
      form: formId,
      answers: [{ questionId, value: "legacy value" }],
      submittedAt: new Date(),
    });

    expect(response.participantInfo).toEqual([]);
    expect(response.answers[0].questionId.toString()).toBe(questionId.toString());
  });

  it("keeps identity paths and unique index declarations", () => {
    expect(Response.schema.path("respondentUser")).toBeDefined();
    expect(Response.schema.path("participantTokenHash")).toBeDefined();
    expect(Response.schema.path("form").options.index).toBe(true);

    const indexes = Response.schema.indexes();
    const respondentIndex = indexes.find(([keys]) => keys.respondentUser);
    const participantTokenIndex = indexes.find(([keys]) => keys.participantTokenHash);

    expect(respondentIndex).toBeDefined();
    expect(respondentIndex[1]).toMatchObject({
      unique: true,
      partialFilterExpression: { respondentUser: { $type: "objectId" } },
    });
    expect(participantTokenIndex).toBeDefined();
    expect(participantTokenIndex[1]).toMatchObject({
      unique: true,
      partialFilterExpression: { participantTokenHash: { $type: "string" } },
    });
  });
});
