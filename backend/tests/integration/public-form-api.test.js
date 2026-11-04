import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "phase-four-public-form-test-secret";
const PUBLIC_FORM_URL = (formId) => `/api/v1/public/forms/${formId}`;

const validPageTree = () => [
  {
    type: "welcome",
    title: "Welcome",
    description: "Start here",
    order: 1,
    blocks: [
      { type: "heading", order: 1, data: { text: "Welcome", internalNote: "hidden" } },
      { type: "text", order: 2, data: { text: "Please respond", internalNote: "hidden" } },
      { type: "image", order: 3, data: { url: "https://example.test/form.png", altText: "Survey", internalNote: "hidden" } },
      { type: "divider", order: 4, data: { internalNote: "hidden" } },
    ],
  },
  {
    type: "participant_info",
    title: "About you",
    description: "Optional details",
    order: 2,
    blocks: [
      { type: "email", order: 1, data: { question: "Email", required: true, placeholder: "name@example.test", internalNote: "hidden" } },
    ],
  },
  {
    type: "questions",
    title: "Questions",
    description: "Your feedback",
    order: 3,
    blocks: [
      { type: "short_text", order: 1, data: { question: "Short answer", required: false, placeholder: "Type here", minLength: 1, maxLength: 100, internalNote: "hidden" } },
      { type: "long_text", order: 2, data: { question: "Long answer", required: false, placeholder: "More detail", minLength: 1, maxLength: 500, internalNote: "hidden" } },
      { type: "phone", order: 3, data: { question: "Phone", required: false, placeholder: "555-0100", internalNote: "hidden" } },
      { type: "number", order: 4, data: { question: "Number", required: false, min: 1, max: 10, placeholder: "5", internalNote: "hidden" } },
      { type: "date", order: 5, data: { question: "Date", required: false, minDate: "2026-01-01", maxDate: "2026-12-31", internalNote: "hidden" } },
      { type: "single_choice", order: 6, data: { question: "Single", required: false, options: [{ label: "A", internalNote: "hidden" }], internalNote: "hidden" } },
      { type: "multiple_choice", order: 7, data: { question: "Multiple", required: false, options: [{ label: "A" }, { label: "B" }], maxSelections: 2, internalNote: "hidden" } },
      { type: "dropdown", order: 8, data: { question: "Dropdown", required: false, options: [{ label: "One" }], internalNote: "hidden" } },
      { type: "rating", order: 9, data: { question: "Rating", required: false, style: "stars", scale: 5, internalNote: "hidden" } },
    ],
  },
  {
    type: "ending",
    title: "Thank you",
    description: "Your response is saved",
    order: 4,
    blocks: [],
  },
];

const createForm = (overrides = {}) => Form.create({
  owner: new mongoose.Types.ObjectId(),
  title: "Customer feedback",
  description: "Tell us about your experience.",
  status: "published",
  settings: { identityMode: "identified", internalFlag: "do not expose" },
  access: { type: "open" },
  pages: validPageTree(),
  ...overrides,
});

