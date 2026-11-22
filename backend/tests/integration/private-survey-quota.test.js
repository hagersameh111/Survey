import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import User from "../../src/modules/user/user.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "private-survey-quota-test-secret";

const makeUser = (email) => User.create({
  firstName: "Test",
  lastName: "User",
  email,
  password: "test-password-123",
});

const makeJwt = (userId) => jwt.sign({ id: userId.toString(), role: "user" }, TEST_SECRET);

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

const makePrivateDraftForm = (owner, label = "Private form") => Form.create({
  owner,
  visibility: "private",
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

// Mirrors workspace-quota.test.js's pauseInitialFormRead: pauses the FIRST
// matching Form.findOne/findById read (deleteForm's outer, pre-transaction
// read) right after it resolves, holding the caller there until release()
// is called.
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

describe("Free-plan Private survey quota enforcement", () => {
  let previousJwtSecret;

  beforeAll(async () => {
    await startTestDatabase();
    await Promise.all([Form.init(), User.init()]);
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
    await Promise.all([Form.deleteMany({}), User.deleteMany({})]);
  });

  it("publishes exactly up to the Free-plan limit of 2 active private surveys and rejects the third", async () => {
    const owner = await makeUser("owner@example.test");
    const token = makeJwt(owner._id);

    const first = await makePrivateDraftForm(owner._id, "First");
    await request(app).post(publishUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(1);

    const second = await makePrivateDraftForm(owner._id, "Second");
    await request(app).post(publishUrl(second._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);

    const third = await makePrivateDraftForm(owner._id, "Third");
    const rejected = await request(app)
      .post(publishUrl(third._id))
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
    expect(rejected.body.code).toBe("PRIVATE_SURVEY_LIMIT_REACHED");
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);
    expect((await Form.findById(third._id)).status).toBe("draft");
  });

  it("does not count drafts or closed private surveys toward the limit", async () => {
    const owner = await makeUser("owner-drafts@example.test");
    const token = makeJwt(owner._id);

    // Three drafts sitting around must never block a publish on their own.
    await makePrivateDraftForm(owner._id, "Draft A");
    await makePrivateDraftForm(owner._id, "Draft B");
    await makePrivateDraftForm(owner._id, "Draft C");
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(0);

    const closed = await makePrivateDraftForm(owner._id, "Will be closed");
    await request(app).post(publishUrl(closed._id)).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(closeUrl(closed._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(0);

    const first = await makePrivateDraftForm(owner._id, "First");
    const second = await makePrivateDraftForm(owner._id, "Second");
    await request(app).post(publishUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(publishUrl(second._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);
  });

  it("decrements the counter on close, freeing a slot for a new publish", async () => {
    const owner = await makeUser("owner-close@example.test");
    const token = makeJwt(owner._id);

    const first = await makePrivateDraftForm(owner._id, "First");
    const second = await makePrivateDraftForm(owner._id, "Second");
    await request(app).post(publishUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(publishUrl(second._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);

    await request(app).post(closeUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(1);

    const third = await makePrivateDraftForm(owner._id, "Third");
    await request(app).post(publishUrl(third._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);
  });

  it("frees capacity when a published private survey is deleted", async () => {
    const owner = await makeUser("owner-delete@example.test");
    const token = makeJwt(owner._id);

    const first = await makePrivateDraftForm(owner._id, "First");
    const second = await makePrivateDraftForm(owner._id, "Second");
    await request(app).post(publishUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(publishUrl(second._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);

    await request(app).delete(deleteUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(1);

    const third = await makePrivateDraftForm(owner._id, "Third");
    await request(app).post(publishUrl(third._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);
  });

  it("does not decrement when a draft (never published) private survey is deleted", async () => {
    const owner = await makeUser("owner-delete-draft@example.test");
    const token = makeJwt(owner._id);

    const published = await makePrivateDraftForm(owner._id, "Published");
    await request(app).post(publishUrl(published._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(1);

    const draft = await makePrivateDraftForm(owner._id, "Draft");
    await request(app).delete(deleteUrl(draft._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(1);
  });

  it("re-checks quota on reopen: a user who filled up while a survey was closed is blocked from reopening it", async () => {
    const owner = await makeUser("owner-reopen@example.test");
    const token = makeJwt(owner._id);

    const closedForm = await makePrivateDraftForm(owner._id, "Will be closed");
    await request(app).post(publishUrl(closedForm._id)).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(closeUrl(closedForm._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(0);

    // The user fills both slots with other surveys while this one sits closed.
    const first = await makePrivateDraftForm(owner._id, "First");
    const second = await makePrivateDraftForm(owner._id, "Second");
    await request(app).post(publishUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post(publishUrl(second._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);

    const reopenResult = await request(app)
      .post(reopenUrl(closedForm._id))
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
    expect(reopenResult.body.code).toBe("PRIVATE_SURVEY_LIMIT_REACHED");
    expect((await Form.findById(closedForm._id)).status).toBe("closed");
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);
  });

  it("allows exactly one of several concurrent publish requests to fill the last slot", async () => {
    const owner = await makeUser("owner-concurrency@example.test");
    const token = makeJwt(owner._id);

    const first = await makePrivateDraftForm(owner._id, "Filler");
    await request(app).post(publishUrl(first._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(1);

    const forms = await Promise.all([
      makePrivateDraftForm(owner._id, "Racer A"),
      makePrivateDraftForm(owner._id, "Racer B"),
      makePrivateDraftForm(owner._id, "Racer C"),
    ]);

    const results = await Promise.all(
      forms.map((form) =>
        request(app).post(publishUrl(form._id)).set("Authorization", `Bearer ${token}`)
      )
    );

    expect(results.map((result) => result.status).sort()).toEqual([200, 403, 403]);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(2);
    const publishedCount = await Form.countDocuments({ owner: owner._id, visibility: "private", status: "published" });
    expect(publishedCount).toBe(2);
  });

  it("scopes the limit per user: one user's quota never blocks another user's publish", async () => {
    const ownerA = await makeUser("owner-a@example.test");
    const ownerB = await makeUser("owner-b@example.test");
    const tokenA = makeJwt(ownerA._id);
    const tokenB = makeJwt(ownerB._id);

    const firstA = await makePrivateDraftForm(ownerA._id, "A First");
    const secondA = await makePrivateDraftForm(ownerA._id, "A Second");
    await request(app).post(publishUrl(firstA._id)).set("Authorization", `Bearer ${tokenA}`).expect(200);
    await request(app).post(publishUrl(secondA._id)).set("Authorization", `Bearer ${tokenA}`).expect(200);
    expect((await User.findById(ownerA._id)).activePrivateSurveyCount).toBe(2);

    const formB = await makePrivateDraftForm(ownerB._id, "B First");
    await request(app).post(publishUrl(formB._id)).set("Authorization", `Bearer ${tokenB}`).expect(200);
    expect((await User.findById(ownerB._id)).activePrivateSurveyCount).toBe(1);
  });

  it("shared forms never touch any user's private-survey counter (regression)", async () => {
    const owner = await makeUser("owner-shared-regression@example.test");
    const Workspace = (await import("../../src/modules/workspace/workspace.model.js")).default;
    const Membership = (await import("../../src/modules/workspace/membership.model.js")).default;
    const Subscription = (await import("../../src/modules/workspace/subscription.model.js")).default;
    const workspace = await Workspace.create({ owner: owner._id, plan: "premium" });
    await Membership.create({ workspace: workspace._id, user: owner._id, role: "owner", status: "active" });
    await Subscription.create({ workspace: workspace._id, plan: "premium", status: "active" });
    const token = makeJwt(owner._id);

    const sharedForm = await Form.create({
      owner: owner._id,
      workspace: workspace._id,
      visibility: "shared",
      title: "Shared form",
      status: "draft",
      settings: { identityMode: "anonymous" },
      access: { type: "open" },
      pages: persistedPages("Shared"),
    });

    await request(app).post(publishUrl(sharedForm._id)).set("Authorization", `Bearer ${token}`).expect(200);
    expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(0);
  });

  it("decrements the counter correctly when a publish commits between delete's outer read and its transaction", async () => {
    // Mirrors workspace-quota.test.js's equivalent race test: deleteForm's
    // pre-transaction read sees the Form as "draft" (counter untouched),
    // but a concurrent publish fully commits (incrementing the user's
    // counter and flipping status to "published") before deleteForm's own
    // transaction starts. The decrement decision must be derived from the
    // Form's current state inside the delete transaction, not from that
    // stale outer read.
    const owner = await makeUser("owner-race@example.test");
    const token = makeJwt(owner._id);
    const form = await makePrivateDraftForm(owner._id, "Race form");

    const barrier = pauseInitialFormRead(form._id);
    try {
      const deletePromise = request(app)
        .delete(deleteUrl(form._id))
        .set("Authorization", `Bearer ${token}`)
        .then((result) => result);

      await barrier.readReached;

      await request(app).post(publishUrl(form._id)).set("Authorization", `Bearer ${token}`).expect(200);
      expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(1);

      barrier.release();
      const deleteResult = await deletePromise;

      expect(deleteResult.status).toBe(200);
      expect(await Form.exists({ _id: form._id })).toBeNull();
      expect((await User.findById(owner._id)).activePrivateSurveyCount).toBe(0);
    } finally {
      barrier.release();
      barrier.spy.mockRestore();
    }
  });
});
