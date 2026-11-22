import { z } from "zod";

export const workspaceIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid workspace ID");
export const invitationIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid invitation ID");

export const createWorkspaceSchema = z
  .object({
    name: z.string().trim().max(200).optional(),
    plan: z.enum(["premium", "ultra"]),
  })
  .strict();

export const inviteMemberSchema = z
  .object({
    email: z.string().trim().email().max(254),
    role: z.enum(["admin", "member"]).default("member"),
  })
  .strict();

export const acceptInvitationSchema = z
  .object({
    token: z.string().trim().min(1),
  })
  .strict();

export const activateSubscriptionSchema = z
  .object({
    status: z.enum(["pending_activation", "active", "canceled", "past_due"]).optional(),
    plan: z.enum(["premium", "ultra"]).optional(),
    currentPeriodEnd: z.string().datetime().nullable().optional(),
  })
  .strict();
