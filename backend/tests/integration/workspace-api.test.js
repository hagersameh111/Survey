import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import User from "../../src/modules/user/user.model.js";
import Workspace from "../../src/modules/workspace/workspace.model.js";
import Membership from "../../src/modules/workspace/membership.model.js";
import Subscription from "../../src/modules/workspace/subscription.model.js";
import { workspaceCreationLimiter } from "../../src/middlewares/workspace-rate-limit.middleware.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "workspace-api-test-secret";

const makeUser = (email, overrides = {}) => User.create({
  firstName: "Test",
  lastName: "User",
  email,
  password: "test-password-123",
  ...overrides,
});

const makeJwt = (userId, role = "user") => jwt.sign({ id: userId.toString(), role }, TEST_SECRET);

const resetLimiter = () => {
  for (const key of ["::ffff:127.0.0.1", "::1", "127.0.0.1"]) {
    workspaceCreationLimiter.resetKey(key);
  }
};

describe("Workspace API", () => {
  let previousJwtSecret;

  beforeAll(async () => {
    await startTestDatabase();
    await Promise.all([User.init(), Workspace.init(), Membership.init(), Subscription.init()]);
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
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Membership.deleteMany({}),
      Subscription.deleteMany({}),
    ]);
  });

  it("creates a workspace with a pending_activation subscription and an owner Membership", async () => {
    const owner = await makeUser("owner@example.test");

    const created = await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ name: "Acme Research", plan: "premium" })
      .expect(201);

    expect(created.body.data).toMatchObject({ name: "Acme Research", plan: "premium" });
    const workspaceId = created.body.data._id;

    const subscription = await Subscription.findOne({ workspace: workspaceId });
    expect(subscription.status).toBe("pending_activation");

    const membership = await Membership.findOne({ workspace: workspaceId, user: owner._id });
    expect(membership).toMatchObject({ role: "owner", status: "active" });
  });

  it("never allows a client-supplied plan other than premium or ultra", async () => {
    const owner = await makeUser("owner2@example.test");

    await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ name: "Acme", plan: "free" })
      .expect(400);

    await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ name: "Acme", plan: "active" })
      .expect(400);
  });

  it("rejects access to a workspace the caller is not an active member of (IDOR-safe 404)", async () => {
    const owner = await makeUser("owner3@example.test");
    const outsider = await makeUser("outsider@example.test");

    const workspace = await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ plan: "premium" })
      .expect(201);

    await request(app)
      .get(`/api/v1/workspaces/${workspace.body.data._id}`)
      .set("Authorization", `Bearer ${makeJwt(outsider._id)}`)
      .expect(404);

    await request(app)
      .get(`/api/v1/workspaces/${workspace.body.data._id}/members`)
      .set("Authorization", `Bearer ${makeJwt(outsider._id)}`)
      .expect(404);
  });

  it("only lets the owner or an admin remove a member, and never the owner themselves", async () => {
    const owner = await makeUser("owner4@example.test");
    const member = await makeUser("member4@example.test");

    const workspace = await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ plan: "premium" })
      .expect(201);
    const workspaceId = workspace.body.data._id;

    await Membership.create({ workspace: workspaceId, user: member._id, role: "member", status: "active" });
    await Workspace.updateOne({ _id: workspaceId }, { $inc: { activeMemberCount: 1 } });

    // A plain member cannot remove another member.
    await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/members/${owner._id}`)
      .set("Authorization", `Bearer ${makeJwt(member._id)}`)
      .expect(403);

    // The owner cannot be removed, even by themselves.
    await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/members/${owner._id}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(400);

    // The owner can remove a regular member; the counter decrements.
    await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/members/${member._id}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(204);

    const removedMembership = await Membership.findOne({ workspace: workspaceId, user: member._id });
    expect(removedMembership.status).toBe("removed");
    expect((await Workspace.findById(workspaceId)).activeMemberCount).toBe(0);
  });

  it("only activates a subscription through the platform-admin endpoint, never a self-upgrade", async () => {
    const owner = await makeUser("owner5@example.test");
    const platformAdmin = await makeUser("admin5@example.test", { role: "admin" });

    const workspace = await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ plan: "premium" })
      .expect(201);
    const workspaceId = workspace.body.data._id;

    // The workspace owner is not a platform admin and cannot self-activate.
    await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/subscription/activate`)
      .set("Authorization", `Bearer ${makeJwt(owner._id, "user")}`)
      .send({ status: "active" })
      .expect(403);

    await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/subscription/activate`)
      .set("Authorization", `Bearer ${makeJwt(platformAdmin._id, "admin")}`)
      .send({ status: "active" })
      .expect(200);

    expect((await Subscription.findOne({ workspace: workspaceId })).status).toBe("active");
  });

  it("rate-limits workspace creation per IP", async () => {
    const owner = await makeUser("owner6@example.test");
    const token = makeJwt(owner._id);

    for (let index = 0; index < 5; index += 1) {
      await request(app)
        .post("/api/v1/workspaces")
        .set("Authorization", `Bearer ${token}`)
        .send({ plan: "premium" })
        .expect(201);
    }

    const limited = await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ plan: "premium" })
      .expect(429);

    expect(limited.body).toEqual({
      success: false,
      message: "Too many workspace-creation requests. Try again later.",
    });
    expect(await Workspace.countDocuments({ owner: owner._id })).toBe(5);
  });
});
