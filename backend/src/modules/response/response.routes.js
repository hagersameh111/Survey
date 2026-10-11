import express from "express";
import { getForm, submit } from "./response.controller.js";

const router = express.Router();
router.get("/:formId", getForm);
router.post("/:formId/responses", submit);
export default router;
