import {
  createWorkspace,
  listWorkspacesForUser,
  getWorkspaceForUser,
  listActiveMembers,
  removeMember,
  activateSubscription,
} from "./workspace.service.js";
import {
  createInvitation,
  listPendingInvitations,
  revokeInvitation,
} from "./invitation.service.js";

const handleError = (error, res, fallbackMessage) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.reasonCode ? { code: error.reasonCode } : {}),
    });
  }

  console.error(fallbackMessage, { errorName: error?.name || "Error" });

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const create = async (req, res) => {
  try {
    const workspace = await createWorkspace(req.user.id, req.body);

    return res.status(201).json({ success: true, data: workspace });
  } catch (error) {
    return handleError(error, res, "Workspace creation failed");
  }
};

export const list = async (req, res) => {
  try {
    const workspaces = await listWorkspacesForUser(req.user.id);

    return res.status(200).json({ success: true, data: workspaces });
  } catch (error) {
    return handleError(error, res, "Workspace listing failed");
  }
};

export const getById = async (req, res) => {
  try {
    const { workspace } = await getWorkspaceForUser(req.params.workspaceId, req.user.id);

    return res.status(200).json({ success: true, data: workspace });
  } catch (error) {
    return handleError(error, res, "Workspace lookup failed");
  }
};

export const getMembers = async (req, res) => {
  try {
    const members = await listActiveMembers(req.params.workspaceId, req.user.id);

    return res.status(200).json({ success: true, data: members });
  } catch (error) {
    return handleError(error, res, "Member listing failed");
  }
};

export const deleteMember = async (req, res) => {
  try {
    await removeMember(req.params.workspaceId, req.params.userId, req.user.id);

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res, "Member removal failed");
  }
};

export const createMemberInvitation = async (req, res) => {
  try {
    const { invitation, rawToken } = await createInvitation(
      req.params.workspaceId,
      req.user.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      data: {
        invitationId: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitationToken: rawToken,
      },
    });
  } catch (error) {
    return handleError(error, res, "Invitation creation failed");
  }
};

export const getInvitations = async (req, res) => {
  try {
    const invitations = await listPendingInvitations(req.params.workspaceId, req.user.id);

    return res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    return handleError(error, res, "Invitation listing failed");
  }
};

export const deleteInvitation = async (req, res) => {
  try {
    await revokeInvitation(req.params.workspaceId, req.params.invitationId, req.user.id);

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res, "Invitation revocation failed");
  }
};

export const activate = async (req, res) => {
  try {
    const subscription = await activateSubscription(req.params.workspaceId, req.body);

    return res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    return handleError(error, res, "Subscription activation failed");
  }
};
