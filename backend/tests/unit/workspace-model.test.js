import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import Workspace from "../../src/modules/workspace/workspace.model.js";
import Membership from "../../src/modules/workspace/membership.model.js";
import Invitation from "../../src/modules/workspace/invitation.model.js";
import Subscription from "../../src/modules/workspace/subscription.model.js";

describe("Workspace model", () => {
  it("requires an owner and a plan, and defaults counters to zero", async () => {
    const missingRequiredFields = new Workspace({});
    let error;
    try {
      await missingRequiredFields.validate();
    } catch (validationError) {
      error = validationError;
    }

    expect(error.errors.owner).toBeDefined();
    expect(error.errors.plan).toBeDefined();

    const workspace = new Workspace({
      owner: new mongoose.Types.ObjectId(),
      plan: "premium",
    });
    expect(workspace.activeSurveyCount).toBe(0);
    expect(workspace.activeMemberCount).toBe(0);
    expect(workspace.name).toBe("");
  });

  it("only accepts premium or ultra as a plan", async () => {
    const workspace = new Workspace({
      owner: new mongoose.Types.ObjectId(),
      plan: "free",
    });

    await expect(workspace.validate()).rejects.toMatchObject({
      errors: { plan: expect.anything() },
    });
  });
});

describe("Membership model", () => {
  it("requires a workspace, user, and role, and defaults status to active", () => {
    const membership = new Membership({
      workspace: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      role: "member",
    });
    expect(membership.status).toBe("active");
    expect(membership.joinedAt).toBeInstanceOf(Date);
  });

  it("declares a workspace+user unique index scoped to active status only", () => {
    const index = Membership.schema.indexes().find(([keys]) => keys.workspace && keys.user);

    expect(index).toBeDefined();
    expect(index[0]).toEqual({ workspace: 1, user: 1 });
    expect(index[1].unique).toBe(true);
    expect(index[1].partialFilterExpression).toEqual({ status: "active" });
  });
});

describe("Invitation model", () => {
  it("requires workspace, email, invitedBy, tokenHash, and expiresAt, and defaults status to pending", () => {
    const invitation = new Invitation({
      workspace: new mongoose.Types.ObjectId(),
      email: "Member@Example.test",
      invitedBy: new mongoose.Types.ObjectId(),
      tokenHash: "a".repeat(64),
      expiresAt: new Date(Date.now() + 1000),
    });
    expect(invitation.status).toBe("pending");
    expect(invitation.role).toBe("member");
    expect(invitation.email).toBe("member@example.test");
    expect(Invitation.schema.path("tokenHash").options.select).toBe(false);
  });

  it("declares a workspace+email unique index scoped to pending status only", () => {
    const index = Invitation.schema.indexes().find(([keys]) => keys.workspace && keys.email);

    expect(index).toBeDefined();
    expect(index[0]).toEqual({ workspace: 1, email: 1 });
    expect(index[1].unique).toBe(true);
    expect(index[1].partialFilterExpression).toEqual({ status: "pending" });
  });

  it("declares a unique index on the token hash", () => {
    const index = Invitation.schema.indexes().find(([keys]) => keys.tokenHash);

    expect(index).toBeDefined();
    expect(index[1].unique).toBe(true);
  });
});

describe("Subscription model", () => {
  it("defaults status to pending_activation and never to active", () => {
    const subscription = new Subscription({
      workspace: new mongoose.Types.ObjectId(),
      plan: "premium",
    });
    expect(subscription.status).toBe("pending_activation");
  });
});
