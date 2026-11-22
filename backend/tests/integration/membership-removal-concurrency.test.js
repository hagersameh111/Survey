import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app.js";
import Form from "../../src/modules/form/form.model.js";
import User from "../../src/modules/user/user.model.js";
import Workspace from "../../src/modules/workspace/workspace.model.js";
import Membership from "../../src/modules/workspace/membership.model.js";
import Subscription from "../../src/modules/workspace/subscription.model.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

// Documents and tests the ACTUAL membership-removal concurrency guarantee
// (see backend/docs/workspace-concurrency.md for the full write-up):
//
//   - Once a removal transaction COMMITS, any request whose authorization
//     check starts afterward sees "removed" and is denied. This holds for
//     every Form operation (lifecycle or simple edit), since every access
//     check re-reads Membership fresh (no caching) and MongoDB gives
//     read-your-own-writes consistency for a majority-committed write
//     against the primary.
//   - A request whose authorization check already resolved "active" BEFORE
//     removal commits may still complete its action, even if removal
//     commits moments later. This is a bounded, inherent check-then-act
//     race; full immediate preemption would require coupling every
//     workspace-scoped Form mutation's transaction to a write-conflict
//     against the Membership document, which this codebase does not do.
//
// These tests lock in that exact behavior rather than an idealized
// stronger one.

const TEST_SECRET = "membership-removal-concurrency-test-secret";

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

// Pauses the FIRST Membership.findOne call matching {workspace, user}
// right after it resolves, holding the caller there until release(). A
// removal's own internal precheck runs with the identical filter shape, so
// the `paused` guard (matching the project's existing barrier pattern) is
// what lets the test orchestrate "member's check already resolved, THEN
// removal commits, THEN the member's request continues."
const pauseMembershipCheck = (workspaceId, userId) => {
  const originalFindOne = Membership.findOne;
  let reached;
  let release;
  const readReached = new Promise((resolve) => { reached = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  let paused = false;

  const spy = vi.spyOn(Membership, "findOne").mockImplementation(function (...args) {
    const query = originalFindOne.apply(this, args);
    const filter = args[0];
    const matches =
      filter?.workspace?.toString() === workspaceId.toString() &&
      filter?.user?.toString() === userId.toString() &&
      filter?.status === "active";

    if (!matches || paused) {
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

describe("Membership-removal concurrency guarantee", () => {
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

  it("denies a request whose authorization check starts strictly after removal commits", async () => {
    const owner = await makeUser("owner-sequential@example.test");
    const member = await makeUser("member-sequential@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    await Membership.create({ workspace: workspace._id, user: member._id, role: "member", status: "active" });
    const form = await makeSharedDraftForm(member._id, workspace, "Sequential form");
    const memberToken = makeJwt(member._id);

    await request(app)
      .delete(`/api/v1/workspaces/${workspace._id}/members/${member._id}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(204);

    await request(app)
      .patch(`/api/v1/forms/${form._id}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ title: "Should be denied" })
      .expect(404);

    await request(app)
      .post(`/api/v1/forms/${form._id}/publish`)
      .set("Authorization", `Bearer ${memberToken}`)
      .expect(404);

    await request(app)
      .get(`/api/v1/workspaces/${workspace._id}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .expect(404);

    // The removed member's own account and its (unaffected) personal data
    // are untouched by this — confirmed in shared-survey-member-removal.test.js.
    expect(await User.findById(member._id)).not.toBeNull();
  });

  it("documents that a simple edit already authorized before removal commits may still complete", async () => {
    const owner = await makeUser("owner-inflight-edit@example.test");
    const member = await makeUser("member-inflight-edit@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    await Membership.create({ workspace: workspace._id, user: member._id, role: "member", status: "active" });
    const form = await makeSharedDraftForm(member._id, workspace, "In-flight edit form");
    const memberToken = makeJwt(member._id);

    const barrier = pauseMembershipCheck(workspace._id, member._id);
    try {
      const editPromise = request(app)
        .patch(`/api/v1/forms/${form._id}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ title: "Edited while removal was in flight" })
        .then((result) => result);

      await barrier.readReached;

      // Removal commits strictly AFTER the edit's authorization check
      // already resolved "active", but strictly BEFORE the edit itself
      // (saveForm) commits.
      await request(app)
        .delete(`/api/v1/workspaces/${workspace._id}/members/${member._id}`)
        .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
        .expect(204);
      expect((await Membership.findOne({ workspace: workspace._id, user: member._id })).status).toBe("removed");

      barrier.release();
      const editResult = await editPromise;

      // This is the documented, bounded staleness window — not an
      // idealized "removal always wins" guarantee. The edit's
      // authorization was already decided before removal committed.
      expect(editResult.status).toBe(200);
      expect((await Form.findById(form._id)).title).toBe("Edited while removal was in flight");

      // Critically: the NEXT request from that member, after removal has
      // fully committed, is denied — the guarantee holds going forward.
      await request(app)
        .patch(`/api/v1/forms/${form._id}`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ title: "Should now be denied" })
        .expect(404);
    } finally {
      barrier.release();
      barrier.spy.mockRestore();
    }
  });

  it("keeps the workspace's active-survey counter consistent when a publish's authorization predates a concurrent removal", async () => {
    const owner = await makeUser("owner-inflight-publish@example.test");
    const member = await makeUser("member-inflight-publish@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    await Membership.create({ workspace: workspace._id, user: member._id, role: "member", status: "active" });
    const form = await makeSharedDraftForm(member._id, workspace, "In-flight publish form");
    const memberToken = makeJwt(member._id);

    const barrier = pauseMembershipCheck(workspace._id, member._id);
    try {
      const publishPromise = request(app)
        .post(`/api/v1/forms/${form._id}/publish`)
        .set("Authorization", `Bearer ${memberToken}`)
        .then((result) => result);

      await barrier.readReached;

      await request(app)
        .delete(`/api/v1/workspaces/${workspace._id}/members/${member._id}`)
        .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
        .expect(204);

      barrier.release();
      const publishResult = await publishPromise;

      // Same documented guarantee as the simple-edit case: the publish's
      // authorization was already decided before removal committed, so it
      // completes — but the workspace counter must still end up correct
      // and consistent (no corruption from the interleaving), which is
      // what this assertion locks in.
      expect(publishResult.status).toBe(200);
      expect((await Form.findById(form._id)).status).toBe("published");
      expect((await Workspace.findById(workspace._id)).activeSurveyCount).toBe(1);
    } finally {
      barrier.release();
      barrier.spy.mockRestore();
    }
  });
});
