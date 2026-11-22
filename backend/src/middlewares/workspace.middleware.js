import { getActiveMembership } from "../modules/workspace/workspace.service.js";

// Loads the caller's active Membership for req.params.workspaceId and
// attaches it as req.workspaceMembership. 404s (not 403s) when there is no
// active membership, so a non-member can never distinguish "workspace
// exists but I'm not in it" from "workspace doesn't exist" — same IDOR-safe
// convention as Form's "Form not found" on denied access.
export const resolveWorkspaceMembership = async (req, res, next) => {
  try {
    const membership = await getActiveMembership(req.params.workspaceId, req.user.id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    req.workspaceMembership = membership;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Must run after resolveWorkspaceMembership.
export const requireWorkspaceRole = (roles) => (req, res, next) => {
  if (!req.workspaceMembership || !roles.includes(req.workspaceMembership.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action in this workspace",
    });
  }

  return next();
};

// Platform-admin privilege is the pre-existing, global User.role field —
// deliberately namespaced apart from workspace owner/admin roles, which
// only grant privileges within a single workspace.
export const requirePlatformAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Platform admin privileges required",
    });
  }

  return next();
};
