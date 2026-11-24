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

const TEST_SECRET = "form-visibility-test-secret";

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

describe("Private vs Shared form visibility", () => {
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

  it("keeps a Private form visible only to its owner (regression)", async () => {
    const owner = await makeUser("owner@example.test");
    const otherUser = await makeUser("other@example.test");

    const created = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ title: "My private survey" })
      .expect(201);
    const formId = created.body.data._id;

    await request(app)
      .get(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(200);

    await request(app)
      .get(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${makeJwt(otherUser._id)}`)
      .expect(404);

    const list = await request(app)
      .get("/api/v1/forms")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(200);
    expect(list.body.data.map((form) => form._id)).toContain(formId);
  });

  it("makes a Shared form visible and editable by any active workspace member, invisible to non-members", async () => {
    const owner = await makeUser("owner2@example.test");
    const member = await makeUser("member2@example.test");
    const outsider = await makeUser("outsider2@example.test");
    const workspace = await makeActiveWorkspace(owner._id);
    await Membership.create({ workspace: workspace._id, user: member._id, role: "member", status: "active" });

    const created = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${makeJwt(member._id)}`)
      .send({ title: "Team survey", visibility: "shared", workspaceId: workspace._id.toString() })
      .expect(201);
    const formId = created.body.data._id;
    expect(created.body.data.owner).toBe(member._id.toString());

    // Any active member (including the owner, who didn't create it) can see and edit it.
    await request(app)
      .get(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(200);

    await request(app)
      .patch(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ title: "Renamed by owner" })
      .expect(200);

    const sharedList = await request(app)
      .get(`/api/v1/forms?workspaceId=${workspace._id.toString()}`)
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(200);
    expect(sharedList.body.data.map((form) => form._id)).toContain(formId);

    // A non-member cannot access it even with the real, guessed form id.
    await request(app)
      .get(`/api/v1/forms/${formId}`)
      .set("Authorization", `Bearer ${makeJwt(outsider._id)}`)
      .expect(404);
  });

  it("prevents cross-workspace access even with a valid form id from a different workspace", async () => {
    const ownerA = await makeUser("ownerA@example.test");
    const memberOfB = await makeUser("memberB@example.test");
    const workspaceA = await makeActiveWorkspace(ownerA._id);
    const workspaceB = await makeActiveWorkspace(memberOfB._id);

    const created = await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${makeJwt(ownerA._id)}`)
      .send({ title: "Workspace A survey", visibility: "shared", workspaceId: workspaceA._id.toString() })
      .expect(201);

    await request(app)
      .get(`/api/v1/forms/${created.body.data._id}`)
      .set("Authorization", `Bearer ${makeJwt(memberOfB._id)}`)
      .expect(404);

    await request(app)
      .get(`/api/v1/forms?workspaceId=${workspaceA._id.toString()}`)
      .set("Authorization", `Bearer ${makeJwt(memberOfB._id)}`)
      .expect(404);

    // workspaceB belongs to memberOfB; silence confirms workspaceA stays unaffected.
    expect(workspaceB._id.toString()).not.toBe(workspaceA._id.toString());
  });

  it("rejects creating a Shared form in a workspace the caller does not belong to", async () => {
    const owner = await makeUser("owner3@example.test");
    const outsider = await makeUser("outsider3@example.test");
    const workspace = await makeActiveWorkspace(owner._id);

    await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${makeJwt(outsider._id)}`)
      .send({ title: "Not allowed", visibility: "shared", workspaceId: workspace._id.toString() })
      .expect(403);
  });

  it("never lists a user's own Shared-form creations in their private list", async () => {
    const owner = await makeUser("owner4@example.test");
    const workspace = await makeActiveWorkspace(owner._id);

    await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ title: "Shared by owner", visibility: "shared", workspaceId: workspace._id.toString() })
      .expect(201);
    await request(app)
      .post("/api/v1/forms")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .send({ title: "Owner's private form" })
      .expect(201);

    const privateList = await request(app)
      .get("/api/v1/forms")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(200);
    expect(privateList.body.data).toHaveLength(1);
    expect(privateList.body.data[0].title).toBe("Owner's private form");

    const folders = await request(app)
      .get("/api/v1/forms/folders")
      .set("Authorization", `Bearer ${makeJwt(owner._id)}`)
      .expect(200);
    const myWorkspaceFolder = folders.body.data.find((folder) => folder.slug === "my-workspace");
    expect(myWorkspaceFolder.formsCount).toBe(1);
  });
});
