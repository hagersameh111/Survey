import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/modules/form/form-write-fence.js", () => ({
  runInMongoTransaction: vi.fn(),
}));

vi.mock("../../src/modules/workspace/workspace-write-fence.js", () => ({
  incrementWorkspaceCounter: vi.fn(),
  decrementWorkspaceCounter: vi.fn(),
}));

import mongoose from "mongoose";
import User from "../../src/modules/user/user.model.js";
import Workspace from "../../src/modules/workspace/workspace.model.js";
import Membership from "../../src/modules/workspace/membership.model.js";
import Invitation from "../../src/modules/workspace/invitation.model.js";
import { runInMongoTransaction } from "../../src/modules/form/form-write-fence.js";
import { incrementWorkspaceCounter } from "../../src/modules/workspace/workspace-write-fence.js";
import {
  hashInvitationToken,
  previewInvitation,
  acceptInvitation,
} from "../../src/modules/workspace/invitation.service.js";

const WORKSPACE_ID = new mongoose.Types.ObjectId();
const USER_ID = new mongoose.Types.ObjectId();
const RAW_TOKEN = "A".repeat(43);
const TOKEN_HASH = hashInvitationToken(RAW_TOKEN);
const SESSION = { transaction: "test-session" };

beforeEach(() => {
  vi.clearAllMocks();
  runInMongoTransaction.mockImplementation((operation) => operation(SESSION));
});

afterEach(() => vi.restoreAllMocks());

describe("invitation token hashing", () => {
  it("hashes a token with SHA-256 and never returns the raw value", () => {
    expect(TOKEN_HASH).toMatch(/^[a-f0-9]{64}$/);
    expect(TOKEN_HASH).not.toBe(RAW_TOKEN);
  });
});

describe("previewInvitation", () => {
  it("never reveals whether the invited email has an account", async () => {
    vi.spyOn(Invitation, "findOne").mockResolvedValue({
      tokenHash: TOKEN_HASH,
      workspace: WORKSPACE_ID,
      email: "someone@example.test",
      status: "pending",
      expiresAt: new Date(Date.now() + 10_000),
    });
    vi.spyOn(Workspace, "findById").mockReturnValue({ lean: () => Promise.resolve({ name: "Acme" }) });

    const preview = await previewInvitation(RAW_TOKEN);

    expect(preview).toEqual({ workspaceName: "Acme", email: "someone@example.test", status: "pending" });
    expect(Object.keys(preview).sort()).toEqual(["email", "status", "workspaceName"]);
  });

  it("returns 404 for an unknown token without distinguishing it from a malformed one", async () => {
    vi.spyOn(Invitation, "findOne").mockResolvedValue(null);

    await expect(previewInvitation(RAW_TOKEN)).rejects.toMatchObject({ statusCode: 404 });
    await expect(previewInvitation("not-a-valid-token")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("acceptInvitation", () => {
  const baseInvitation = () => ({
    _id: new mongoose.Types.ObjectId(),
    tokenHash: TOKEN_HASH,
    workspace: WORKSPACE_ID,
    email: "member@example.test",
    role: "member",
    invitedBy: new mongoose.Types.ObjectId(),
    status: "pending",
    expiresAt: new Date(Date.now() + 10_000),
  });

  it("rejects a wrong-account accept attempt WITHOUT consuming the single-use token", async () => {
    vi.spyOn(Invitation, "findOne").mockResolvedValue(baseInvitation());
    vi.spyOn(User, "findById").mockResolvedValue({ email: "someone-else@example.test" });
    vi.spyOn(Workspace, "findById").mockResolvedValue({ _id: WORKSPACE_ID, plan: "premium" });
    const consumeSpy = vi.spyOn(Invitation, "findOneAndUpdate");

    await expect(acceptInvitation(RAW_TOKEN, USER_ID)).rejects.toMatchObject({
      statusCode: 403,
      reasonCode: "EMAIL_MISMATCH",
    });
    expect(consumeSpy).not.toHaveBeenCalled();
  });

  it("rejects an already-accepted invitation WITHOUT attempting to consume it again", async () => {
    vi.spyOn(Invitation, "findOne").mockResolvedValue({ ...baseInvitation(), status: "accepted" });
    vi.spyOn(User, "findById").mockResolvedValue({ email: "member@example.test" });
    const consumeSpy = vi.spyOn(Invitation, "findOneAndUpdate");

    await expect(acceptInvitation(RAW_TOKEN, USER_ID)).rejects.toMatchObject({ statusCode: 409 });
    expect(consumeSpy).not.toHaveBeenCalled();
  });

  it("rejects an expired invitation WITHOUT attempting to consume it", async () => {
    vi.spyOn(Invitation, "findOne").mockResolvedValue({
      ...baseInvitation(),
      expiresAt: new Date(Date.now() - 10_000),
    });
    vi.spyOn(User, "findById").mockResolvedValue({ email: "member@example.test" });
    const consumeSpy = vi.spyOn(Invitation, "findOneAndUpdate");

    await expect(acceptInvitation(RAW_TOKEN, USER_ID)).rejects.toMatchObject({ statusCode: 410 });
    expect(consumeSpy).not.toHaveBeenCalled();
  });

  it("rolls back the consumed invitation when the member limit is reached", async () => {
    vi.spyOn(Invitation, "findOne").mockResolvedValue(baseInvitation());
    vi.spyOn(User, "findById").mockResolvedValue({ email: "member@example.test" });
    vi.spyOn(Workspace, "findById").mockResolvedValue({ _id: WORKSPACE_ID, plan: "premium" });
    vi.spyOn(Invitation, "findOneAndUpdate").mockResolvedValue({ ...baseInvitation(), status: "accepted" });
    incrementWorkspaceCounter.mockResolvedValue(false);
    const membershipCreate = vi.spyOn(Membership, "create");

    await expect(acceptInvitation(RAW_TOKEN, USER_ID)).rejects.toMatchObject({
      statusCode: 403,
      reasonCode: "MEMBER_LIMIT_REACHED",
    });
    expect(membershipCreate).not.toHaveBeenCalled();
  });

  it("creates an active Membership with the invited role once accepted", async () => {
    vi.spyOn(Invitation, "findOne").mockResolvedValue(baseInvitation());
    vi.spyOn(User, "findById").mockResolvedValue({ email: "member@example.test" });
    vi.spyOn(Workspace, "findById").mockResolvedValue({ _id: WORKSPACE_ID, plan: "premium" });
    const consumed = { ...baseInvitation(), status: "accepted" };
    vi.spyOn(Invitation, "findOneAndUpdate").mockResolvedValue(consumed);
    incrementWorkspaceCounter.mockResolvedValue(true);
    const membershipCreate = vi.spyOn(Membership, "create").mockResolvedValue([{ role: "member" }]);

    const result = await acceptInvitation(RAW_TOKEN, USER_ID);

    expect(membershipCreate).toHaveBeenCalledWith(
      [expect.objectContaining({ workspace: WORKSPACE_ID, user: USER_ID, role: "member", status: "active" })],
      { session: SESSION }
    );
    expect(result.membership.role).toBe("member");
  });
});
