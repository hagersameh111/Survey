import { z } from "zod";

const questionIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Question ID must be a valid ObjectId");

export const formIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Form ID must be a valid ObjectId");

export const responseIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Response ID must be a valid ObjectId");

const positiveDecimalIntegerQuery = (maximum, defaultValue) =>
  z
    .string()
    .regex(/^[0-9]+$/, "Must be a positive decimal integer")
    .transform(Number)
    .pipe(z.number().int().positive().max(maximum))
    .optional()
    .transform((value) => value ?? defaultValue);

export const responseListQuerySchema = z
  .object({
    page: positiveDecimalIntegerQuery(1000, 1),
    limit: positiveDecimalIntegerQuery(100, 25),
    sort: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

const answerValueSchema = z.union([
  z.string(),
  z.number().finite(),
  z.array(z.string()),
]);

const answerSchema = z
  .object({
    questionId: questionIdSchema,
    value: answerValueSchema,
  })
  .strict();

export const submitResponseSchema = z
  .object({
    answers: z.array(answerSchema),
  })
  .strict();
