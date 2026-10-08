import express from "express";
import {
  create,
  getById,
  update,
  addPageToForm,
  saveBuilder,
} from "./form.controller.js";

import { auth } from "../../middlewares/auth.middleware.js";
import validate from "../../validations/validate.js";

import {
  createFormSchema,
  updateFormSchema,
  addPageSchema,
  saveBuilderSchema,
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

export default router;