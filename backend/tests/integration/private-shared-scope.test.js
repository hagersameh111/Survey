import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import User from "../../src/modules/user/user.model.js";
import Workspace from "../../src/modules/workspace/workspace.model.js";
import Membership from "../../src/modules/workspace/membership.model.js";
import Subscription from "../../src/modules/workspace/subscription.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

// Covers the clarified product behavior directly: Private/Shared are tabs
// (which collection of surveys is displayed), never a visibility toggle
// (which survey is mutated). See backend/docs/workspace-concurrency.md.

const TEST_SECRET = "private-shared-scope-test-secret";

const makeUser = (email) => User.create({
  firstName: "Test",
  lastName: "User",
  email,
  password: "test-password-123",
});

const makeJwt = (userId) => jwt.sign({ id: userId.toString(), role: "user" }, TEST_SECRET);

const makeActiveWorkspace = async (ownerId, plan = "premium") => {
  const workspace = await Workspace.create({ owner: ownerId, plan });
  await Membership.create({ workspace: workspace._id, user: ownerId, role: "owner", status: "active" });
  await Subscription.create({ workspace: workspace._id, plan, status: "active" });
  return workspace;
};

const persistedPages = (label) => [
  {
    type: "welcome",
    order: 1,
    title: label,
    blocks: [{ type: "heading", order: 1, data: { text: "Welcome" } }],
  },
  {
    type: "questions",
    order: 2,
    blocks: [{ type: "short_text", order: 1, data: { question: `Prompt ${label}`, required: false } }],
  },
  {
    type: "ending",
    order: 3,
    blocks: [{ type: "text", order: 1, data: { text: "Thank you" } }],
  },
];

const makeSharedPublishedForm = (owner, workspace, label = "Shared form") => Form.create({
  owner,
  workspace: workspace._id,
  visibility: "shared",
  title: label,
  status: "published",
  settings: { identityMode: "anonymous" },
  access: { type: "open" },
  pages: persistedPages(label),
});

