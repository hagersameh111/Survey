import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import { publishForm, saveBuilder } from "../../src/modules/form/form.service.js";
import Response from "../../src/modules/response/response.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "phase-two-integration-test-secret";
const ownerId = new mongoose.Types.ObjectId();

describe("isolated integration setup", () => {
  let testDatabaseUri;
  let previousJwtSecret;

  beforeAll(async () => {
    testDatabaseUri = await startTestDatabase();
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
    await Form.deleteMany({});
    await Response.deleteMany({});
  });

  it("connects to MongoDB Memory Server and exercises the Express app", async () => {
    expect(testDatabaseUri).toMatch(/^mongodb:\/\/127\.0\.0\.1:/);
    expect(mongoose.connection.readyState).toBe(1);
    expect(mongoose.connection.name).toBe("survey_backend_test");

    await request(app).get("/api/v1/forms").expect(401);
  });

  it("rejects answerable blocks on welcome and ending during builder save", async () => {
    const form = await Form.create({ owner: ownerId, title: "Builder rules", status: "draft" });
    const answerableBlock = {
      type: "short_text",
      data: { question: "Unsupported", required: false },
    };

    await expect(
      saveBuilder(form._id, ownerId, {
        pages: [{ type: "welcome", blocks: [answerableBlock] }],
      })
    ).rejects.toThrow("welcome pages cannot contain answerable blocks");

    await expect(
      saveBuilder(form._id, ownerId, {
        pages: [
          { type: "welcome", blocks: [] },
          { type: "ending", blocks: [answerableBlock] },
        ],
      })
    ).rejects.toThrow("ending pages cannot contain answerable blocks");
  });

  it("allows one participant-info page and question blocks during builder save", async () => {
    const form = await Form.create({ owner: ownerId, title: "Valid builder", status: "draft" });

    const saved = await saveBuilder(form._id, ownerId, {
      pages: [
        { type: "welcome", blocks: [{ type: "heading", data: { text: "Welcome" } }] },
        {
          type: "participant_info",
          blocks: [{ type: "email", data: { question: "Email", required: true } }],
        },
        {
          type: "questions",
          blocks: [{ type: "single_choice", data: { question: "Choice", required: true, options: [{ label: "A" }] } }],
        },
        { type: "ending", blocks: [{ type: "text", data: { text: "Thanks" } }] },
      ],
    });

    expect(saved.pages.map((page) => page.type)).toEqual([
      "welcome",
      "participant_info",
      "questions",
      "ending",
    ]);

    await expect(
      saveBuilder(form._id, ownerId, {
        pages: [
          { type: "welcome", blocks: [] },
          { type: "participant_info", blocks: [] },
          { type: "participant_info", blocks: [] },
          { type: "questions", blocks: [] },
        ],
      })
    ).rejects.toThrow("Participant info page can only exist once");
  });

  it.each(["welcome", "ending"])(
    "prevents publishing a legacy Form with answerable blocks on %s",
    async (unsupportedPageType) => {
      const pages = [
        { type: "welcome", order: 1, blocks: [] },
        {
          type: "questions",
          order: 2,
          blocks: [{ type: "short_text", order: 1, data: { question: "Question", required: false } }],
        },
        { type: "ending", order: 3, blocks: [] },
      ];
      const targetPage = pages.find((page) => page.type === unsupportedPageType);
      targetPage.blocks.push({
        type: "email",
        order: targetPage.blocks.length + 1,
        data: { question: "Legacy answerable block", required: false },
      });
      const form = await Form.create({ owner: ownerId, title: "Legacy invalid", status: "draft", pages });

      await expect(publishForm(form._id, ownerId)).rejects.toMatchObject({
        details: expect.arrayContaining([
          `${unsupportedPageType} pages cannot contain answerable blocks`,
        ]),
      });
    }
  );

  it("publishes a valid Form with participant-info and question blocks", async () => {
    const form = await Form.create({
      owner: ownerId,
      title: "Valid form",
      status: "draft",
      pages: [
        { type: "welcome", order: 1, blocks: [] },
        {
          type: "participant_info",
          order: 2,
          blocks: [{ type: "email", order: 1, data: { question: "Email", required: false } }],
        },
        {
          type: "questions",
          order: 3,
          blocks: [{ type: "single_choice", order: 1, data: { question: "Choice", required: true, options: [{ label: "A" }] } }],
        },
        { type: "ending", order: 4, blocks: [] },
      ],
    });

    const published = await publishForm(form._id, ownerId);

    expect(published.status).toBe("published");
  });

  it("prevents publishing a legacy Form with more than one participant-info page", async () => {
    const form = await Form.create({
      owner: ownerId,
      title: "Duplicate participant pages",
      status: "draft",
      pages: [
        { type: "welcome", order: 1, blocks: [] },
        { type: "participant_info", order: 2, blocks: [] },
        { type: "participant_info", order: 3, blocks: [] },
        {
          type: "questions",
          order: 4,
          blocks: [{ type: "short_text", order: 1, data: { question: "Question", required: false } }],
        },
        { type: "ending", order: 5, blocks: [] },
      ],
    });

    await expect(publishForm(form._id, ownerId)).rejects.toMatchObject({
      details: expect.arrayContaining(["Participant info page can only exist once"]),
    });
  });

  it("keeps the existing request contract and stores response values by page", async () => {
    const form = await Form.create({
      owner: ownerId,
      title: "Submission form",
      status: "published",
      settings: { identityMode: "identified" },
      access: { type: "open" },
      pages: [
        { type: "welcome", order: 1, blocks: [] },
        {
          type: "participant_info",
          order: 2,
          blocks: [
            { type: "email", order: 1, data: { question: "Email", required: true } },
            { type: "short_text", order: 2, data: { question: "Name", required: true } },
          ],
        },
        {
          type: "questions",
          order: 3,
          blocks: [{ type: "single_choice", order: 1, data: { question: "Choice", required: true, options: [{ label: "A" }] } }],
        },
        { type: "ending", order: 4, blocks: [] },
      ],
    });
    const infoPage = form.pages.find((page) => page.type === "participant_info");
    const questionPage = form.pages.find((page) => page.type === "questions");
    const token = jwt.sign({ id: ownerId.toString(), role: "user" }, TEST_SECRET);

    const response = await request(app)
      .post(`/api/v1/forms/${form._id}/responses`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        answers: [
          { questionId: infoPage.blocks[0]._id.toString(), value: "person@example.com" },
          { questionId: infoPage.blocks[1]._id.toString(), value: "Sam" },
          { questionId: questionPage.blocks[0]._id.toString(), value: "A" },
        ],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        responseId: expect.any(String),
        submittedAt: expect.any(String),
      },
    });

    const stored = await Response.findById(response.body.data.responseId);
    expect(stored.participantInfo.map((entry) => ({
      questionId: entry.questionId.toString(),
      value: entry.value,
    }))).toEqual([
      { questionId: infoPage.blocks[0]._id.toString(), value: "person@example.com" },
      { questionId: infoPage.blocks[1]._id.toString(), value: "Sam" },
    ]);
    expect(stored.answers.map((entry) => ({
      questionId: entry.questionId.toString(),
      value: entry.value,
    }))).toEqual([
      { questionId: questionPage.blocks[0]._id.toString(), value: "A" },
    ]);
    expect(stored.respondentUser.toString()).toBe(ownerId.toString());
  });

  it("returns existing invalid-submission and auth statuses", async () => {
    const identifiedForm = await Form.create({
      owner: ownerId,
      title: "Identified form",
      status: "published",
      settings: { identityMode: "identified" },
      access: { type: "open" },
      pages: [
        { type: "welcome", order: 1, blocks: [] },
        { type: "questions", order: 2, blocks: [{ type: "short_text", order: 1, data: { question: "Required", required: true } }] },
        { type: "ending", order: 3, blocks: [] },
      ],
    });
    const anonymousForm = await Form.create({
      owner: ownerId,
      title: "Anonymous form",
      status: "published",
      settings: { identityMode: "anonymous" },
      access: { type: "open" },
      pages: [
        { type: "welcome", order: 1, blocks: [] },
        { type: "questions", order: 2, blocks: [{ type: "short_text", order: 1, data: { question: "Optional", required: false } }] },
        { type: "ending", order: 3, blocks: [] },
      ],
    });
    const token = jwt.sign({ id: ownerId.toString() }, TEST_SECRET);

    await request(app)
      .post(`/api/v1/forms/${identifiedForm._id}/responses`)
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: [] })
      .expect(400);

    await request(app)
      .post(`/api/v1/forms/${identifiedForm._id}/responses`)
      .send({ answers: [] })
      .expect(401);

    await request(app)
      .post(`/api/v1/forms/${anonymousForm._id}/responses`)
      .send({ answers: [] })
      .expect(401);
  });

  it("returns the existing conflict response for duplicate identified submissions", async () => {
    const form = await Form.create({
      owner: ownerId,
      title: "Duplicate submission form",
      status: "published",
      settings: { identityMode: "identified" },
      access: { type: "open" },
      pages: [
        { type: "welcome", order: 1, blocks: [] },
        { type: "questions", order: 2, blocks: [] },
        { type: "ending", order: 3, blocks: [] },
      ],
    });
    const token = jwt.sign({ id: ownerId.toString(), role: "user" }, TEST_SECRET);
    const url = `/api/v1/forms/${form._id}/responses`;

    await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: [] })
      .expect(201);

    await request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: [] })
      .expect(409);
  });
});
