import express from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import validate from "../../validations/validate.js";
import {
  resolveWorkspaceMembership,
  requireWorkspaceRole,
  requirePlatformAdmin,
} from "../../middlewares/workspace.middleware.js";
import {
  workspaceCreationLimiter,
  invitationCreateLimiter,
} from "../../middlewares/workspace-rate-limit.middleware.js";
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  activateSubscriptionSchema,
  workspaceIdSchema,
} from "./workspace.validation.js";
import {
  create,
  list,
  getById,
  getMembers,
  deleteMember,
  createMemberInvitation,
  getInvitations,
  deleteInvitation,
  activate,
} from "./workspace.controller.js";

const router = express.Router();

const validateWorkspaceId = (req, res, next) => {
  const result = workspaceIdSchema.safeParse(req.params.workspaceId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues[0]?.message || "Invalid workspace ID",
    });
  }

  return next();
};

router.post("/", auth, workspaceCreationLimiter, validate(createWorkspaceSchema), create);
router.get("/", auth, list);

router.get("/:workspaceId", auth, validateWorkspaceId, getById);

router.get("/:workspaceId/members", auth, validateWorkspaceId, getMembers);
router.delete(
  "/:workspaceId/members/:userId",
  auth,
  validateWorkspaceId,
  resolveWorkspaceMembership,
  requireWorkspaceRole(["owner", "admin"]),
  deleteMember
);

router.post(
  "/:workspaceId/invitations",
  auth,
  validateWorkspaceId,
  invitationCreateLimiter,
  resolveWorkspaceMembership,
  requireWorkspaceRole(["owner", "admin"]),
  validate(inviteMemberSchema),
  createMemberInvitation
);
router.get(
  "/:workspaceId/invitations",
  auth,
  validateWorkspaceId,
  resolveWorkspaceMembership,
  requireWorkspaceRole(["owner", "admin"]),
  getInvitations
);
router.delete(
  "/:workspaceId/invitations/:invitationId",
  auth,
  validateWorkspaceId,
  resolveWorkspaceMembership,
  requireWorkspaceRole(["owner", "admin"]),
  deleteInvitation
);

router.post(
  "/:workspaceId/subscription/activate",
  auth,
  validateWorkspaceId,
  requirePlatformAdmin,
  validate(activateSubscriptionSchema),
  activate
);

export default router;
