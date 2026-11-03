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

router.post(
  "/",
  auth,
  validate(createFormSchema),
  create
);

router.post("/:formId/duplicate", auth, duplicate);

router.get(
  "/:formId",
  auth,
  getById
);

router.get("/", auth, getAll);

router.delete("/:formId", auth, validateFormId, remove);

router.patch(
  "/:formId",
  auth,
  validate(updateFormSchema),
  update
);

router.post(
  "/:formId/pages",
  auth,
  validate(addPageSchema),
  addPageToForm

);

router.put(
  "/:formId/builder",
  auth,
  validate(saveBuilderSchema),
  saveBuilder
);

router.post("/:formId/publish", auth, publish);
router.post("/:formId/close", auth, close);
router.post("/:formId/reopen", auth, reopen);

router.patch(
  "/:formId/access",
  auth,
  validate(formAccessSchema),
  updateAccess
);

router.patch(
  "/:formId/settings/identity-mode",
  auth,
  validate(updateIdentityModeSchema),
  updateIdentityMode
);
export default router;
