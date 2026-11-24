import rateLimit from "express-rate-limit";

// Same express-rate-limit shape as
// middlewares/participant-token-rate-limit.middleware.js. The default store
// is in-memory and per application process — a deployment with multiple
// backend instances may need a shared rate-limit store to enforce one
// global limit; that store is not added here, matching this project's
// existing policy of not adding that infrastructure until the deployment
// topology requires it.
export const workspaceCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many workspace-creation requests. Try again later.",
    }),
});

export const invitationCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many invitation requests. Try again later.",
    }),
});

export const invitationAcceptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many invitation-acceptance attempts. Try again later.",
    }),
});
