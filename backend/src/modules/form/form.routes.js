import express from "express";
import {
  create,
  close,
  duplicate,
  getById,
  getAll,
  update,
  addPageToForm,
  saveBuilder,
  publish,
  reopen,
  updateAccess,
  updateIdentityMode,
  remove,
  getFolders,
  getResponseStats,
} from "./form.controller.js";

import { auth } from "../../middlewares/auth.middleware.js";
import validate from "../../validations/validate.js";

import {
  createFormSchema,
  updateFormSchema,
  addPageSchema,
  saveBuilderSchema,
  formAccessSchema,
  updateIdentityModeSchema,
  formIdSchema,
} from "./form.validation.js";

const router = express.Router();

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

router.get("/", auth, getAll);
router.get("/folders", auth, getFolders);
router.get("/stats/responses", auth, getResponseStats);

router.post(
  "/",
  auth,
  validate(createFormSchema),
  create
);

router.post("/:formId/duplicate", auth, validateFormId, duplicate);

router.get(
  "/:formId",
  auth,
  validateFormId,
  getById
);

router.delete("/:formId", auth, validateFormId, remove);

router.patch(
  "/:formId",
  auth,
  validateFormId,
  validate(updateFormSchema),
  update
);

router.post(
  "/:formId/pages",
  auth,
  validateFormId,
  validate(addPageSchema),
  addPageToForm

);

router.put(
  "/:formId/builder",
  auth,
  validateFormId,
  validate(saveBuilderSchema),
  saveBuilder
);

router.post("/:formId/publish", auth, validateFormId, publish);
router.post("/:formId/close", auth, validateFormId, close);
router.post("/:formId/reopen", auth, validateFormId, reopen);

router.patch(
  "/:formId/access",
  auth,
  validateFormId,
  validate(formAccessSchema),
  updateAccess
);

router.patch(
  "/:formId/settings/identity-mode",
  auth,
  validateFormId,
  validate(updateIdentityModeSchema),
  updateIdentityMode
);
export default router;
