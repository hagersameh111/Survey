import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Block Data Schemas
|--------------------------------------------------------------------------
*/

const headingDataSchema = z.object({
  text: z.string().trim().min(1).max(500),
});

const textDataSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

const imageDataSchema = z.object({
  url: z.string().url(),
  altText: z.string().trim().max(200).optional(),
});

const dividerDataSchema = z.object({});

const shortTextDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(200).optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
});

const longTextDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(500).optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
});

const emailDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(200).optional(),
});

const phoneDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(50).optional(),
});

const numberDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  min: z.number().optional(),
  max: z.number().optional(),
  placeholder: z.string().trim().max(100).optional(),
});

const dateDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
});

const choiceOptionSchema = z.object({
  label: z.string().trim().min(1).max(200),
});

const singleChoiceDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  options: z.array(choiceOptionSchema).min(1),
});

const multipleChoiceDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  options: z.array(choiceOptionSchema).min(1),
  maxSelections: z.number().int().min(1).optional(),
});

const dropdownDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  options: z.array(choiceOptionSchema).min(1),
});

const ratingDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  style: z.enum(["stars", "numbers", "emoji"]),
  scale: z.number().int().min(2).max(10),
});

/*
|--------------------------------------------------------------------------
| Block Schemas - Database Shape
|--------------------------------------------------------------------------
|
| These schemas include `order` because this is the shape stored in MongoDB.
|
*/

const headingBlockSchema = z.object({
  type: z.literal("heading"),
  order: z.number().int().min(1),
  data: headingDataSchema,
});

const textBlockSchema = z.object({
  type: z.literal("text"),
  order: z.number().int().min(1),
  data: textDataSchema,
});

const imageBlockSchema = z.object({
  type: z.literal("image"),
  order: z.number().int().min(1),
  data: imageDataSchema,
});

const dividerBlockSchema = z.object({
  type: z.literal("divider"),
  order: z.number().int().min(1),
  data: dividerDataSchema,
});

const shortTextBlockSchema = z.object({
  type: z.literal("short_text"),
  order: z.number().int().min(1),
  data: shortTextDataSchema,
});

const longTextBlockSchema = z.object({
  type: z.literal("long_text"),
  order: z.number().int().min(1),
  data: longTextDataSchema,
});

const emailBlockSchema = z.object({
  type: z.literal("email"),
  order: z.number().int().min(1),
  data: emailDataSchema,
});

const phoneBlockSchema = z.object({
  type: z.literal("phone"),
  order: z.number().int().min(1),
  data: phoneDataSchema,
});

const numberBlockSchema = z.object({
  type: z.literal("number"),
  order: z.number().int().min(1),
  data: numberDataSchema,
});

const dateBlockSchema = z.object({
  type: z.literal("date"),
  order: z.number().int().min(1),
  data: dateDataSchema,
});

const singleChoiceBlockSchema = z.object({
  type: z.literal("single_choice"),
  order: z.number().int().min(1),
  data: singleChoiceDataSchema,
});

const multipleChoiceBlockSchema = z.object({
  type: z.literal("multiple_choice"),
  order: z.number().int().min(1),
  data: multipleChoiceDataSchema,
});

const dropdownBlockSchema = z.object({
  type: z.literal("dropdown"),
  order: z.number().int().min(1),
  data: dropdownDataSchema,
});

const ratingBlockSchema = z.object({
  type: z.literal("rating"),
  order: z.number().int().min(1),
  data: ratingDataSchema,
});

/*
|--------------------------------------------------------------------------
| Block Schema - Database
|--------------------------------------------------------------------------
*/

const blockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  textBlockSchema,
  imageBlockSchema,
  dividerBlockSchema,
  shortTextBlockSchema,
  longTextBlockSchema,
  emailBlockSchema,
  phoneBlockSchema,
  numberBlockSchema,
  dateBlockSchema,
  singleChoiceBlockSchema,
  multipleChoiceBlockSchema,
  dropdownBlockSchema,
  ratingBlockSchema,
]);

/*
|--------------------------------------------------------------------------
| Block Schemas - Builder Save Request
|--------------------------------------------------------------------------
|
| These schemas DO NOT contain `order`.
| The order comes from the array position and is generated by the backend.
|
*/

