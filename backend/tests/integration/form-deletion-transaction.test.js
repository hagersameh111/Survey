import { createHash } from "node:crypto";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import User from "../../src/modules/user/user.model.js";
import Response from "../../src/modules/response/response.model.js";
import ParticipantToken from "../../src/modules/response/participant-token.model.js";
import { participantTokenIssuanceLimiter } from "../../src/middlewares/participant-token-rate-limit.middleware.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "form-deletion-transaction-test-secret";
const formUrl = (formId) => `/api/v1/forms/${formId}`;
const responseUrl = (formId) => `${formUrl(formId)}/responses`;
const tokenUrl = (formId) => `/api/v1/public/forms/${formId}/participant-tokens`;

const makeUser = (email) => User.create({
  firstName: "Survey",
  lastName: "Owner",
  email,
  password: "test-password-123",
});

const makeForm = (owner, { status = "published", identityMode = "anonymous" } = {}) =>
  Form.create({
    owner,
    title: "Form to delete",
    status,
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
          data: { question: "Feedback", required: true },
        }],
      },
      { type: "ending", order: 3, blocks: [] },
    ],
  });

const makeJwt = (userId) => jwt.sign(
  { id: userId.toString(), role: "user" },
  TEST_SECRET
);

const submit = (form, { identityMode = "anonymous", participantToken, userId } = {}) => {
  const questionId = form.pages[1].blocks[0]._id.toString();
  let call = request(app)
    .post(responseUrl(form._id.toString()))
    .send({ answers: [{ questionId, value: "A complete response" }] });

  if (identityMode === "identified") {
    call = call.set("Authorization", `Bearer ${makeJwt(userId)}`);
  } else if (participantToken) {
    call = call.set("X-Participant-Token", participantToken);
  }

  return call;
};

const deleteForm = (form, userId) => request(app)
  .delete(formUrl(form._id.toString()))
  .set("Authorization", `Bearer ${makeJwt(userId)}`);

const resetLimiter = () => {
  for (const key of ["::ffff:127.0.0.1", "::1", "127.0.0.1"]) {
    participantTokenIssuanceLimiter.resetKey(key);
  }
};

