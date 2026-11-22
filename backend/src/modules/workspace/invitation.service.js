import { createHash, randomBytes } from "node:crypto";
import User from "../user/user.model.js";
import Workspace from "./workspace.model.js";
import Membership from "./membership.model.js";
import Invitation from "./invitation.model.js";
import Subscription from "./subscription.model.js";
import { incrementWorkspaceCounter } from "./workspace-write-fence.js";
import { runInMongoTransaction } from "../form/form-write-fence.js";
import { getActiveMembership } from "./workspace.service.js";
import { PLAN_LIMITS, INVITATION_EXPIRY_MS } from "../../config/plans.js";

// Mirrors response/participant-token.service.js's token generation/hashing
// exactly: 32 random bytes, base64url-encoded (43 chars), SHA-256 hash
// stored, raw token returned once and never logged.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const createInvitationError = (message, statusCode, reasonCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  // error.code is reserved for Mongo driver error codes (e.g. 11000), so the
  // machine-readable reason the frontend renders lives on its own field.
  if (reasonCode) error.reasonCode = reasonCode;
  return error;
};

export const hashInvitationToken = (rawToken) =>
  createHash("sha256").update(rawToken, "utf8").digest("hex");

const isValidInvitationToken = (rawToken) =>
  typeof rawToken === "string" && TOKEN_PATTERN.test(rawToken);

const requireActiveSubscription = async (workspaceId) => {
  const subscription = await Subscription.findOne({ workspace: workspaceId });

  if (!subscription || subscription.status !== "active") {
    throw createInvitationError(
      "This workspace's subscription is not active yet",
      403,
      "SUBSCRIPTION_NOT_ACTIVE"
    );
  }

  return subscription;
};

export const createInvitation = async (workspaceId, inviterUserId, { email, role }) => {
  const inviterMembership = await getActiveMembership(workspaceId, inviterUserId);

  if (!inviterMembership || (inviterMembership.role !== "owner" && inviterMembership.role !== "admin")) {
    throw createInvitationError("Only the workspace owner or an admin can invite members", 403);
  }

  await requireActiveSubscription(workspaceId);

  const normalizedEmail = email.trim().toLowerCase();

  // Lazily flip any stale pending-but-expired invitation for this email to
  // "expired" before enforcing the partial unique index, which only guards
  // genuinely pending invitations. Without this, an expired invitation that
  // was never otherwise touched would permanently block re-inviting the
  // same email.
  await Invitation.updateMany(
    { workspace: workspaceId, email: normalizedEmail, status: "pending", expiresAt: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashInvitationToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

  try {
    const invitation = await Invitation.create({
      workspace: workspaceId,
      email: normalizedEmail,
      role: role || "member",
      invitedBy: inviterUserId,
      tokenHash,
      status: "pending",
      expiresAt,
    });

    return { invitation, rawToken };
  } catch (error) {
    if (error.code === 11000) {
      throw createInvitationError(
        "There is already a pending invitation for this email",
        409,
        "INVITATION_ALREADY_PENDING"
      );
    }

    throw error;
  }
};

export const listPendingInvitations = async (workspaceId, userId) => {
  const membership = await getActiveMembership(workspaceId, userId);

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    throw createInvitationError("Only the workspace owner or an admin can view invitations", 403);
  }

  return Invitation.find({ workspace: workspaceId, status: "pending" }).lean();
};

export const revokeInvitation = async (workspaceId, invitationId, userId) => {
  const membership = await getActiveMembership(workspaceId, userId);

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    throw createInvitationError("Only the workspace owner or an admin can revoke invitations", 403);
  }

  const revoked = await Invitation.findOneAndUpdate(
    { _id: invitationId, workspace: workspaceId, status: "pending" },
    { $set: { status: "revoked" } },
    { returnDocument: "after" }
  );

  if (!revoked) {
    throw createInvitationError("Invitation not found", 404);
  }

  return revoked;
};

// Public preview — never reveals whether the invited email has an account.
export const previewInvitation = async (rawToken) => {
  if (!isValidInvitationToken(rawToken)) {
    throw createInvitationError("Invitation not found", 404);
  }

  const tokenHash = hashInvitationToken(rawToken);
  const invitation = await Invitation.findOne({ tokenHash });

  if (!invitation) {
    throw createInvitationError("Invitation not found", 404);
  }

  const workspace = await Workspace.findById(invitation.workspace).lean();
  const isExpired = invitation.status === "pending" && invitation.expiresAt < new Date();

  return {
    workspaceName: workspace?.name || "",
    email: invitation.email,
    status: isExpired ? "expired" : invitation.status,
  };
};

export const acceptInvitation = async (rawToken, acceptingUserId) => {
  if (!isValidInvitationToken(rawToken)) {
    throw createInvitationError("Invitation not found", 404);
  }

  const tokenHash = hashInvitationToken(rawToken);
  const invitation = await Invitation.findOne({ tokenHash });

  if (!invitation) {
    throw createInvitationError("Invitation not found", 404);
  }

  // Plain read-only pre-checks BEFORE any mutation, so a wrong-account or
  // already-resolved attempt never consumes the single-use token.
  const user = await User.findById(acceptingUserId);

  if (!user) {
    throw createInvitationError("User not found", 404);
  }

  if (user.email.toLowerCase() !== invitation.email) {
    throw createInvitationError(
      "This invitation was sent to a different email address",
      403,
      "EMAIL_MISMATCH"
    );
  }

  if (invitation.status === "accepted") {
    throw createInvitationError("This invitation has already been accepted", 409);
  }

  if (invitation.status === "revoked") {
    throw createInvitationError("This invitation has been revoked", 410);
  }

  if (invitation.status !== "pending" || invitation.expiresAt < new Date()) {
    throw createInvitationError("This invitation has expired", 410);
  }

  const workspace = await Workspace.findById(invitation.workspace);

  if (!workspace) {
    throw createInvitationError("Workspace not found", 404);
  }

  return runInMongoTransaction(async (session) => {
    const consumed = await Invitation.findOneAndUpdate(
      { _id: invitation._id, status: "pending", expiresAt: { $gt: new Date() } },
      { $set: { status: "accepted", acceptedAt: new Date(), acceptedBy: acceptingUserId } },
      { returnDocument: "after", session }
    );

    if (!consumed) {
      throw createInvitationError("This invitation is no longer available", 409);
    }

    const limit = PLAN_LIMITS[workspace.plan]?.maxInvitedMembers ?? 0;
    const incremented = await incrementWorkspaceCounter(
      workspace._id,
      "activeMemberCount",
      limit,
      session
    );

    if (!incremented) {
      throw createInvitationError(
        "This workspace has reached its member limit",
        403,
        "MEMBER_LIMIT_REACHED"
      );
    }

    try {
      const [membership] = await Membership.create(
        [
          {
            workspace: workspace._id,
            user: acceptingUserId,
            role: consumed.role,
            status: "active",
            invitedBy: consumed.invitedBy,
          },
        ],
        { session }
      );

      return { workspace, membership };
    } catch (membershipError) {
      if (membershipError.code === 11000) {
        throw createInvitationError("You are already a member of this workspace", 409);
      }

      throw membershipError;
    }
  });
};
