import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import ParticipantToken from "../../src/modules/response/participant-token.model.js";

describe("ParticipantToken model", () => {
  it("requires a Form reference and a hash, and defaults consumption to null", async () => {
    const missingRequiredFields = new ParticipantToken({});
    let error;
    try {
      await missingRequiredFields.validate();
    } catch (validationError) {
      error = validationError;
    }

    expect(error.errors.form).toBeDefined();
    expect(error.errors.tokenHash).toBeDefined();

    const token = new ParticipantToken({
      form: new mongoose.Types.ObjectId(),
      tokenHash: "a".repeat(64),
    });
    expect(token.issuedAt).toBeInstanceOf(Date);
    expect(token.consumedAt).toBeNull();
    expect(ParticipantToken.schema.path("tokenHash").options.select).toBe(false);
  });

  it("declares a unique Form-scoped token-hash index without expiry fields", () => {
    const index = ParticipantToken.schema.indexes().find(([keys]) => keys.tokenHash);

    expect(index).toBeDefined();
    expect(index[0]).toEqual({ form: 1, tokenHash: 1 });
    expect(index[1].unique).toBe(true);
    expect(ParticipantToken.schema.path("expiresAt")).toBeUndefined();
  });
});