const pauseInitialFormRead = (methodName, formId) => {
  const originalRead = Form[methodName];
  let reached;
  let release;
  const readReached = new Promise((resolve) => { reached = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  let paused = false;

  const spy = vi.spyOn(Form, methodName).mockImplementation(function (...args) {
    const query = originalRead.apply(this, args);
    const filter = args[0];
    const matchesForm = methodName === "findById"
      ? filter?.toString() === formId.toString()
      : filter?._id?.toString() === formId.toString();

    if (!matchesForm || paused) return query;
    paused = true;

    const execute = query.exec.bind(query);
    query.exec = async (...execArgs) => {
      const document = await execute(...execArgs);
      reached();
      await gate;
      return document;
    };

    return query;
  });

  return { readReached, release, spy };
};

describe("permanent Form deletion and transaction coordination", () => {
  let previousJwtSecret;

  beforeAll(async () => {
    await startTestDatabase();
    await Promise.all([
      Form.init(),
      User.init(),
      Response.init(),
      ParticipantToken.init(),
    ]);
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
    await Form.deleteMany({});
    await Response.deleteMany({});
    await ParticipantToken.deleteMany({});
    await User.deleteMany({});
  });

  it("rejects unauthenticated deletion", async () => {
    const owner = await makeUser("unauthenticated-delete@example.test");
    const form = await makeForm(owner._id, { status: "draft" });

    await request(app).delete(formUrl(form._id.toString())).expect(401);
    expect(await Form.exists({ _id: form._id })).not.toBeNull();
  });

  it.each(["draft", "published", "closed"])(
    "allows the owner to delete a %s Form with the existing response envelope",
    async (status) => {
      const owner = await makeUser(`owner-${status}@example.test`);
      const form = await makeForm(owner._id, { status });

      const result = await deleteForm(form, owner._id).expect(200);

      expect(result.body).toEqual({ success: true, message: "Form deleted successfully" });
      expect(await Form.exists({ _id: form._id })).toBeNull();
    }
  );

  it("returns the same 404 for a missing Form and another user's Form", async () => {
    const owner = await makeUser("first-owner@example.test");
    const otherUser = await makeUser("other-owner@example.test");
    const form = await makeForm(owner._id, { status: "draft" });

    const nonOwner = await deleteForm(form, otherUser._id).expect(404);
    const missing = await request(app)
      .delete(formUrl(new mongoose.Types.ObjectId().toString()))
      .set("Authorization", `Bearer ${makeJwt(otherUser._id)}`)
      .expect(404);

    expect(nonOwner.body).toEqual(missing.body);
    expect(await Form.exists({ _id: form._id })).not.toBeNull();
  });

  it("returns 400 for an invalid Form ID and 404 for a missing or already deleted Form", async () => {
    const owner = await makeUser("invalid-id-owner@example.test");
    const authorization = `Bearer ${makeJwt(owner._id)}`;

    await request(app)
      .delete(formUrl("not-an-object-id"))
      .set("Authorization", authorization)
      .expect(400);

    const missingId = new mongoose.Types.ObjectId().toString();
    await request(app).delete(formUrl(missingId)).set("Authorization", authorization).expect(404);

    const form = await makeForm(owner._id, { status: "draft" });
    await deleteForm(form, owner._id).expect(200);
    await deleteForm(form, owner._id).expect(404);
  });

  it("deletes every associated Response and ParticipantToken while preserving owner and respondent Users", async () => {
    const owner = await makeUser("cascade-owner@example.test");
    const respondent = await makeUser("cascade-respondent@example.test");
    const form = await makeForm(owner._id);
    const tokenHash = createHash("sha256").update("stored-test-token").digest("hex");

    await ParticipantToken.create({ form: form._id, tokenHash });
    await Response.create({
      form: form._id,
      respondentUser: respondent._id,
      participantInfo: [],
      answers: [],
    });

    await deleteForm(form, owner._id).expect(200);

    expect(await Form.countDocuments({ _id: form._id })).toBe(0);
    expect(await Response.countDocuments({ form: form._id })).toBe(0);
    expect(await ParticipantToken.countDocuments({ form: form._id })).toBe(0);
    expect(await User.findById(owner._id).select("_id email").lean()).toMatchObject({
      _id: owner._id,
      email: owner.email,
    });
    expect(await User.findById(respondent._id).select("_id email").lean()).toMatchObject({
      _id: respondent._id,
      email: respondent.email,
    });
    expect(await User.countDocuments()).toBe(2);
  });

  it("removes a committed anonymous token and Response when deletion commits afterward", async () => {
    const owner = await makeUser("writes-before-delete@example.test");
    const form = await makeForm(owner._id);
    const issued = await request(app).post(tokenUrl(form._id.toString())).expect(201);
    const rawToken = issued.body.data.participantToken;

    await submit(form, { participantToken: rawToken }).expect(201);
    expect(await Response.countDocuments({ form: form._id })).toBe(1);
    expect(await ParticipantToken.countDocuments({ form: form._id })).toBe(1);

    await deleteForm(form, owner._id).expect(200);

    expect(await Form.countDocuments({ _id: form._id })).toBe(0);
    expect(await Response.countDocuments({ form: form._id })).toBe(0);
    expect(await ParticipantToken.countDocuments({ form: form._id })).toBe(0);
    await request(app).get(`/api/v1/public/forms/${form._id}`).expect(404);
  });

  it("rejects identified and anonymous submissions after deletion commits", async () => {
    const owner = await makeUser("delete-before-submit@example.test");
    const respondent = await makeUser("authenticated-respondent@example.test");
    const identifiedForm = await makeForm(owner._id, { identityMode: "identified" });
    const anonymousForm = await makeForm(owner._id);
    const rawToken = (await request(app).post(tokenUrl(anonymousForm._id.toString())).expect(201))
      .body.data.participantToken;

    await deleteForm(identifiedForm, owner._id).expect(200);
    await deleteForm(anonymousForm, owner._id).expect(200);

    await submit(identifiedForm, { identityMode: "identified", userId: respondent._id }).expect(404);
    await submit(anonymousForm, { participantToken: rawToken }).expect(404);
    expect(await Response.countDocuments()).toBe(0);
    expect(await ParticipantToken.countDocuments()).toBe(0);
  });

  it("rejects token issuance after deletion commits", async () => {
    const owner = await makeUser("token-after-delete@example.test");
    const form = await makeForm(owner._id);

    await deleteForm(form, owner._id).expect(200);
    await request(app).post(tokenUrl(form._id.toString())).expect(404);
    expect(await ParticipantToken.countDocuments({ form: form._id })).toBe(0);
  });

  it.each([
    { operation: "identified response submission", kind: "response", identityMode: "identified", readMethod: "findById" },
    { operation: "anonymous response submission", kind: "response", identityMode: "anonymous", readMethod: "findById" },
    { operation: "anonymous participant-token issuance", kind: "issuance", identityMode: "anonymous", readMethod: "findOne" },
  ])("rejects a stale $operation after deletion wins", async ({ kind, identityMode, readMethod }) => {
    const owner = await makeUser(`stale-writer-${identityMode}-${readMethod}@example.test`);
    const respondent = await makeUser(`stale-respondent-${identityMode}-${readMethod}@example.test`);
    const form = await makeForm(owner._id, { identityMode });
    const rawToken = identityMode === "anonymous"
      ? (await request(app).post(tokenUrl(form._id.toString())).expect(201))
        .body.data.participantToken
      : undefined;
    const barrier = pauseInitialFormRead(readMethod, form._id);
    const operation = kind === "issuance"
      ? request(app).post(tokenUrl(form._id.toString()))
      : submit(form, { identityMode, participantToken: rawToken, userId: respondent._id });

    try {
      const pending = operation.then((result) => result);
      await barrier.readReached;

      await deleteForm(form, owner._id).expect(200);
      barrier.release();

      const result = await pending;
      expect(result.status).toBe(404);
      expect(result.body).toEqual({ success: false, message: "Form not found" });
      expect(await Form.exists({ _id: form._id })).toBeNull();
      expect(await Response.countDocuments({ form: form._id })).toBe(0);
      expect(await ParticipantToken.countDocuments({ form: form._id })).toBe(0);
    } finally {
      barrier.release();
      barrier.spy.mockRestore();
    }
  });

  it("serializes an in-flight Response transaction before deletion and then cascades it", async () => {
    const owner = await makeUser("overlap-owner@example.test");
    const form = await makeForm(owner._id, { identityMode: "identified" });
    const respondent = await makeUser("overlap-respondent@example.test");
    let responseInserted;
    let allowSubmissionCommit;
    let deletionFenceStarted;
    const responseInsertedSignal = new Promise((resolve) => { responseInserted = resolve; });
    const allowCommit = new Promise((resolve) => { allowSubmissionCommit = resolve; });
    const deletionFenceSignal = new Promise((resolve) => { deletionFenceStarted = resolve; });
    const createResponse = Response.create.bind(Response);
    const updateForm = Form.updateOne.bind(Form);

    vi.spyOn(Response, "create").mockImplementation(async (...args) => {
      const created = await createResponse(...args);
      responseInserted();
      await allowCommit;
      return created;
    });

    const submissionPromise = submit(form, {
      identityMode: "identified",
      userId: respondent._id,
    }).then((result) => result);

    try {
      await responseInsertedSignal;
      vi.spyOn(Form, "updateOne").mockImplementation((filter, ...args) => {
        if (filter?._id?.toString() === form._id.toString() && filter.owner) {
          deletionFenceStarted();
        }
        return updateForm(filter, ...args);
      });
      const deletionPromise = deleteForm(form, owner._id).then((result) => result);
      await deletionFenceSignal;
      allowSubmissionCommit();

      const [submissionResult, deletionResult] = await Promise.all([
        submissionPromise,
        deletionPromise,
      ]);
      expect(submissionResult.status).toBe(201);
      expect(deletionResult.status).toBe(200);
      expect(await Response.countDocuments({ form: form._id })).toBe(0);
      expect(await Form.countDocuments({ _id: form._id })).toBe(0);
    } finally {
      allowSubmissionCommit();
      vi.restoreAllMocks();
    }
  });

  it("rolls back the deletion cascade if a child cleanup operation fails", async () => {
    const owner = await makeUser("rollback-delete@example.test");
    const form = await makeForm(owner._id);
    await Response.create({ form: form._id, participantInfo: [], answers: [] });
    await ParticipantToken.create({
      form: form._id,
      tokenHash: createHash("sha256").update("rollback-token").digest("hex"),
    });
    const deleteTokens = vi.spyOn(ParticipantToken, "deleteMany")
      .mockRejectedValueOnce(new Error("simulated cleanup failure"));

    try {
      await deleteForm(form, owner._id).expect(500);
    } finally {
      deleteTokens.mockRestore();
    }

    expect(await Form.countDocuments({ _id: form._id })).toBe(1);
    expect(await Response.countDocuments({ form: form._id })).toBe(1);
    expect(await ParticipantToken.countDocuments({ form: form._id })).toBe(1);
  });

  it("rolls back the Form fence and Response if Response creation fails", async () => {
    const owner = await makeUser("rollback-response@example.test");
    const respondent = await makeUser("rollback-response-user@example.test");
    const form = await makeForm(owner._id, { identityMode: "identified" });
    const createResponse = vi.spyOn(Response, "create")
      .mockRejectedValueOnce(new Error("simulated Response insert failure"));

    try {
      await submit(form, { identityMode: "identified", userId: respondent._id }).expect(500);
    } finally {
      createResponse.mockRestore();
    }

    const storedForm = await Form.collection.findOne({ _id: form._id });
    expect(storedForm.writeFence).toBeUndefined();
    expect(await Response.countDocuments({ form: form._id })).toBe(0);
  });

  it("rolls back Response creation if token consumption fails, leaving the token reusable", async () => {
    const owner = await makeUser("rollback-token-owner@example.test");
    const form = await makeForm(owner._id);
    const rawToken = (await request(app).post(tokenUrl(form._id.toString())).expect(201))
      .body.data.participantToken;
    const fenceBeforeSubmission = (await Form.collection.findOne({ _id: form._id })).writeFence;
    const consumeToken = vi.spyOn(ParticipantToken, "findOneAndUpdate")
      .mockRejectedValueOnce(new Error("simulated token consumption failure"));

    try {
      await submit(form, { participantToken: rawToken }).expect(500);
    } finally {
      consumeToken.mockRestore();
    }

    expect(await Response.countDocuments({ form: form._id })).toBe(0);
    expect((await ParticipantToken.findOne({ form: form._id })).consumedAt).toBeNull();
    expect((await Form.collection.findOne({ _id: form._id })).writeFence)
      .toBe(fenceBeforeSubmission);

    await submit(form, { participantToken: rawToken }).expect(201);
    expect(await Response.countDocuments({ form: form._id })).toBe(1);
  });

  it("repairs an unconsumed legacy token marker without creating a duplicate Response", async () => {
    const owner = await makeUser("legacy-repair-owner@example.test");
    const form = await makeForm(owner._id);
    const rawToken = (await request(app).post(tokenUrl(form._id.toString())).expect(201))
      .body.data.participantToken;
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await Response.create({ form: form._id, participantTokenHash: tokenHash, answers: [] });

    await submit(form, { participantToken: rawToken }).expect(409);

    expect(await Response.countDocuments({ form: form._id })).toBe(1);
    expect((await ParticipantToken.findOne({ form: form._id })).consumedAt).toBeInstanceOf(Date);
  });
});
