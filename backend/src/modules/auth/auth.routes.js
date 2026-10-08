import express from "express";

import { register, login, getMe } from "./auth.controller.js";

import validate from "../../validations/validate.js";

import { registerSchema, loginSchema } from "./auth.validation.js";

import { auth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.get(
  "/me",
  auth,
  getMe
);

export default router;