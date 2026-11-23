import express from "express";
import { z } from "zod";
import { auth } from "../../middlewares/auth.middleware.js";
import { create, list, redirect, update } from "./short-url.controller.js";

const router = express.Router();
const createSchema = z.object({
  url: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  file: z.object({
    name: z.string().min(1).max(255),
    type: z.string().max(150).optional(),
    data: z.string().min(1).max(7_000_000),
  }).optional(),
}).strict().refine((body) => Boolean(body.url) !== Boolean(body.file), "Provide either a URL or a file");
const updateSchema = z.object({ active: z.boolean().optional(), expiresAt: z.string().datetime().nullable().optional() }).strict();
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ success: false, message: result.error.issues[0]?.message || "Invalid short URL request" });
  req.body = result.data;
  return next();
};

router.get("/", auth, list);
router.post("/", auth, validate(createSchema), create);
router.patch("/:id", auth, validate(updateSchema), update);

export default router;

export const publicShortUrlRoutes = express.Router();
publicShortUrlRoutes.get("/:code", redirect);