describe("Public published Form API", () => {
  let previousJwtSecret;

  beforeAll(async () => {
    await startTestDatabase();
    await Form.init();
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
  });

  it("returns a public allowlisted DTO without authentication and preserves all supported block configurations and IDs", async () => {
    const form = await createForm();
    const response = await request(app)
      .get(PUBLIC_FORM_URL(form._id.toString()))
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      _id: form._id.toString(),
      title: "Customer feedback",
      description: "Tell us about your experience.",
      identityMode: "identified",
      pages: [
        { _id: form.pages[0]._id.toString(), type: "welcome", title: "Welcome", description: "Start here", order: 1 },
        { _id: form.pages[1]._id.toString(), type: "participant_info", title: "About you", description: "Optional details", order: 2 },
        { _id: form.pages[2]._id.toString(), type: "questions", title: "Questions", description: "Your feedback", order: 3 },
        { _id: form.pages[3]._id.toString(), type: "ending", title: "Thank you", description: "Your response is saved", order: 4 },
      ],
    });

    const returnedBlocks = response.body.data.pages.flatMap((page) => page.blocks);
    const originalBlocks = form.pages.flatMap((page) => page.blocks);
    expect(returnedBlocks.map((block) => block._id)).toEqual(
      originalBlocks.map((block) => block._id.toString())
    );
    expect(returnedBlocks.map((block) => block.type)).toEqual([
      "heading", "text", "image", "divider", "email", "short_text", "long_text",
      "phone", "number", "date", "single_choice", "multiple_choice", "dropdown", "rating",
    ]);

    const blocksByType = Object.fromEntries(returnedBlocks.map((block) => [block.type, block]));
    expect(blocksByType.heading.data).toEqual({ text: "Welcome" });
    expect(blocksByType.image.data).toEqual({ url: "https://example.test/form.png", altText: "Survey" });
    expect(blocksByType.email.data).toMatchObject({ question: "Email", required: true, placeholder: "name@example.test" });
    expect(blocksByType.short_text.data).toMatchObject({ minLength: 1, maxLength: 100 });
    expect(blocksByType.number.data).toMatchObject({ min: 1, max: 10 });
    expect(blocksByType.date.data).toMatchObject({ minDate: "2026-01-01", maxDate: "2026-12-31" });
    expect(blocksByType.single_choice.data.options).toEqual([{ label: "A" }]);
    expect(blocksByType.multiple_choice.data.maxSelections).toBe(2);
    expect(blocksByType.rating.data).toMatchObject({ style: "stars", scale: 5 });

    expect(response.body.data).not.toHaveProperty("owner");
    expect(response.body.data).not.toHaveProperty("access");
    expect(response.body.data).not.toHaveProperty("__v");
    expect(response.body.data).not.toHaveProperty("createdAt");
    expect(response.body.data).not.toHaveProperty("updatedAt");
    expect(response.body.data).not.toHaveProperty("internalFlag");
    expect(JSON.stringify(response.body)).not.toContain("codeHash");
    expect(JSON.stringify(response.body)).not.toContain("do not expose");
    expect(JSON.stringify(response.body)).not.toContain("internalNote");
  });

  it("returns the same 404 response for Draft, Closed, code-protected, missing, and malformed Forms", async () => {
    const draft = await createForm({ status: "draft" });
    const closed = await createForm({ status: "closed" });
    const codeProtected = await createForm({ access: { type: "code", codeHash: "not-returned" } });
    const missingId = new mongoose.Types.ObjectId().toString();

    const unavailable = await Promise.all([
      draft._id.toString(),
      closed._id.toString(),
      codeProtected._id.toString(),
      missingId,
      "not-an-object-id",
      "123456789012",
    ].map((formId) => request(app).get(PUBLIC_FORM_URL(formId))));

    expect(unavailable.map(({ status }) => status)).toEqual([404, 404, 404, 404, 404, 404]);
    for (const response of unavailable) {
      expect(response.body).toEqual({ success: false, message: "Form not found" });
    }
  });

  it("keeps the existing owner detail route authenticated and owner-scoped", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const form = await createForm({ owner: ownerId });
    const ownerToken = jwt.sign({ id: ownerId.toString() }, TEST_SECRET);
    const otherUserToken = jwt.sign({ id: otherUserId.toString() }, TEST_SECRET);

    await request(app)
      .get(`/api/v1/forms/${form._id}`)
      .expect(401);

    await request(app)
      .get(`/api/v1/forms/${form._id}`)
      .set("Authorization", `Bearer ${otherUserToken}`)
      .expect(404);

    const ownerResponse = await request(app)
      .get(`/api/v1/forms/${form._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(200);

    expect(ownerResponse.body).toMatchObject({ success: true, data: { _id: form._id.toString() } });
  });
});