describe("Private/Shared scope (tabs, not a visibility toggle)", () => {
  let previousJwtSecret;

  beforeAll(async () => {
    await startTestDatabase();
    await Promise.all([Form.init(), User.init(), Workspace.init(), Membership.init(), Subscription.init()]);
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
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Membership.deleteMany({}),
      Subscription.deleteMany({}),
    ]);
  });

  it("confines a Free user (no workspace membership) to Private: no workspaces listed, no Shared access", async () => {
    const freeUser = await makeUser("free-user@example.test");
    const otherOwner = await makeUser("other-owner@example.test");
    const otherWorkspace = await makeActiveWorkspace(otherOwner._id);
    const token = makeJwt(freeUser._id);

    const workspaces = await request(app)
      .get("/api/v1/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(workspaces.body.data).toEqual([]);

    await request(app)
      .get(`/api/v1/forms?workspaceId=${otherWorkspace._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    await request(app)
      .get(`/api/v1/workspaces/${otherWorkspace._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Attempted shared form", visibility: "shared", workspaceId: otherWorkspace._id.toString() })
      .expect(403);

    // Private still works normally.
    const created = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "My private survey" })
      .expect(201);
    expect(created.body.data.visibility).toBe("private");
  });

  it("switching between Private and Shared views never changes a survey's visibility or ownership", async () => {
    const owner = await makeUser("owner-switch@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    const token = makeJwt(owner._id);

    const privateForm = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Private survey" })
      .expect(201);
    const sharedForm = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Shared survey", visibility: "shared", workspaceId: workspace._id.toString() })
      .expect(201);

    // "Switching tabs" is just choosing which query to run.
    const privateList = await request(app)
      .get("/api/v1/forms")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const sharedList = await request(app)
      .get(`/api/v1/forms?workspaceId=${workspace._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(privateList.body.data.map((f) => f._id)).toEqual([privateForm.body.data._id]);
    expect(sharedList.body.data.map((f) => f._id)).toEqual([sharedForm.body.data._id]);

    // Viewing either list a second time changes nothing about either Form.
    const privateAfter = await Form.findById(privateForm.body.data._id);
    const sharedAfter = await Form.findById(sharedForm.body.data._id);
    expect(privateAfter.visibility).toBe("private");
    expect(privateAfter.workspace).toBeNull();
    expect(sharedAfter.visibility).toBe("shared");
    expect(sharedAfter.workspace.toString()).toBe(workspace._id.toString());
  });

  it("a Shared survey cannot be converted into a personal Private survey through any API request", async () => {
    const owner = await makeUser("owner-immutable@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    const token = makeJwt(owner._id);

    const sharedForm = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Shared survey", visibility: "shared", workspaceId: workspace._id.toString() })
      .expect(201);
    const formId = sharedForm.body.data._id;

    // The update schema is `.strict()` and declares no visibility/workspace
    // fields, so attempting to set them is a validation error, not a
    // silent no-op or a successful mutation.
    const attempt = await request(app)
      .patch(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Still shared", visibility: "private", workspaceId: null })
      .expect(400);
    expect(attempt.body.success).toBe(false);

    const stored = await Form.findById(formId);
    expect(stored.visibility).toBe("shared");
    expect(stored.workspace.toString()).toBe(workspace._id.toString());
  });

  it("lets any active member — not just the owner — create, edit, publish, close, and delete Shared surveys", async () => {
    const owner = await makeUser("owner-role@example.test");
    const member = await makeUser("member-role@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    await Membership.create({ workspace: workspace._id, user: member._id, role: "member", status: "active" });
    const memberToken = makeJwt(member._id);

    const created = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ title: "Member-created survey", visibility: "shared", workspaceId: workspace._id.toString() })
      .expect(201);
    const formId = created.body.data._id;
    expect(created.body.data.owner).toBe(member._id.toString());

    await request(app)
      .patch(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ title: "Member-edited survey" })
      .expect(200);

    await request(app)
      .put(`/api/v1/forms/${formId}/builder`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        pages: [
          { type: "welcome", title: "Welcome", blocks: [{ type: "heading", data: { text: "Welcome" } }] },
          { type: "questions", title: "Questions", blocks: [{ type: "short_text", data: { question: "Prompt", required: false } }] },
          { type: "ending", title: "Ending", blocks: [{ type: "text", data: { text: "Thank you" } }] },
        ],
      })
      .expect(200);

    await request(app)
      .post(`/api/v1/forms/${formId}/publish`)
      .set("Authorization", `Bearer ${memberToken}`)
      .expect(200);

    await request(app)
      .post(`/api/v1/forms/${formId}/close`)
      .set("Authorization", `Bearer ${memberToken}`)
      .expect(200);

    await request(app)
      .delete(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .expect(200);

    expect(await Form.exists({ _id: formId })).toBeNull();
    expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(0);
  });

  it("preserves a removed member's own Private surveys and access to them, while they lose Shared access", async () => {
    const owner = await makeUser("owner-preserve@example.test");
    const member = await makeUser("member-preserve@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    await Membership.create({ workspace: workspace._id, user: member._id, role: "member", status: "active" });
    const memberToken = makeJwt(member._id);

    const privateForm = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ title: "Member's private survey" })
      .expect(201);
    const sharedForm = await makeSharedPublishedForm(member._id, workspace, "Member's shared survey");
    await Workspace.updateOne({ _id: workspace._id }, { $inc: { activeSurveyCount: 1 } });

    await request(app)
      .delete(`/api/v1/workspaces/${workspace._id}/members/${member._id}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(204);

    // Private survey: fully intact and still accessible to the removed member.
    const privateAfter = await request(app)
      .get(`/api/v1/forms/${privateForm.body.data._id}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .expect(200);
    expect(privateAfter.body.data.title).toBe("Member's private survey");

    // Shared survey: still exists, owned by the workspace's membership
    // model, available to the owner, but no longer to the removed member.
    expect(await Form.exists({ _id: sharedForm._id })).not.toBeNull();
    await request(app)
      .get(`/api/v1/forms/${sharedForm._id}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(200);
    await request(app)
      .get(`/api/v1/forms/${sharedForm._id}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .expect(404);
  });
});
