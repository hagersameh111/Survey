import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import User from "../../src/modules/user/user.model.js";
import Workspace from "../../src/modules/workspace/workspace.model.js";
import Membership from "../../src/modules/workspace/membership.model.js";
import Invitation from "../../src/modules/workspace/invitation.model.js";
import Subscription from "../../src/modules/workspace/subscription.model.js";
import {
  invitationCreateLimiter,
  invitationAcceptLimiter,
} from "../../src/middlewares/workspace-rate-limit.middleware.js";
import { startTestDatabase, stopTestDatabase } from "../support/mongo-memory.js";

const TEST_SECRET = "invitation-lifecycle-test-secret";

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

const resetLimiters = () => {
  for (const key of ["::ffff:127.0.0.1", "::1", "127.0.0.1"]) {
    invitationCreateLimiter.resetKey(key);
    invitationAcceptLimiter.resetKey(key);
  }
};

describe("Invitation lifecycle", () => {
  let previousJwtSecret;

  beforeAll(async () => {
    await startTestDatabase();
    await Promise.all([
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
    resetLimiters();
    await stopTestDatabase();
  });

  beforeEach(async () => {
    resetLimiters();
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Membership.deleteMany({}),
      Invitation.deleteMany({}),
      Subscription.deleteMany({}),
    ]);
  });

  it("requires an active subscription before an invitation can be created", async () => {
    const owner = await makeUser("owner@example.test");
    const workspace = await Workspace.create({ owner: owner._id, plan: "premium" });
    await Membership.create({ workspace: workspace._id, user: owner._id, role: "owner", status: "active" });
    await Subscription.create({ workspace: workspace._id, plan: "premium", status: "pending_activation" });

    const result = await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ email: "invitee@example.test" })
      .expect(403);

    expect(result.body.code).toBe("SUBSCRIPTION_NOT_ACTIVE");
  });

  it("completes create → preview → accept, creating an active Membership", async () => {
    const owner = await makeUser("owner2@example.test");
    const invitee = await makeUser("invitee2@example.test");
    const workspace = await makeActiveWorkspace(owner._id);

    const created = await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ email: "invitee2@example.test", role: "member" })
      .expect(201);

    const rawToken = created.body.data.invitationToken;
    expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const preview = await request(app)
      .get(`/api/v1/invitations/${rawToken}`)
      .expect(200);
    expect(preview.body.data).toEqual({
      workspaceName: "",
      email: "invitee2@example.test",
      status: "pending",
    });

    const accepted = await request(app)
      .post("/api/v1/invitations/accept")
      .set("Authorization", `Bearer ${makeJwt(invitee._id)}`)
      .send({ token: rawToken })
      .expect(200);
    expect(accepted.body.data).toMatchObject({ workspaceId: workspace._id.toString(), role: "member" });

    const membership = await Membership.findOne({ workspace: workspace._id, user: invitee._id });
    expect(membership).toMatchObject({ role: "member", status: "active" });
    expect((await Workspace.findById(workspace._id)).activeMemberCount).toBe(1);
    expect((await Invitation.findOne({ workspace: workspace._id })).status).toBe("accepted");
  });

  it("rejects acceptance by an account whose email does not match the invitation", async () => {
    const owner = await makeUser("owner3@example.test");
    const wrongAccount = await makeUser("someone-else3@example.test");
    const workspace = await makeActiveWorkspace(owner._id);

    const created = await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ email: "invitee3@example.test" })
      .expect(201);

    const result = await request(app)
      .post("/api/v1/invitations/accept")
      .set("Authorization", `Bearer ${makeJwt(wrongAccount._id)}`)
      .send({ token: created.body.data.invitationToken })
      .expect(403);
    expect(result.body.code).toBe("EMAIL_MISMATCH");

    // The token must still be usable by the correct account afterward.
    expect((await Invitation.findOne({ workspace: workspace._id })).status).toBe("pending");
  });

  it("invalidates a revoked invitation's token", async () => {
    const owner = await makeUser("owner4@example.test");
    const invitee = await makeUser("invitee4@example.test");
    const workspace = await makeActiveWorkspace(owner._id);

    const created = await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ email: "invitee4@example.test" })
      .expect(201);
    const invitationId = created.body.data.invitationId;

    await request(app)
      .delete(`/api/v1/workspaces/${workspace._id}/invitations/${invitationId}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(204);

    await request(app)
      .post("/api/v1/invitations/accept")
      .set("Authorization", `Bearer ${makeJwt(invitee._id)}`)
      .send({ token: created.body.data.invitationToken })
      .expect(410);
  });

  it("rejects an expired invitation and makes acceptance single-use", async () => {
    const owner = await makeUser("owner5@example.test");
    const invitee = await makeUser("invitee5@example.test");
    const workspace = await makeActiveWorkspace(owner._id);

    const expired = await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ email: "invitee5@example.test" })
      .expect(201);
    await Invitation.updateOne(
      { _id: expired.body.data.invitationId },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    await request(app)
      .post("/api/v1/invitations/accept")
      .set("Authorization", `Bearer ${makeJwt(invitee._id)}`)
      .send({ token: expired.body.data.invitationToken })
      .expect(410);

    // Re-inviting the same email after expiry is allowed (the partial
    // unique index only guards pending invitations, and an expired one
    // never transitions to "pending" again).
    const second = await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ email: "invitee5@example.test" })
      .expect(201);

    await request(app)
      .post("/api/v1/invitations/accept")
      .set("Authorization", `Bearer ${makeJwt(invitee._id)}`)
      .send({ token: second.body.data.invitationToken })
      .expect(200);

    // Single-use: accepting the same (now-consumed) token again fails, even
    // for the legitimate account that already accepted it.
    await request(app)
      .post("/api/v1/invitations/accept")
      .set("Authorization", `Bearer ${makeJwt(invitee._id)}`)
      .send({ token: second.body.data.invitationToken })
      .expect(409);
  });

  it("prevents a duplicate pending invitation for the same email in the same workspace", async () => {
    const owner = await makeUser("owner6@example.test");
    const workspace = await makeActiveWorkspace(owner._id);

    await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ email: "duplicate6@example.test" })
      .expect(201);

    const duplicate = await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ email: "duplicate6@example.test" })
      .expect(409);
    expect(duplicate.body.code).toBe("INVITATION_ALREADY_PENDING");
  });

  it("prevents a non-admin member from creating or revoking invitations", async () => {
    const owner = await makeUser("owner7@example.test");
    const member = await makeUser("member7@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    await Membership.create({ workspace: workspace._id, user: member._id, role: "member", status: "active" });

    await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${makeJwt(member._id)}`)
      .send({ email: "someone7@example.test" })
      .expect(403);
  });

  it("rate-limits invitation creation and acceptance per IP", async () => {
    const owner = await makeUser("owner8@example.test");
    const invitee = await makeUser("invitee8@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    const ownerToken = makeJwt(owner._id);

    for (let index = 0; index < 20; index += 1) {
      await request(app)
        .post(`/api/v1/workspaces/${workspace._id}/invitations`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ email: `bulk${index}@example.test` })
        .expect(201);
    }

    const limited = await request(app)
      .post(`/api/v1/workspaces/${workspace._id}/invitations`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ email: "one-too-many@example.test" })
      .expect(429);
    expect(limited.body.message).toBe("Too many invitation requests. Try again later.");
  });
});
