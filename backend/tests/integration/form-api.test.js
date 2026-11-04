import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import User from "../../src/modules/user/user.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "phase-three-form-api-test-secret";
const TEST_EXPIRES_IN = "1h";

const validBuilderPages = () => [
  {
    type: "welcome",
    title: "Welcome",
    blocks: [{ type: "heading", data: { text: "Welcome" } }],
  },
  {
    type: "questions",
    title: "Questions",
    blocks: [{ type: "short_text", data: { question: "Feedback", required: false } }],
  },
  {
    type: "ending",
    title: "Ending",
    blocks: [{ type: "text", data: { text: "Thank you" } }],
  },
];

describe("Form API routes", () => {
  let testDatabaseUri;
  let previousJwtSecret;
  let previousJwtExpiresIn;

  beforeAll(async () => {
    testDatabaseUri = await startTestDatabase();
    await Form.init();
    await User.init();

    previousJwtSecret = process.env.JWT_SECRET;
    previousJwtExpiresIn = process.env.JWT_EXPIRES_IN;
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.JWT_EXPIRES_IN = TEST_EXPIRES_IN;
  });

  afterAll(async () => {
    if (previousJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousJwtSecret;
    }

    if (previousJwtExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = previousJwtExpiresIn;
    }

    await stopTestDatabase();
  });

  beforeEach(async () => {
    await Form.deleteMany({});
    await User.deleteMany({});
  });

  const registerAndLogin = async (email, firstName = "Taylor") => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        firstName,
        lastName: "Tester",
        email,
        password: "phase3-test-password",
      })
      .expect(201);

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "phase3-test-password" })
      .expect(200);

    expect(login.body.data.token).toEqual(expect.any(String));
    return {
      token: login.body.data.token,
      userId: login.body.data.user._id,
    };
  };

  const createDraftThroughApi = async (token, title = "Draft Form") => {
    const response = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${token}`)
      .send({ title })
      .expect(201);

    return response.body.data;
  };

  it("enforces authentication and request validation on Form routes", async () => {
    await request(app)
      .post("/api/v1/forms")
      .send({ title: "No auth" })
      .expect(401);

    const user = await registerAndLogin("form-validation@example.test");

    const missingTitle = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${user.token}`)
      .send({})
      .expect(400);

    expect(missingTitle.body).toMatchObject({
      success: false,
      message: expect.any(String),
    });

    const form = await createDraftThroughApi(user.token);
    const invalidBuilder = await request(app)
      .put(`/api/v1/forms/${form._id}/builder`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ pages: "not-an-array" })
      .expect(400);

    expect(invalidBuilder.body).toMatchObject({
      success: false,
      message: expect.any(String),
    });
  });

  it("prevents a second authenticated user from modifying or publishing the owner's Form", async () => {
    const owner = await registerAndLogin("form-owner@example.test", "Owner");
    const secondUser = await registerAndLogin("form-second-user@example.test", "Second");
    expect(secondUser.userId).not.toBe(owner.userId);

    const form = await createDraftThroughApi(owner.token, "Owner's draft");
    const originalPages = validBuilderPages();
    originalPages[0].title = "Original welcome";

    await request(app)
      .put(`/api/v1/forms/${form._id}/builder`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ pages: originalPages })
      .expect(200);

    const attemptedEditPages = validBuilderPages();
    attemptedEditPages[0].title = "Unauthorized change";

    const editResponse = await request(app)
      .put(`/api/v1/forms/${form._id}/builder`)
      .set("Authorization", `Bearer ${secondUser.token}`)
      .send({ pages: attemptedEditPages })
      .expect(400);

    expect(editResponse.body).toMatchObject({
      success: false,
      message: "Form not found",
    });

    const publishResponse = await request(app)
      .post(`/api/v1/forms/${form._id}/publish`)
      .set("Authorization", `Bearer ${secondUser.token}`)
      .expect(404);

    expect(publishResponse.body).toMatchObject({ message: "Form not found" });

    const stored = await Form.findById(form._id);
    expect(stored.status).toBe("draft");
    expect(stored.pages[0].title).toBe("Original welcome");
  });

  it("publishes valid Forms and preserves published-content restrictions through the API", async () => {
    const user = await registerAndLogin("form-publish@example.test");
    const form = await createDraftThroughApi(user.token, "Publishable Form");

    await request(app)
      .put(`/api/v1/forms/${form._id}/builder`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ pages: validBuilderPages() })
      .expect(200);

    const publishResponse = await request(app)
      .post(`/api/v1/forms/${form._id}/publish`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(publishResponse.body).toMatchObject({
      message: "Form published successfully",
      data: { _id: form._id, status: "published" },
    });

    const republishResponse = await request(app)
      .post(`/api/v1/forms/${form._id}/publish`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(400);
    expect(republishResponse.body).toMatchObject({ message: "Form is already published" });

    const updateResponse = await request(app)
      .patch(`/api/v1/forms/${form._id}`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ title: "Changed after publish" })
      .expect(400);
    expect(updateResponse.body).toMatchObject({
      success: false,
      message: "Form content can only be changed for draft forms",
    });

    const builderResponse = await request(app)
      .put(`/api/v1/forms/${form._id}/builder`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ pages: validBuilderPages() })
      .expect(400);
    expect(builderResponse.body).toMatchObject({
      success: false,
      message: "Form content can only be changed for draft forms",
    });
  });

  it("publishes a legacy Form containing multiple supported block types", async () => {
    const user = await registerAndLogin("form-multiple-block-types@example.test");
    const form = await Form.create({
      owner: new mongoose.Types.ObjectId(user.userId),
      title: "Multiple supported blocks",
      status: "draft",
      pages: [
        {
          type: "welcome",
          order: 1,
          blocks: [
            { type: "heading", order: 1, data: { text: "Welcome" } },
            { type: "divider", order: 2, data: {} },
            { type: "image", order: 3, data: { url: "https://example.test/image.png", altText: "Survey image" } },
          ],
        },
        {
          type: "participant_info",
          order: 2,
          blocks: [{ type: "email", order: 1, data: { question: "Email", required: false } }],
        },
        {
          type: "questions",
          order: 3,
          blocks: [
            { type: "short_text", order: 1, data: { question: "Feedback", required: false } },
            { type: "single_choice", order: 2, data: { question: "Rating", required: true, options: [{ label: "Good" }] } },
            { type: "rating", order: 3, data: { question: "Stars", required: false, style: "stars", scale: 5 } },
          ],
        },
        {
          type: "ending",
          order: 4,
          blocks: [{ type: "text", order: 1, data: { text: "Thank you" } }],
        },
      ],
    });

    const result = await request(app)
      .post(`/api/v1/forms/${form._id}/publish`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(result.body.data.status).toBe("published");
    expect((await Form.findById(form._id)).status).toBe("published");
  });

  it("rejects invalid legacy block data with a location and leaves the Form in Draft", async () => {
    const user = await registerAndLogin("form-invalid-block-data@example.test");
    const form = await Form.create({
      owner: new mongoose.Types.ObjectId(user.userId),
      title: "Invalid legacy block data",
      status: "draft",
      pages: [
        { type: "welcome", order: 1, blocks: [] },
        {
          type: "questions",
          order: 2,
          blocks: [
            { type: "long_text", order: 1, data: { question: "Valid prompt" } },
            { type: "email", order: 2, data: { required: true } },
          ],
        },
        { type: "ending", order: 3, blocks: [] },
      ],
    });

    const result = await request(app)
      .post(`/api/v1/forms/${form._id}/publish`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(400);

    expect(result.body.message).toBe("Form cannot be published");
    expect(result.body.errors).toEqual(expect.arrayContaining([
      expect.stringMatching(/page 2 .*block 2 .*email.*data\.question/),
    ]));
    expect((await Form.findById(form._id)).status).toBe("draft");
  });

  it("rejects invalid block data on non-question pages", async () => {
    const user = await registerAndLogin("form-invalid-welcome-block@example.test");
    const form = await Form.create({
      owner: new mongoose.Types.ObjectId(user.userId),
      title: "Invalid welcome block",
      status: "draft",
      pages: [
        {
          type: "welcome",
          order: 1,
          blocks: [{ type: "heading", order: 1, data: {} }],
        },
        {
          type: "questions",
          order: 2,
          blocks: [{ type: "short_text", order: 1, data: { question: "Question" } }],
        },
        { type: "ending", order: 3, blocks: [] },
      ],
    });

    const result = await request(app)
      .post(`/api/v1/forms/${form._id}/publish`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(400);

    expect(result.body.errors).toEqual(expect.arrayContaining([
      expect.stringMatching(/page 1 .*block 1 .*heading.*data\.text/),
    ]));
    expect((await Form.findById(form._id)).status).toBe("draft");
  });

  it("rejects unsupported block types found in legacy Forms", async () => {
    const user = await registerAndLogin("form-unsupported-block@example.test");
    const form = await Form.create({
      owner: new mongoose.Types.ObjectId(user.userId),
      title: "Unsupported legacy block",
      status: "draft",
      pages: [
        { type: "welcome", order: 1, blocks: [] },
        {
          type: "questions",
          order: 2,
          blocks: [
            { type: "short_text", order: 1, data: { question: "Question" } },
            { type: "heading", order: 2, data: { text: "Legacy display block" } },
          ],
        },
        { type: "ending", order: 3, blocks: [] },
      ],
    });

    await Form.collection.updateOne(
      { _id: form._id },
      { $set: { "pages.1.blocks.1.type": "legacy_custom" } }
    );

    const result = await request(app)
      .post(`/api/v1/forms/${form._id}/publish`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(400);

    expect(result.body.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('page 2 ('),
      expect.stringMatching(/block 2 .*unsupported block type "legacy_custom"/),
    ]));
    expect((await Form.findById(form._id)).status).toBe("draft");
  });

  it("rejects publishing invalid legacy Forms and reports missing Forms", async () => {
    const user = await registerAndLogin("form-invalid-publish@example.test");
    const invalidLegacyForm = await Form.create({
      owner: new mongoose.Types.ObjectId(user.userId),
      title: "Legacy invalid Form",
      status: "draft",
      pages: [
        {
          type: "welcome",
          order: 1,
          blocks: [
            { type: "short_text", order: 1, data: { question: "Invalid welcome field" } },
          ],
        },
        {
          type: "questions",
          order: 2,
          blocks: [{ type: "short_text", order: 1, data: { question: "Question" } }],
        },
        { type: "ending", order: 3, blocks: [] },
      ],
    });

    const invalidPublish = await request(app)
      .post(`/api/v1/forms/${invalidLegacyForm._id}/publish`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(400);

    expect(invalidPublish.body).toMatchObject({
      message: "Form cannot be published",
      errors: expect.arrayContaining([
        "welcome pages cannot contain answerable blocks",
      ]),
    });

    const missingFormId = new mongoose.Types.ObjectId().toString();
    const missingPublish = await request(app)
      .post(`/api/v1/forms/${missingFormId}/publish`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(404);

    expect(missingPublish.body).toMatchObject({ message: "Form not found" });
  });
});
