// Single source of truth for plan entitlements. No payment provider is
// integrated yet; a Workspace's Subscription.status gates whether these
// limits are enforced at all (see workspace/subscription.model.js).
export const PLAN_LIMITS = {
  free: { maxActiveSurveys: 2, shortCodeLength: 7, maxInvitedMembers: 0 },
  premium: { maxActiveSurveys: 10, shortCodeLength: 5, maxInvitedMembers: 5 },
  ultra: { maxActiveSurveys: Infinity, shortCodeLength: 4, maxInvitedMembers: 20 },
};

// Infinity is only ever used as an in-memory comparison bound; it is never
// persisted to MongoDB/JSON.
export const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
