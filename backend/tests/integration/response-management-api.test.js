import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import Response from "../../src/modules/response/response.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "response-management-test-secret";
const listUrl = (formId) => `/api/v1/forms/${formId}/responses`;
const detailUrl = (formId, responseId) => `${listUrl(formId)}/${responseId}`;
const tokenFor = (userId) => jwt.sign({ id: userId.toString(), role: "user" }, TEST_SECRET);

const makeForm = (owner, status = "draft") => Form.create({
  owner,
  title: "Response management form",
  status,
});

const makeResponse = (form, overrides = {}) => Response.create({
  form: form._id,
  submittedAt: new Date(),
  ...overrides,
});

describe("Owner-scoped Response management API", () => {
  let previousJwtSecret;

  beforeAll(async () => {
    await startTestDatabase();
    await Form.init();
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
    await Promise.all([Form.deleteMany({}), Response.deleteMany({})]);
  });

  it("requires authentication for both list and detail routes", async () => {
    const owner = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);
    const response = await makeResponse(form);

    await request(app).get(listUrl(form._id)).expect(401);
    await request(app).get(detailUrl(form._id, response._id)).expect(401);
  });

  it("lets the owner list Responses for a Draft Form with only summary fields", async () => {
    const owner = new mongoose.Types.ObjectId();
    const form = await makeForm(owner, "draft");
    await makeResponse(form, {
      answers: [{ questionId: new mongoose.Types.ObjectId(), value: "private answer" }],
    });
    await makeResponse(form, {
      answers: [{ questionId: new mongoose.Types.ObjectId(), value: "another answer" }],
    });

    const result = await request(app)
      .get(listUrl(form._id))
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(200);

    expect(result.body.success).toBe(true);
    expect(result.body.data).toHaveLength(2);
    expect(Object.keys(result.body.data[0]).sort()).toEqual(["responseId", "submittedAt"]);
    expect(JSON.stringify(result.body)).not.toContain("private answer");
    expect(result.body.pagination).toEqual({ page: 1, limit: 25, total: 2, totalPages: 1 });
  });

  it("lets the owner inspect anonymous and identified Responses without exposing internal fields", async () => {
    const owner = new mongoose.Types.ObjectId();
    const respondent = new mongoose.Types.ObjectId();
    const form = await makeForm(owner, "closed");
    const anonymous = await makeResponse(form, {
      participantTokenHash: "a".repeat(64),
      participantInfo: [{ questionId: new mongoose.Types.ObjectId(), value: "anon@example.test" }],
      answers: [{ questionId: new mongoose.Types.ObjectId(), value: "anonymous answer" }],
    });
    const identified = await makeResponse(form, {
      respondentUser: respondent,
      participantInfo: [],
      answers: [{ questionId: new mongoose.Types.ObjectId(), value: "identified answer" }],
    });

    const listResult = await request(app)
      .get(listUrl(form._id))
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(200);
    const anonymousResult = await request(app)
      .get(detailUrl(form._id, anonymous._id))
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(200);
    const identifiedResult = await request(app)
      .get(detailUrl(form._id, identified._id))
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(200);

    expect(listResult.body.data.map(({ responseId }) => responseId)).toEqual(
      expect.arrayContaining([anonymous._id.toString(), identified._id.toString()])
    );
    expect(listResult.body.data.every((entry) =>
      Object.keys(entry).sort().join(",") === "responseId,submittedAt"
    )).toBe(true);

    expect(anonymousResult.body.data).toEqual({
      responseId: anonymous._id.toString(),
      submittedAt: anonymous.submittedAt.toISOString(),
      participantInfo: [{
        questionId: anonymous.participantInfo[0].questionId.toString(),
        value: "anon@example.test",
      }],
      answers: [{
        questionId: anonymous.answers[0].questionId.toString(),
        value: "anonymous answer",
      }],
    });
    expect(identifiedResult.body.data).toEqual({
      responseId: identified._id.toString(),
      submittedAt: identified.submittedAt.toISOString(),
      participantInfo: [],
      answers: [{
        questionId: identified.answers[0].questionId.toString(),
        value: "identified answer",
      }],
    });

    for (const result of [anonymousResult, identifiedResult]) {
      expect(Object.keys(result.body.data).sort()).toEqual([
        "answers",
        "participantInfo",
        "responseId",
        "submittedAt",
      ]);
      expect(JSON.stringify(result.body)).not.toContain("respondentUser");
      expect(JSON.stringify(result.body)).not.toContain("participantTokenHash");
      expect(JSON.stringify(result.body)).not.toContain("a".repeat(64));
      expect(result.body.data).not.toHaveProperty("_id");
      expect(result.body.data).not.toHaveProperty("__v");
      expect(result.body.data).not.toHaveProperty("form");
    }
  });

  it("returns an empty list and zero totals when the Form has no Responses", async () => {
    const owner = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);

    const result = await request(app)
      .get(listUrl(form._id))
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(200);

    expect(result.body).toEqual({
      success: true,
      data: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
  });

  it("paginates with default and custom page and limit values", async () => {
    const owner = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);
    const rows = [];
    for (let index = 0; index < 30; index += 1) {
      rows.push(await makeResponse(form, { submittedAt: new Date(1_700_000_000_000 + index * 1000) }));
    }

    const defaultPage = await request(app)
      .get(listUrl(form._id))
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(200);
    expect(defaultPage.body.data).toHaveLength(25);
    expect(defaultPage.body.pagination).toEqual({ page: 1, limit: 25, total: 30, totalPages: 2 });

    const customPage = await request(app)
      .get(`${listUrl(form._id)}?page=2&limit=5`)
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(200);
    expect(customPage.body.data).toHaveLength(5);
    expect(customPage.body.pagination).toEqual({ page: 2, limit: 5, total: 30, totalPages: 6 });
    expect(customPage.body.data[0].responseId).toBe(rows[24]._id.toString());
  });

  it("rejects limits above 100 and accepts the maximum", async () => {
    const owner = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);
    const authHeader = `Bearer ${tokenFor(owner)}`;

    await request(app).get(`${listUrl(form._id)}?limit=101`).set("Authorization", authHeader).expect(400);
    const maximum = await request(app)
      .get(`${listUrl(form._id)}?limit=100`)
      .set("Authorization", authHeader)
      .expect(200);
    expect(maximum.body.pagination.limit).toBe(100);
  });

  it("accepts the largest allowed page", async () => {
    const owner = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);

    const result = await request(app)
      .get(`${listUrl(form._id)}?page=1000`)
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(200);

    expect(result.body.pagination).toEqual({ page: 1000, limit: 25, total: 0, totalPages: 0 });
  });

  it.each([
    ["page="],
    ["page=%20%20"],
    ["page=0"],
    ["page=-1"],
    ["page=1.5"],
    ["page=1e3"],
    ["page=0x10"],
    ["page=abc"],
    ["page=1&page=2"],
    ["page=1001"],
    ["limit="],
    ["limit=%20%20"],
    ["limit=0"],
    ["limit=-1"],
    ["limit=1.5"],
    ["limit=1e3"],
    ["limit=0x10"],
    ["limit=5&limit=10"],
    ["limit=101"],
    ["sort=sideways"],
    ["extra=value"],
  ])("rejects malformed or unknown list query parameters (%s)", async (query) => {
    const owner = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);

    await request(app)
      .get(`${listUrl(form._id)}?${query}`)
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(400);
  });

  it("sorts by submittedAt in both directions and orders timestamp ties by ID", async () => {
    const owner = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);
    const timestamp = new Date("2026-01-01T00:00:00.000Z");
    const ids = ["000000000000000000000001", "000000000000000000000002", "000000000000000000000003"];
    for (const id of ids) {
      await makeResponse(form, { _id: new mongoose.Types.ObjectId(id), submittedAt: timestamp });
    }

    const authHeader = `Bearer ${tokenFor(owner)}`;
    const desc = await request(app)
      .get(`${listUrl(form._id)}?sort=desc`)
      .set("Authorization", authHeader)
      .expect(200);
    const asc = await request(app)
      .get(`${listUrl(form._id)}?sort=asc`)
      .set("Authorization", authHeader)
      .expect(200);

    expect(desc.body.data.map(({ responseId }) => responseId)).toEqual([...ids].reverse());
    expect(asc.body.data.map(({ responseId }) => responseId)).toEqual(ids);
  });

  it("does not let another owner list or inspect Responses", async () => {
    const owner = new mongoose.Types.ObjectId();
    const otherUser = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);
    const response = await makeResponse(form);
    const authHeader = `Bearer ${tokenFor(otherUser)}`;

    await request(app).get(listUrl(form._id)).set("Authorization", authHeader).expect(404);
    await request(app)
      .get(detailUrl(form._id, response._id))
      .set("Authorization", authHeader)
      .expect(404);
  });

  it.each(["draft", "published", "closed"])(
    "lets the owner read existing Responses when the Form is %s",
    async (status) => {
      const owner = new mongoose.Types.ObjectId();
      const form = await makeForm(owner, status);
      const response = await makeResponse(form);
      const authHeader = `Bearer ${tokenFor(owner)}`;

      await request(app).get(listUrl(form._id)).set("Authorization", authHeader).expect(200);
      await request(app)
        .get(detailUrl(form._id, response._id))
        .set("Authorization", authHeader)
        .expect(200);
    }
  );

  it("does not expose a Response through another Form URL", async () => {
    const owner = new mongoose.Types.ObjectId();
    const firstForm = await makeForm(owner);
    const secondForm = await makeForm(owner);
    const response = await makeResponse(secondForm);

    await request(app)
      .get(detailUrl(firstForm._id, response._id))
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(404);
  });

  it("returns 400 for malformed IDs and 404 for missing Forms or Responses", async () => {
    const owner = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);
    const authHeader = `Bearer ${tokenFor(owner)}`;
    const missingFormId = new mongoose.Types.ObjectId();
    const missingResponseId = new mongoose.Types.ObjectId();

    await request(app).get(listUrl("not-a-form-id")).set("Authorization", authHeader).expect(400);
    await request(app)
      .get(detailUrl(form._id, "not-a-response-id"))
      .set("Authorization", authHeader)
      .expect(400);
    await request(app)
      .get(listUrl(missingFormId))
      .set("Authorization", authHeader)
      .expect(404);
    await request(app)
      .get(detailUrl(missingFormId, missingResponseId))
      .set("Authorization", authHeader)
      .expect(404);
    await request(app)
      .get(detailUrl(form._id, missingResponseId))
      .set("Authorization", authHeader)
      .expect(404);
  });

  it("returns an empty participantInfo array for a legacy persisted Response", async () => {
    const owner = new mongoose.Types.ObjectId();
    const respondent = new mongoose.Types.ObjectId();
    const form = await makeForm(owner);
    const responseId = new mongoose.Types.ObjectId();
    const questionId = new mongoose.Types.ObjectId();
    const submittedAt = new Date("2025-04-03T12:30:00.000Z");

    await Response.collection.insertOne({
      _id: responseId,
      form: form._id,
      respondentUser: respondent,
      answers: [{ questionId, value: "legacy answer" }],
      submittedAt,
      createdAt: submittedAt,
      updatedAt: submittedAt,
    });

    const result = await request(app)
      .get(detailUrl(form._id, responseId))
      .set("Authorization", `Bearer ${tokenFor(owner)}`)
      .expect(200);

    expect(result.body.data).toEqual({
      responseId: responseId.toString(),
      submittedAt: submittedAt.toISOString(),
      participantInfo: [],
      answers: [{ questionId: questionId.toString(), value: "legacy answer" }],
    });
    const stored = await Response.collection.findOne({ _id: responseId });
    expect(Object.hasOwn(stored, "participantInfo")).toBe(false);
  });
});
