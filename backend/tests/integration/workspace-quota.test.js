import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import User from "../../src/modules/user/user.model.js";
import Workspace from "../../src/modules/workspace/workspace.model.js";
import Membership from "../../src/modules/workspace/membership.model.js";
import Invitation from "../../src/modules/workspace/invitation.model.js";
import Subscription from "../../src/modules/workspace/subscription.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "workspace-quota-test-secret";

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

const makeSharedDraftForm = (owner, workspace, label = "Shared form") => Form.create({
  owner,
  workspace: workspace._id,
  visibility: "shared",
  title: label,
  status: "draft",
  settings: { identityMode: "anonymous" },
  access: { type: "open" },
  pages: persistedPages(label),
});

const publishUrl = (formId) => `/api/v1/forms/${formId}/publish`;
const closeUrl = (formId) => `/api/v1/forms/${formId}/close`;
const reopenUrl = (formId) => `/api/v1/forms/${formId}/reopen`;
const deleteUrl = (formId) => `/api/v1/forms/${formId}`;

// Mirrors form-deletion-transaction.test.js's pauseInitialFormRead: pauses
// the FIRST matching Form.findOne/findById read (deleteForm's outer,
// pre-transaction read) right after it resolves, holding the caller there
// until release() is called.
const pauseInitialFormRead = (formId) => {
  const originalFindOne = Form.findOne;
  let reached;
  let release;
  const readReached = new Promise((resolve) => { reached = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  let paused = false;

  const spy = vi.spyOn(Form, "findOne").mockImplementation(function (...args) {
    const query = originalFindOne.apply(this, args);
    const filter = args[0];
    if (filter?._id?.toString() !== formId.toString() || paused) {
      return query;
    }
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

describe("Workspace plan quota enforcement", () => {
  let previousJwtSecret;

  beforeAll(async () => {
    await startTestDatabase();
    await Promise.all([
      Form.init(),
      User.init(),
      Workspace.init(),
      Membership.init(),
      Invitation.init(),
      Subscription.init(),
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
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await Promise.all([
      Form.deleteMany({}),
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Membership.deleteMany({}),
      Invitation.deleteMany({}),
      Subscription.deleteMany({}),
    ]);
  });

  it("publishes exactly up to the Premium active-survey limit and rejects the next one", async () => {
    const owner = await makeUser("owner@example.test");
    const workspace = await makeActiveWorkspace(owner._id, "premium");
    await Workspace.updateOne({ _id: workspace._id }, { $set: { activeSurveyCount: 9 } });
    const token = makeJwt(owner._id);

    const atLimit = await makeSharedDraftForm(owner._id, workspace, "At limit");
    await request(app)
      .post(publishUrl(atLimit._id))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(10);

    const overLimit = await makeSharedDraftForm(owner._id, workspace, "Over limit");
    const rejected = await request(app)
      .post(publishUrl(overLimit._id))
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
    expect(rejected.body.code).toBe("SURVEY_LIMIT_REACHED");
    expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(10);
    expect((await Form.findById(overLimit._id)).status).toBe("draft");
  });

  it("never blocks publishing on the Ultra plan (unlimited active surveys)", async () => {
    const owner = await makeUser("owner-ultra@example.test");
    const workspace = await makeActiveWorkspace(owner._id, "ultra");
    await Workspace.updateOne({ _id: workspace._id }, { $set: { activeSurveyCount: 1000 } });
    const token = makeJwt(owner._id);

    const form = await makeSharedDraftForm(owner._id, workspace, "Ultra form");
    await request(app)
      .post(publishUrl(form._id))
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(1001);
  });

  it("decrements the counter on close, freeing a slot for a new publish", async () => {
    const owner = await makeUser("owner-close@example.test");
    const workspace = await makeActiveWorkspace(owner._id, "premium");
    const token = makeJwt(owner._id);

    const first = await makeSharedDraftForm(owner._id, workspace, "First");
    await request(app).post(publishUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(1);

    await request(app).post(closeUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(0);

    await Workspace.updateOne({ _id: workspace._id }, { $set: { activeSurveyCount: 10 } });
    const second = await makeSharedDraftForm(owner._id, workspace, "Second");
    await request(app)
      .post(publishUrl(second._id))
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("re-checks quota on reopen: a workspace that filled up while a survey was closed blocks that reopen", async () => {
    const owner = await makeUser("owner-reopen@example.test");
    const workspace = await makeActiveWorkspace(owner._id, "premium");
    const token = makeJwt(owner._id);

    const closedForm = await makeSharedDraftForm(owner._id, workspace, "Will be closed");
    await request(app).post(publishUrl(closedForm._id)).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(closeUrl(closedForm._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(0);

    // The workspace fills up with other surveys while this one sits closed.
    await Workspace.updateOne({ _id: workspace._id }, { $set: { activeSurveyCount: 10 } });

    const reopenResult = await request(app)
      .post(reopenUrl(closedForm._id))
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
    expect(reopenResult.body.code).toBe("SURVEY_LIMIT_REACHED");
    expect((await Form.findById(closedForm._id)).status).toBe("closed");
    expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(10);
  });

  it("allows exactly one of several concurrent publish requests to fill the last slot", async () => {
    const owner = await makeUser("owner-concurrency@example.test");
    const workspace = await makeActiveWorkspace(owner._id, "premium");
    await Workspace.updateOne({ _id: workspace._id }, { $set: { activeSurveyCount: 9 } });
    const token = makeJwt(owner._id);

    const forms = await Promise.all([
      makeSharedDraftForm(owner._id, workspace, "Racer A"),
      makeSharedDraftForm(owner._id, workspace, "Racer B"),
      makeSharedDraftForm(owner._id, workspace, "Racer C"),
    ]);

    const results = await Promise.all(
      forms.map((form) =>
        request(app).post(publishUrl(form._id)).set("Authorization", `Bearer ${token}`)
      )
    );

    expect(results.map((result) => result.status).sort()).toEqual([200, 403, 403]);
    expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(10);
    const publishedCount = await Form.countDocuments({ workspace: workspace._id, status: "published" });
    expect(publishedCount).toBe(1);
  });

  it("private forms never touch any workspace's counters (regression)", async () => {
    const owner = await makeUser("owner-private@example.test");
    const unrelatedWorkspace = await makeActiveWorkspace(owner._id, "premium");
    const token = makeJwt(owner._id);

    const privateForm = await Form.create({
      owner: owner._id,
      visibility: "private",
      title: "Private form",
      status: "draft",
      settings: { identityMode: "anonymous" },
      access: { type: "open" },
      pages: persistedPages("Private"),
    });

    await request(app).post(publishUrl(privateForm._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await Workspace.findById(unrelatedWorkspace._id)).activeSurveyCount).toBe(0);
    expect((await Form.findById(privateForm._id)).visibility).toBe("private");
    expect((await Form.findById(privateForm._id)).workspace).toBeNull();
  });

  it("rolls back a consumed invitation when accepting it would exceed the member limit", async () => {
    const owner = await makeUser("owner-members@example.test");
    const invitee = await makeUser("invitee-members@example.test");
    const workspace = await makeActiveWorkspace(owner._id, "premium");
    await Workspace.updateOne({ _id: workspace._id }, { $set: { activeMemberCount: 5 } });

    const created = await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ email: "invitee-members@example.test" })
      .expect(201);

    const result = await request(app)
      .post("/api/v1/invitations/accept")
      .set("Authorization", `Bearer ${makeJwt(invitee._id)}`)
      .send({ token: created.body.data.invitationToken })
      .expect(403);
    expect(result.body.code).toBe("MEMBER_LIMIT_REACHED");

    expect((await Invitation.findById(created.body.data.invitationId)).status).toBe("pending");
    expect(await Membership.findOne({ workspace: workspace._id, user: invitee._id })).toBeNull();
    expect((await Workspace.findById(workspace._id)).activeMemberCount).toBe(5);
  });

  it("assigns plan-length, unique short codes to both private and shared forms", async () => {
    const owner = await makeUser("owner-shortcode@example.test");
    const workspace = await makeActiveWorkspace(owner._id, "premium");
    const token = makeJwt(owner._id);

    const privateForm = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Private" })
      .expect(201);
    expect(privateForm.body.data.shortCode).toHaveLength(7);

    const sharedForm = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Shared", visibility: "shared", workspaceId: workspace._id.toString() })
      .expect(201);
    expect(sharedForm.body.data.shortCode).toHaveLength(5);

    expect(privateForm.body.data.shortCode).not.toBe(sharedForm.body.data.shortCode);

    const indexes = await Form.collection.indexes();
    expect(indexes.some((index) => index.key.shortCode === 1 && index.unique === true)).toBe(true);
  });

  it("decrements the counter correctly when a publish commits between delete's outer read and its transaction", async () => {
    // Reproduces the race the prior review flagged: deleteForm's
    // pre-transaction read sees the Form as "draft" (counter untouched),
    // but a concurrent publish fully commits (incrementing the counter and
    // flipping status to "published") before deleteForm's own transaction
    // starts. If the decrement decision were based on that stale outer
    // read, the counter would stay incorrectly incremented after the form
    // is deleted. The fix derives the decision from the Form's current
    // state inside the delete transaction itself.
    const owner = await makeUser("owner-race@example.test");
    const workspace = await makeActiveWorkspace(owner._id, "premium");
    const token = makeJwt(owner._id);
    const form = await makeSharedDraftForm(owner._id, workspace, "Race form");

    const barrier = pauseInitialFormRead(form._id);
    try {
      const deletePromise = request(app)
        .delete(deleteUrl(form._id))
        .set("Authorization", `Bearer ${token}`)
        .then((result) => result);

      await barrier.readReached;

      // The publish fully commits here, strictly between delete's outer
      // read and delete's transaction start.
      await request(app)
        .post(publishUrl(form._id))
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(1);

      barrier.release();
      const deleteResult = await deletePromise;

      expect(deleteResult.status).toBe(200);
      expect(await Form.exists({ _id: form._id })).toBeNull();
      expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(0);
    } finally {
      barrier.release();
      barrier.spy.mockRestore();
    }
  });

  it("never decrements when the deleted form's current state is a draft, even if an earlier read was stale", async () => {
    // Symmetric sanity check: a draft that stays a draft the whole time
    // must never decrement the counter on delete.
    const owner = await makeUser("owner-race-draft@example.test");
    const workspace = await makeActiveWorkspace(owner._id, "premium");
    const token = makeJwt(owner._id);
    const form = await makeSharedDraftForm(owner._id, workspace, "Still a draft");

    const barrier = pauseInitialFormRead(form._id);
    try {
      const deletePromise = request(app)
        .delete(deleteUrl(form._id))
        .set("Authorization", `Bearer ${token}`)
        .then((result) => result);

      await barrier.readReached;
      barrier.release();
      const deleteResult = await deletePromise;

      expect(deleteResult.status).toBe(200);
      expect(await Form.exists({ _id: form._id })).toBeNull();
      expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(0);
    } finally {
      barrier.release();
      barrier.spy.mockRestore();
    }
  });
});
