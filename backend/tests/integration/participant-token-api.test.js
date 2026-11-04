import { createHash } from "node:crypto";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import ParticipantToken from "../../src/modules/response/participant-token.model.js";
import Response from "../../src/modules/response/response.model.js";
import { participantTokenIssuanceLimiter } from "../../src/middlewares/participant-token-rate-limit.middleware.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "phase-five-participant-token-test-secret";
const tokenUrl = (formId) => `/api/v1/public/forms/${formId}/participant-tokens`;
const responseUrl = (formId) => `/api/v1/forms/${formId}/responses`;
const legacyResponseUrl = (formId) => `/api/v1/public/forms/${formId}/responses`;

const makeForm = (overrides = {}) => Form.create({
  owner: new mongoose.Types.ObjectId(),
  title: "Anonymous feedback",
  status: "published",
  settings: { identityMode: "anonymous" },
  access: { type: "open" },
  pages: [
    { type: "welcome", order: 1, blocks: [] },
    {
      type: "participant_info",
      order: 2,
      blocks: [{ type: "email", order: 1, data: { question: "Email", required: true } }],
    },
    {
      type: "questions",
      order: 3,
      blocks: [{ type: "short_text", order: 1, data: { question: "Feedback", required: true } }],
    },
    { type: "ending", order: 4, blocks: [] },
  ],
  ...overrides,
});

const validAnswers = (form) => [
  {
    questionId: form.pages[1].blocks[0]._id.toString(),
    value: "respondent@example.test",
  },
  {
    questionId: form.pages[2].blocks[0]._id.toString(),
    value: "Useful survey",
  },
];

const resetLimiter = () => {
  for (const key of ["::ffff:127.0.0.1", "::1", "127.0.0.1"]) {
    participantTokenIssuanceLimiter.resetKey(key);
  }
};

