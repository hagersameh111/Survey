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

const TEST_SECRET = "shared-survey-removal-test-secret";

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

describe("Shared survey survives creator removal", () => {
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

  it("keeps the Shared survey, its attribution, and remaining members' access after the creator is removed", async () => {
    const owner = await makeUser("owner@example.test");
    const creator = await makeUser("creator@example.test");
    const remainingMember = await makeUser("remaining@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    await Membership.create({ workspace: workspace._id, user: creator._id, role: "member", status: "active" });
    await Membership.create({ workspace: workspace._id, user: remainingMember._id, role: "member", status: "active" });
    await Workspace.updateOne({ _id: workspace._id }, { $inc: { activeMemberCount: 2 } });

    const created = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${makeJwt(creator._id)}`)
      .send({ title: "Team onboarding survey", visibility: "shared", workspaceId: workspace._id.toString() })
      .expect(201);
    const formId = created.body.data._id;

    // The owner (an admin-equivalent here) removes the creator from the workspace.
    await request(app)
      .delete(`/api/v1/workspaces/${workspace._id}/members/${creator._id}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(204);

    // The creator's own User account is untouched.
    expect(await User.findById(creator._id)).not.toBeNull();

    // The survey persists, still attributed to the original creator, still
    // tied to the workspace — never silently transferred or deleted.
    const stored = await Form.findById(formId);
    expect(stored).not.toBeNull();
    expect(stored.visibility).toBe("shared");
    expect(stored.owner.toString()).toBe(creator._id.toString());
    expect(stored.workspace.toString()).toBe(workspace._id.toString());

    // A remaining active member can still view and edit it.
    await request(app)
      .get(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${makeJwt(remainingMember._id)}`)
      .expect(200);
    await request(app)
      .patch(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${makeJwt(remainingMember._id)}`)
      .send({ title: "Updated by a remaining member" })
      .expect(200);

    // The removed creator loses access immediately on their very next request.
    await request(app)
      .get(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${makeJwt(creator._id)}`)
      .expect(404);
    await request(app)
      .get(`/api/v1/workspaces/${workspace._id}`)
      .set("Authorization", `Bearer ${makeJwt(creator._id)}`)
      .expect(404);
  });
});
