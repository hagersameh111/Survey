// Mirrors backend/src/config/plans.js for DISPLAY purposes only — the
// backend is the sole source of enforcement. These limits are public
// product information (shown on the pricing page), not sensitive data.
export const PLAN_LIMITS = {
  free: { maxActiveSurveys: 2, shortCodeLength: 7, maxInvitedMembers: 0 },
  premium: { maxActiveSurveys: 10, shortCodeLength: 5, maxInvitedMembers: 5 },
  ultra: { maxActiveSurveys: Infinity, shortCodeLength: 4, maxInvitedMembers: 20 },
};

export const PLAN_LABELS = {
  free: "Free",
  premium: "Premium",
  ultra: "Ultra",
};