describe("Anonymous participant token API", () => {
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
    resetLimiter();
    await stopTestDatabase();
  });

  beforeEach(async () => {
    resetLimiter();
    await Promise.all([
      Form.deleteMany({}),
      ParticipantToken.deleteMany({}),
      Response.deleteMany({}),
    ]);
  });

  it("issues a raw token once and stores only its Form-scoped hash", async () => {
    const form = await makeForm();
    const issued = await request(app).post(tokenUrl(form._id.toString())).expect(201);
    const rawToken = issued.body.data.participantToken;
    const tokenHash = createHash("sha256").update(rawToken, "utf8").digest("hex");

    expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const stored = await ParticipantToken.collection.findOne({ form: form._id, tokenHash });
    expect(stored).toMatchObject({
      form: form._id,
      tokenHash,
      consumedAt: null,
    });
    expect(stored).not.toHaveProperty("participantToken");
    expect(JSON.stringify(stored)).not.toContain(rawToken);
    expect(JSON.stringify(issued.body)).not.toContain(tokenHash);
  });

  it("returns the same 404 response for every ineligible or unavailable Form", async () => {
    const draft = await makeForm({ status: "draft" });
    const closed = await makeForm({ status: "closed" });
    const codeProtected = await makeForm({ access: { type: "code", codeHash: "hash" } });
    const identified = await makeForm({ settings: { identityMode: "identified" } });
    const missingId = new mongoose.Types.ObjectId().toString();
    const paths = [
      draft._id.toString(),
      closed._id.toString(),
      codeProtected._id.toString(),
      identified._id.toString(),
      missingId,
      "not-an-object-id",
    ];

    const results = await Promise.all(paths.map((id) => request(app).post(tokenUrl(id))));
    expect(results.map((result) => result.status)).toEqual(paths.map(() => 404));
    for (const result of results) {
      expect(result.body).toEqual({ success: false, message: "Form not found" });
    }
    expect(await ParticipantToken.countDocuments()).toBe(0);
  });

  it.each([
    {
      name: "a transaction conflict",
      model: "form",
      error: Object.assign(new Error("Form write conflicted with another request"), { code: 112 }),
      message: "The operation conflicted with another request. Please retry.",
    },
    {
      name: "a duplicate-key conflict",
      model: "token",
      error: Object.assign(new Error("duplicate key"), { code: 11000 }),
      message: "Token issuance conflicted with another request",
    },
  ])("returns HTTP 409 when token issuance encounters $name", async ({ model, error, message }) => {
    const form = await makeForm();
    const spy = model === "form"
      ? vi.spyOn(Form, "updateOne").mockRejectedValueOnce(error)
      : vi.spyOn(ParticipantToken, "create").mockRejectedValueOnce(error);

    try {
      const result = await request(app)
        .post(tokenUrl(form._id.toString()))
        .expect(409);

      expect(result.body).toEqual({ success: false, message });
      expect(await ParticipantToken.countDocuments({ form: form._id })).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });

  it("returns a generic 500 envelope for an unexpected token issuance service error", async () => {
    const form = await makeForm();
    const unexpected = new Error("internal storage detail must not be exposed");
    const createToken = vi.spyOn(ParticipantToken, "create")
      .mockRejectedValueOnce(unexpected);

    try {
      const result = await request(app)
        .post(tokenUrl(form._id.toString()))
        .expect(500);

      expect(result.body).toEqual({ success: false, message: "Internal server error" });
      expect(JSON.stringify(result.body)).not.toContain(unexpected.message);
      expect(await ParticipantToken.countDocuments({ form: form._id })).toBe(0);
    } finally {
      createToken.mockRestore();
    }
  });

  it("allows ten issuance requests per test IP and rejects the eleventh with Retry-After", async () => {
    const form = await makeForm();

    for (let index = 0; index < 10; index += 1) {
      await request(app).post(tokenUrl(form._id.toString())).expect(201);
    }

    const limited = await request(app).post(tokenUrl(form._id.toString())).expect(429);
    expect(limited.headers["retry-after"]).toBeDefined();
    expect(limited.body).toEqual({
      success: false,
      message: "Too many participant-token requests. Try again later.",
    });
    expect(await ParticipantToken.countDocuments({ form: form._id })).toBe(10);
  });

  it("submits with an issued header token and preserves participant/question classification", async () => {
    const form = await makeForm();
    const issuance = await request(app).post(tokenUrl(form._id.toString())).expect(201);
    const rawToken = issuance.body.data.participantToken;

    const submitted = await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: validAnswers(form) })
      .expect(201);

    expect(submitted.body).toMatchObject({
      success: true,
      data: { responseId: expect.any(String), submittedAt: expect.any(String) },
    });
    const response = await Response.findById(submitted.body.data.responseId).select("+participantTokenHash");
    expect(response.participantTokenHash).toBe(createHash("sha256").update(rawToken).digest("hex"));
    expect(response.participantInfo.map(({ questionId, value }) => ({ questionId: questionId.toString(), value })))
      .toEqual([{ questionId: form.pages[1].blocks[0]._id.toString(), value: "respondent@example.test" }]);
    expect(response.answers.map(({ questionId, value }) => ({ questionId: questionId.toString(), value })))
      .toEqual([{ questionId: form.pages[2].blocks[0]._id.toString(), value: "Useful survey" }]);

    const tokenRecord = await ParticipantToken.findOne({ form: form._id }).select("+tokenHash");
    expect(tokenRecord.consumedAt).toBeInstanceOf(Date);
    expect(JSON.stringify(submitted.body)).not.toContain(rawToken);
    expect(JSON.stringify(submitted.body)).not.toContain(tokenRecord.tokenHash);
    expect(JSON.stringify(response.toObject())).not.toContain(rawToken);
  });

  it("keeps the old public submission URL as an alias with the canonical secure contract", async () => {
    const form = await makeForm();
    const issuance = await request(app).post(tokenUrl(form._id.toString())).expect(201);
    const rawToken = issuance.body.data.participantToken;

    await request(app)
      .get(legacyResponseUrl(form._id.toString()))
      .expect(404);

    await request(app)
      .post(legacyResponseUrl(form._id.toString()))
      .send({ answers: validAnswers(form) })
      .expect(401);

    await request(app)
      .post(legacyResponseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({
        participant: { email: "legacy@example.test" },
        answers: Object.fromEntries(
          validAnswers(form).map(({ questionId, value }) => [questionId, value])
        ),
      })
      .expect(400);

    expect(await Response.countDocuments({ form: form._id })).toBe(0);
    expect((await ParticipantToken.findOne({ form: form._id })).consumedAt).toBeNull();

    const submitted = await request(app)
      .post(legacyResponseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: validAnswers(form) })
      .expect(201);

    expect(submitted.body.data.responseId).toEqual(expect.any(String));
    expect(await Response.countDocuments({ form: form._id })).toBe(1);
    expect((await ParticipantToken.findOne({ form: form._id })).consumedAt).toBeInstanceOf(Date);
  });

  it("rejects missing, malformed, unknown, and wrong-Form tokens with the same 401 response", async () => {
    const form = await makeForm();
    const otherForm = await makeForm();
    const otherToken = (await request(app).post(tokenUrl(otherForm._id.toString())).expect(201))
      .body.data.participantToken;
    const unknownToken = "Z".repeat(43);
    const cases = [
      { token: undefined, expectedStatus: 401 },
      { token: "malformed", expectedStatus: 401 },
      { token: unknownToken, expectedStatus: 401 },
      { token: otherToken, expectedStatus: 401 },
    ];

    const results = await Promise.all(cases.map(({ token }) => {
      let submission = request(app).post(responseUrl(form._id.toString())).send({ answers: validAnswers(form) });
      if (token !== undefined) submission = submission.set("X-Participant-Token", token);
      return submission;
    }));

    expect(results.map(({ status }) => status)).toEqual(cases.map(({ expectedStatus }) => expectedStatus));
    for (const result of results) {
      expect(result.body).toEqual({ success: false, message: "A valid participant token is required" });
    }
  });

  it("does not consume a token for invalid answers and accepts a corrected submission", async () => {
    const form = await makeForm();
    const rawToken = (await request(app).post(tokenUrl(form._id.toString())).expect(201)).body.data.participantToken;
    const answers = validAnswers(form);
    answers[0].value = "not-an-email";

    await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers })
      .expect(400);

    const storedToken = await ParticipantToken.findOne({ form: form._id });
    expect(storedToken.consumedAt).toBeNull();

    await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: validAnswers(form) })
      .expect(201);
  });

  it("preserves token error precedence over invalid answers without consuming a valid token", async () => {
    const form = await makeForm();
    const otherForm = await makeForm();
    const rawToken = (await request(app).post(tokenUrl(form._id.toString())).expect(201))
      .body.data.participantToken;
    const wrongFormToken = (await request(app).post(tokenUrl(otherForm._id.toString())).expect(201))
      .body.data.participantToken;
    const invalidAnswers = validAnswers(form);
    invalidAnswers[0].value = "not-an-email";

    const unknownTokenResult = await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", "Z".repeat(43))
      .send({ answers: invalidAnswers })
      .expect(401);
    expect(unknownTokenResult.body.message).toBe("A valid participant token is required");

    const wrongFormTokenResult = await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", wrongFormToken)
      .send({ answers: invalidAnswers })
      .expect(401);
    expect(wrongFormTokenResult.body.message).toBe("A valid participant token is required");

    await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: validAnswers(form) })
      .expect(201);

    const consumedTokenResult = await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: invalidAnswers })
      .expect(409);
    expect(consumedTokenResult.body.message)
      .toBe("A response has already been submitted for this form");

    const validButInvalidSubmissionToken = (await request(app)
      .post(tokenUrl(form._id.toString()))
      .expect(201)).body.data.participantToken;
    await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", validButInvalidSubmissionToken)
      .send({ answers: invalidAnswers })
      .expect(400);

    const consumedRecord = await ParticipantToken.findOne({
      form: form._id,
      tokenHash: createHash("sha256").update(rawToken).digest("hex"),
    });
    const unconsumedRecord = await ParticipantToken.findOne({
      form: form._id,
      tokenHash: createHash("sha256").update(validButInvalidSubmissionToken).digest("hex"),
    });
    expect(consumedRecord.consumedAt).toBeInstanceOf(Date);
    expect(unconsumedRecord.consumedAt).toBeNull();
    expect(await Response.countDocuments({ form: form._id })).toBe(1);
  });

  it("validates answers before repairing a legacy persisted Response's unconsumed token marker", async () => {
    const form = await makeForm();
    const rawToken = (await request(app).post(tokenUrl(form._id.toString())).expect(201)).body.data.participantToken;
    const rawHash = createHash("sha256").update(rawToken).digest("hex");
    await Response.create({
      form: form._id,
      participantTokenHash: rawHash,
      participantInfo: [],
      answers: [],
    });

    const invalidAnswers = validAnswers(form);
    invalidAnswers[0].value = "not-an-email";

    await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: invalidAnswers })
      .expect(400);

    expect(await Response.countDocuments({ form: form._id })).toBe(1);
    expect((await ParticipantToken.findOne({ form: form._id })).consumedAt).toBeNull();

    await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: validAnswers(form) })
      .expect(409);

    expect(await Response.countDocuments({ form: form._id })).toBe(1);
    expect((await ParticipantToken.findOne({ form: form._id })).consumedAt).toBeInstanceOf(Date);
  });

  it("rejects a token while its Form is unavailable and accepts it after reopening", async () => {
    const form = await makeForm();
    const rawToken = (await request(app).post(tokenUrl(form._id.toString())).expect(201)).body.data.participantToken;

    await Form.updateOne({ _id: form._id }, { $set: { status: "closed" } });
    const closed = await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: validAnswers(form) })
      .expect(404);
    expect(closed.body).toEqual({ success: false, message: "Form not found" });

    await Form.updateOne({ _id: form._id }, { $set: { status: "published" } });
    await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: validAnswers(form) })
      .expect(201);
  });

  it("returns the generic unavailable response if the Form becomes code-protected", async () => {
    const form = await makeForm();
    const rawToken = (await request(app).post(tokenUrl(form._id.toString())).expect(201)).body.data.participantToken;
    await Form.updateOne({ _id: form._id }, { $set: { "access.type": "code" } });

    const response = await request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: validAnswers(form) })
      .expect(404);

    expect(response.body).toEqual({ success: false, message: "Form not found" });
    expect(await Response.countDocuments({ form: form._id })).toBe(0);
    expect((await ParticipantToken.findOne({ form: form._id })).consumedAt).toBeNull();
  });

  it("preserves JWT identity and does not accept participant tokens as a substitute", async () => {
    const identifiedForm = await makeForm({ settings: { identityMode: "identified" } });
    const rawToken = "A".repeat(43);

    await request(app)
      .post(responseUrl(identifiedForm._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: [] })
      .expect(401);

    await request(app)
      .post(responseUrl(identifiedForm._id.toString()))
      .set("Authorization", `Bearer ${rawToken}`)
      .send({ answers: [] })
      .expect(401);

    const userId = new mongoose.Types.ObjectId();
    const authToken = jwt.sign({ id: userId.toString(), role: "user" }, TEST_SECRET);
    const first = await request(app)
      .post(responseUrl(identifiedForm._id.toString()))
      .set("Authorization", `Bearer ${authToken}`)
      .send({ answers: validAnswers(identifiedForm) })
      .expect(201);
    expect((await Response.findById(first.body.data.responseId)).respondentUser.toString()).toBe(userId.toString());

    await request(app)
      .post(responseUrl(identifiedForm._id.toString()))
      .set("Authorization", `Bearer ${authToken}`)
      .send({ answers: validAnswers(identifiedForm) })
      .expect(409);
  });

  it("uses the Response unique index as the concurrent one-use safeguard", async () => {
    const form = await makeForm();
    const rawToken = (await request(app).post(tokenUrl(form._id.toString())).expect(201)).body.data.participantToken;
    const responseIndexes = await Response.collection.indexes();
    expect(responseIndexes.some((index) =>
      index.key.form === 1 &&
      index.key.participantTokenHash === 1 &&
      index.unique === true
    )).toBe(true);

    const submit = () => request(app)
      .post(responseUrl(form._id.toString()))
      .set("X-Participant-Token", rawToken)
      .send({ answers: validAnswers(form) });

    const results = await Promise.all([submit(), submit()]);
    expect(results.map(({ status }) => status).sort()).toEqual([201, 409]);
    expect(await Response.countDocuments({ form: form._id })).toBe(1);

  });

  it("enforces the ParticipantToken unique index while allowing the same hash for another Form", async () => {
    await ParticipantToken.init();
    const firstForm = new mongoose.Types.ObjectId();
    const secondForm = new mongoose.Types.ObjectId();
    const tokenHash = "b".repeat(64);

    await ParticipantToken.create({ form: firstForm, tokenHash });
    await expect(ParticipantToken.create({ form: firstForm, tokenHash }))
      .rejects.toMatchObject({ code: 11000 });
    await expect(ParticipantToken.create({ form: secondForm, tokenHash })).resolves.toBeDefined();
  });
});
