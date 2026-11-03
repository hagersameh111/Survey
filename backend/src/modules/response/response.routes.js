import express from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import validate from "../../validations/validate.js";
import {
  formIdSchema,
  responseIdSchema,
  responseListQuerySchema,
  submitResponseSchema,
} from "./response.validation.js";
import { getById, list, submit } from "./response.controller.js";

const router = express.Router();

const optionalAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }

  return auth(req, res, next);
};

const validateFormId = (req, res, next) => {
  const result = formIdSchema.safeParse(req.params.formId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues[0]?.message || "Invalid form ID",
    });
  }

  return next();
};

const validateResponseId = (req, res, next) => {
  const result = responseIdSchema.safeParse(req.params.responseId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues[0]?.message || "Invalid response ID",
    });
  }

  return next();
};

const validateResponseListQuery = (req, res, next) => {
  const result = responseListQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues[0]?.message || "Invalid response query",
    });
  }

  req.responseListQuery = result.data;
  return next();
};

const readParticipantToken = (req, _res, next) => {
  req.participantToken = req.get("X-Participant-Token");
  return next();
};

router.get(
  "/:formId/responses",
  auth,
  validateFormId,
  validateResponseListQuery,
  list
);

router.get(
  "/:formId/responses/:responseId",
  auth,
  validateFormId,
  validateResponseId,
  getById
);

router.post(
  "/:formId/responses",
  optionalAuth,
  validateFormId,
  readParticipantToken,
  validate(submitResponseSchema),
  submit
);

export default router;
