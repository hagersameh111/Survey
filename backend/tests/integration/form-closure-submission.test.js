import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import { issueParticipantToken } from "../../src/modules/response/participant-token.service.js";
import ParticipantToken from "../../src/modules/response/participant-token.model.js";
import Response from "../../src/modules/response/response.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "phase-eight-closure-test-secret";

const makeForm = (identityMode) => Form.create({
  owner: new mongoose.Types.ObjectId(),
  title: `Closure check ${identityMode}`,
  status: "published",
  settings: { identityMode },
  access: { type: "open" },
  pages: [
    { type: "welcome", order: 1, blocks: [] },
    {
      type: "questions",
      order: 2,
      blocks: [{
        type: "short_text",
        order: 1,
        data: { question: "Your response", required: true },
      }],
    },
    { type: "ending", order: 3, blocks: [] },
  ],
});

const makeJwt = (userId) => jwt.sign({ id: userId.toString(), role: "user" }, TEST_SECRET);

const submit = (form, identityMode, participantToken) => {
  const questionId = form.pages[1].blocks[0]._id.toString();
  const submission = request(app)
    .post(`/api/v1/forms/${form._id}/responses`)
    .send({ answers: [{ questionId, value: "A complete response" }] });

  if (identityMode === "identified") {
    return submission.set("Authorization", `Bearer ${makeJwt(new mongoose.Types.ObjectId())}`);
  }

  return submission.set("X-Participant-Token", participantToken);
};

describe("Form closure and Response submission", () => {
  let previousJwtSecret;

  beforeAll(async () => {
    await startTestDatabase();
    await Form.init();
    await ParticipantToken.init();
    await Response.init();
    previousJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterAll(async () => {
    if (previousJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousJwtSecret;
    }
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await Promise.all([
      Form.deleteMany({}),
      ParticipantToken.deleteMany({}),
      Response.deleteMany({}),
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["anonymous", "identified"])(
    "rejects a %s submission when closure completes before the final Form fence write",
    async (identityMode) => {
      const form = await makeForm(identityMode);
      const participantToken = identityMode === "anonymous"
        ? await issueParticipantToken(form._id.toString())
        : undefined;
      const ownerToken = makeJwt(form.owner);
      const originalUpdateOne = Form.updateOne.bind(Form);
      let closureResponse;
      let interceptedFenceWrite = false;

      vi.spyOn(Form, "updateOne").mockImplementation((filter, update, options) => {
        const isFinalFenceWrite =
          !interceptedFenceWrite &&
          filter?._id?.toString() === form._id.toString() &&
          filter.status === "published" &&
          filter["access.type"] === "open";

        if (!isFinalFenceWrite) {
          return originalUpdateOne(filter, update, options);
        }

        interceptedFenceWrite = true;
        return (async () => {
          closureResponse = await request(app)
            .post(`/api/v1/forms/${form._id}/close`)
            .set("Authorization", `Bearer ${ownerToken}`);
          return originalUpdateOne(filter, update, options);
        })();
      });

      const submitted = await submit(form, identityMode, participantToken);

      expect(closureResponse.status).toBe(200);
      expect(interceptedFenceWrite).toBe(true);
      expect(submitted.status).toBe(404);
      expect(submitted.body).toEqual({ success: false, message: "Form not found" });
      expect(await Form.exists({ _id: form._id, status: "closed" })).toBeTruthy();
      expect(await Response.countDocuments({ form: form._id })).toBe(0);

      if (participantToken) {
        const tokenRecord = await ParticipantToken.findOne({ form: form._id });
        expect(tokenRecord.consumedAt).toBeNull();
      }
    }
  );

  it.each(["anonymous", "identified"])(
    "persists a %s submission when the Form remains published and open",
    async (identityMode) => {
      const form = await makeForm(identityMode);
      const participantToken = identityMode === "anonymous"
        ? await issueParticipantToken(form._id.toString())
        : undefined;

      const submitted = await submit(form, identityMode, participantToken).expect(201);
      const stored = await Response.findById(submitted.body.data.responseId)
        .select("+participantTokenHash");

      expect(stored.form.toString()).toBe(form._id.toString());
      expect(stored.answers).toHaveLength(1);
      expect(stored.participantInfo).toEqual([]);
      if (identityMode === "anonymous") {
        expect(stored.participantTokenHash).toBeTruthy();
        expect((await ParticipantToken.findOne({ form: form._id })).consumedAt).toBeInstanceOf(Date);
      } else {
        expect(stored.respondentUser).toBeTruthy();
        expect(stored.participantTokenHash).toBeUndefined();
      }
    }
  );
});
