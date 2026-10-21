import express from "express";
import {
  create,
  getById,
  getAll,
  update,
  addPageToForm,
  saveBuilder,
  publish,
  updateAccess,
} from "./form.controller.js";

import { auth } from "../../middlewares/auth.middleware.js";
import validate from "../../validations/validate.js";

import {
  createFormSchema,
  updateFormSchema,
  addPageSchema,
  saveBuilderSchema,
  formAccessSchema,
} from "./form.validation.js";

const router = express.Router();

router.post(
  "/",
  auth,
  validate(createFormSchema),
  create
);

router.get(
  "/:formId",
  auth,
  getById
);

router.get("/", auth, getAll);

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

router.patch(
  "/:formId/access",
  auth,
  validate(formAccessSchema),
  updateAccess
);
export default router;