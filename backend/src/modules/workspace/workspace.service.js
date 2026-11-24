import mongoose from "mongoose";
import User from "../user/user.model.js";
import Workspace from "./workspace.model.js";
import Membership from "./membership.model.js";
import Subscription from "./subscription.model.js";
import { decrementWorkspaceCounter } from "./workspace-write-fence.js";
import { runInMongoTransaction } from "../form/form-write-fence.js";

const createServiceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const createWorkspace = async (userId, { name, plan }) => {
  if (plan !== "premium" && plan !== "ultra") {
    throw createServiceError("Invalid plan", 400);
  }

  return runInMongoTransaction(async (session) => {
    const [workspace] = await Workspace.create(
      [
        {
          name: name || "",
          owner: userId,
          plan,
          activeSurveyCount: 0,
          activeMemberCount: 0,
        },
      ],
      { session }
    );

    await Membership.create(
      [
        {
          workspace: workspace._id,
          user: userId,
          role: "owner",
          status: "active",
        },
      ],
      { session }
    );

    await Subscription.create(
      [
        {
          workspace: workspace._id,
          plan,
          status: "pending_activation",
        },
      ],
      { session }
    );

    return workspace;
  });
};

export const listWorkspacesForUser = async (userId) => {
  const memberships = await Membership.find({ user: userId, status: "active" }).lean();
  const workspaceIds = memberships.map((membership) => membership.workspace);

  const [workspaces, subscriptions] = await Promise.all([
    Workspace.find({ _id: { $in: workspaceIds } }).lean(),
    Subscription.find({ workspace: { $in: workspaceIds } }).select("workspace status").lean(),
  ]);
  const membershipByWorkspace = new Map(
    memberships.map((membership) => [String(membership.workspace), membership])
  );
  const subscriptionByWorkspace = new Map(
    subscriptions.map((subscription) => [String(subscription.workspace), subscription.status])
  );

  return workspaces.map((workspace) => ({
    ...workspace,
    role: membershipByWorkspace.get(String(workspace._id))?.role,
    subscriptionStatus: subscriptionByWorkspace.get(String(workspace._id)),
  }));
};

export const getActiveMembership = async (workspaceId, userId) => {
  if (!mongoose.isValidObjectId(workspaceId)) {
    return null;
  }

  return Membership.findOne({
    workspace: workspaceId,
    user: userId,
    status: "active",
  });
};

export const getWorkspaceForUser = async (workspaceId, userId) => {
  const membership = await getActiveMembership(workspaceId, userId);

  if (!membership) {
    throw createServiceError("Workspace not found", 404);
  }

  const workspace = await Workspace.findById(workspaceId).lean();

  if (!workspace) {
    throw createServiceError("Workspace not found", 404);
  }

  const subscription = await Subscription.findOne({ workspace: workspaceId }).select("status").lean();

  return { workspace: { ...workspace, subscriptionStatus: subscription?.status }, membership };
};

export const listActiveMembers = async (workspaceId, userId) => {
  await getWorkspaceForUser(workspaceId, userId);

  const memberships = await Membership.find({ workspace: workspaceId, status: "active" })
    .populate("user", "firstName lastName email avatar")
    .lean();

  return memberships.map((membership) => ({
    membershipId: membership._id,
    role: membership.role,
    joinedAt: membership.joinedAt,
    user: membership.user,
  }));
};

export const removeMember = async (workspaceId, targetUserId, actingUserId) => {
  const { membership: actingMembership } = await getWorkspaceForUser(workspaceId, actingUserId);

  if (actingMembership.role !== "owner" && actingMembership.role !== "admin") {
    throw createServiceError("Only the workspace owner or an admin can remove members", 403);
  }

  const targetMembership = await Membership.findOne({
    workspace: workspaceId,
    user: targetUserId,
    status: "active",
  });

  if (!targetMembership) {
    throw createServiceError("Member not found", 404);
  }

  if (targetMembership.role === "owner") {
    throw createServiceError("The workspace owner cannot be removed", 400);
  }

  await runInMongoTransaction(async (session) => {
    const removed = await Membership.findOneAndUpdate(
      { _id: targetMembership._id, status: "active" },
      { $set: { status: "removed", removedAt: new Date() } },
      { returnDocument: "after", session }
    );

    if (!removed) {
      throw createServiceError("Member not found", 404);
    }

    await decrementWorkspaceCounter(workspaceId, "activeMemberCount", session);
  });
};

// Platform-admin only (see middlewares/workspace.middleware.js
// requirePlatformAdmin). Stands in for a real billing-provider webhook
// until one is integrated — never reachable by a workspace owner/admin
// themselves, so a user can never self-upgrade.
export const activateSubscription = async (workspaceId, { status, plan, currentPeriodEnd }) => {
  const subscription = await Subscription.findOne({ workspace: workspaceId });

  if (!subscription) {
    throw createServiceError("Workspace not found", 404);
  }

  if (status !== undefined) {
    subscription.status = status;
  }

  if (plan !== undefined) {
    subscription.plan = plan;
    await Workspace.updateOne({ _id: workspaceId }, { $set: { plan } });
  }

  if (currentPeriodEnd !== undefined) {
    subscription.currentPeriodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  }

  await subscription.save();

  return subscription;
};

export const getWorkspacePlanAndStatus = async (workspaceId) => {
  const [workspace, subscription] = await Promise.all([
    Workspace.findById(workspaceId),
    Subscription.findOne({ workspace: workspaceId }),
  ]);

  return { workspace, subscription };
};

// Shared-form authorization check. Private-form semantics are left to the
// caller (form.service.js) to preserve byte-for-byte identical behavior to
// the pre-existing `{owner: userId}` query filter.
export const hasActiveWorkspaceAccess = async (workspaceId, userId) => {
  const membership = await getActiveMembership(workspaceId, userId);
  return Boolean(membership);
};

export const assertUserExists = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw createServiceError("User not found", 404);
  }

  return user;
};
