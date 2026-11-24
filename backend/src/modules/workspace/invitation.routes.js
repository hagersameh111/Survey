import express from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import validate from "../../validations/validate.js";
import { invitationAcceptLimiter } from "../../middlewares/workspace-rate-limit.middleware.js";
import { acceptInvitationSchema } from "./workspace.validation.js";
import { preview, accept } from "./invitation.controller.js";

const router = express.Router();

// Public: read-only, token-scoped, never reveals account existence for the
// invited email.
router.get("/:token", invitationAcceptLimiter, preview);

// Token travels in the body (not the URL) to avoid access-log leakage.
// Requires authentication: the accepting user's own account email is
// compared against the invitation server-side (see
// invitation.service.js#acceptInvitation).
router.post(
  "/accept",
  auth,
  invitationAcceptLimiter,
  validate(acceptInvitationSchema),
  accept
);

export default router;
