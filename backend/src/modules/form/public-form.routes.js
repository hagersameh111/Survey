import express from "express";
import { getPublicById } from "./form.controller.js";
import { issue } from "../response/participant-token.controller.js";
import { participantTokenIssuanceLimiter } from "../../middlewares/participant-token-rate-limit.middleware.js";

const router = express.Router();

router.get("/:formId", getPublicById);
router.post("/:formId/participant-tokens", participantTokenIssuanceLimiter, issue);

export default router;