const saveHeadingBlockSchema = z.object({
  type: z.literal("heading"),
  data: headingDataSchema,
});

const saveTextBlockSchema = z.object({
  type: z.literal("text"),
  data: textDataSchema,
});

const saveImageBlockSchema = z.object({
  type: z.literal("image"),
  data: imageDataSchema,
});

const saveDividerBlockSchema = z.object({
  type: z.literal("divider"),
  data: dividerDataSchema,
});

const saveShortTextBlockSchema = z.object({
  type: z.literal("short_text"),
  data: shortTextDataSchema,
});

const saveLongTextBlockSchema = z.object({
  type: z.literal("long_text"),
  data: longTextDataSchema,
});

const saveEmailBlockSchema = z.object({
  type: z.literal("email"),
  data: emailDataSchema,
});

const savePhoneBlockSchema = z.object({
  type: z.literal("phone"),
  data: phoneDataSchema,
});

const saveNumberBlockSchema = z.object({
  type: z.literal("number"),
  data: numberDataSchema,
});

const saveDateBlockSchema = z.object({
  type: z.literal("date"),
  data: dateDataSchema,
});

const saveSingleChoiceBlockSchema = z.object({
  type: z.literal("single_choice"),
  data: singleChoiceDataSchema,
});

const saveMultipleChoiceBlockSchema = z.object({
  type: z.literal("multiple_choice"),
  data: multipleChoiceDataSchema,
});

const saveDropdownBlockSchema = z.object({
  type: z.literal("dropdown"),
  data: dropdownDataSchema,
});

const saveRatingBlockSchema = z.object({
  type: z.literal("rating"),
  data: ratingDataSchema,
});

const saveBlockSchema = z.discriminatedUnion("type", [
  saveHeadingBlockSchema,
  saveTextBlockSchema,
  saveImageBlockSchema,
  saveDividerBlockSchema,
  saveShortTextBlockSchema,
  saveLongTextBlockSchema,
  saveEmailBlockSchema,
  savePhoneBlockSchema,
  saveNumberBlockSchema,
  saveDateBlockSchema,
  saveSingleChoiceBlockSchema,
  saveMultipleChoiceBlockSchema,
  saveDropdownBlockSchema,
  saveRatingBlockSchema,
]);

/*
|--------------------------------------------------------------------------
| Page Schema - Database
|--------------------------------------------------------------------------
*/

const pageSchema = z.object({
  type: z.enum([
    "welcome",
    "participant_info",
    "questions",
    "ending",
  ]),

  title: z.string().trim().max(200).optional(),

  description: z.string().trim().max(1000).optional(),

  order: z.number().int().min(1),

  blocks: z.array(blockSchema).default([]),
});

/*
|--------------------------------------------------------------------------
| Page Schema - Builder Save Request
|--------------------------------------------------------------------------
*/

const savePageSchema = z.object({
  id: z.string().optional(),

  type: z.enum([
    "welcome",
    "participant_info",
    "questions",
    "ending",
  ]),

  title: z.string().trim().max(200).optional(),

  description: z.string().trim().max(1000).optional(),

  blocks: z.array(
    z.object({
      id: z.string().optional(),
      type: z.string(),
      data: z.any(),
    })
  ).default([]),
});

/*
|--------------------------------------------------------------------------
| Create Form
|--------------------------------------------------------------------------
*/

export const createFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
});

/*
|--------------------------------------------------------------------------
| Update Form
|--------------------------------------------------------------------------
*/

export const updateFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
});

/*
|--------------------------------------------------------------------------
| Add Page
|--------------------------------------------------------------------------
*/

export const addPageSchema = z.object({
  type: z.enum([
    "welcome",
    "participant_info",
    "questions",
    "ending",
  ]),

  title: z
    .string()
    .trim()
    .max(200)
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000)
    .optional(),

  order: z
    .number()
    .int()
    .min(1)
    .optional(),
});

/*
|--------------------------------------------------------------------------
| Save Builder
|--------------------------------------------------------------------------
*/

export const saveBuilderSchema = z.object({
  pages: z.array(savePageSchema).default([]),
});