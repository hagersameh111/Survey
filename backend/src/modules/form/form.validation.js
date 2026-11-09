import { z } from "zod";

export const formIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid form ID");

/*
|--------------------------------------------------------------------------
| Block Data Schemas
|--------------------------------------------------------------------------
*/


export const formAccessSchema = z.discriminatedUnion("type", [
    z.object({
    type: z.literal("open"),
  }),

  z.object({
    type: z.literal("code"),
    code: z.string().trim().min(4).max(64),
  }),
]);

export const updateIdentityModeSchema = z
  .object({
    identityMode: z.enum(["anonymous", "identified"]),
  })
  .strict();


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

const validateTextLengthBounds = (data, context) => {
  if (
    data.minLength !== undefined &&
    data.maxLength !== undefined &&
    data.minLength > data.maxLength
  ) {
    context.addIssue({
      code: "custom",
      path: ["maxLength"],
      message: "Maximum length must be greater than or equal to minimum length",
    });
  }
};

const shortTextDataSchema = z.object({
  fieldKey: z.enum(["name", "dob", "age", "email", "phone", "nationality", "country", "city", "gender", "customised"]).optional(),
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(200).optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
}).superRefine(validateTextLengthBounds);

const longTextDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(500).optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
}).superRefine(validateTextLengthBounds);

const emailDataSchema = z.object({
  fieldKey: z.enum(["name", "dob", "age", "email", "phone", "nationality", "country", "city", "gender", "customised"]).optional(),
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(200).optional(),
});

const phoneDataSchema = z.object({
  fieldKey: z.enum(["name", "dob", "age", "email", "phone", "nationality", "country", "city", "gender", "customised"]).optional(),
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(50).optional(),
});

const numberDataSchema = z.object({
  fieldKey: z.enum(["age"]).optional(),
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  min: z.number().optional(),
  max: z.number().optional(),
  placeholder: z.string().trim().max(100).optional(),
}).superRefine((data, context) => {
  if (data.min !== undefined && data.max !== undefined && data.min > data.max) {
    context.addIssue({
      code: "custom",
      path: ["max"],
      message: "Maximum must be greater than or equal to minimum",
    });
  }
});

export const isValidDateOnly = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return day >= 1 && day <= daysInMonth[month - 1];
};

const dateOnlySchema = z.string().refine(isValidDateOnly, {
  message: "Date must be a valid YYYY-MM-DD calendar date",
});

const dateDataSchema = z.object({
  fieldKey: z.enum(["name", "dob", "age", "email", "phone", "nationality", "country", "city", "gender", "customised"]).optional(),
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  minDate: dateOnlySchema.optional(),
  maxDate: dateOnlySchema.optional(),
}).superRefine((data, context) => {
  if (
    data.minDate !== undefined &&
    data.maxDate !== undefined &&
    data.minDate > data.maxDate
  ) {
    context.addIssue({
      code: "custom",
      path: ["maxDate"],
      message: "Maximum date must be on or after minimum date",
    });
  }
});

const choiceOptionSchema = z.object({
  label: z.string().trim().min(1).max(200),
});

const choiceOptionsSchema = z.array(choiceOptionSchema).min(1).superRefine((options, context) => {
  const seenLabels = new Set();

  options.forEach((option, index) => {
    if (seenLabels.has(option.label)) {
      context.addIssue({
        code: "custom",
        path: [index, "label"],
        message: "Choice labels must be unique within a question",
      });
    }

    seenLabels.add(option.label);
  });
});

const singleChoiceDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  options: choiceOptionsSchema,
});

const multipleChoiceDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  options: choiceOptionsSchema,
  maxSelections: z.number().int().min(1).optional(),
}).superRefine((data, context) => {
  if (
    data.maxSelections !== undefined &&
    data.maxSelections > data.options.length
  ) {
    context.addIssue({
      code: "custom",
      path: ["maxSelections"],
      message: "Maximum selections cannot exceed the number of options",
    });
  }
});

const dropdownDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  options: choiceOptionsSchema,
});

const ratingDataSchema = z.object({
  question: z.string().trim().min(1).max(500),
  description: z.string().trim().max(1000).optional(),
  required: z.boolean().default(false),
  style: z.enum(["stars", "numbers", "emoji"]),
  scale: z.number().int().min(2).max(10),
});

export const questionDataSchemas = {
  short_text: shortTextDataSchema,
  long_text: longTextDataSchema,
  email: emailDataSchema,
  phone: phoneDataSchema,
  number: numberDataSchema,
  date: dateDataSchema,
  single_choice: singleChoiceDataSchema,
  multiple_choice: multipleChoiceDataSchema,
  dropdown: dropdownDataSchema,
  rating: ratingDataSchema,
};

export const publicBlockDataSchemas = {
  heading: headingDataSchema,
  text: textDataSchema,
  image: imageDataSchema,
  divider: dividerDataSchema,
  ...questionDataSchemas,
};

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

const saveBlockWithIdSchema = z.intersection(
  saveBlockSchema,
  z.object({ id: z.string().optional() })
);

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

  buttonText: z.string().trim().max(100).optional(),
  ratingRequired: z.boolean().optional(),
  nextForm: z.object({
    enabled: z.boolean().optional(),
    formId: z.string().max(100).optional(),
    formName: z.string().max(200).optional(),
    url: z.string().max(2000).optional(),
    buttonText: z.string().max(100).optional(),
  }).strict().optional(),

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

  buttonText: z.string().trim().max(100).optional(),
  ratingRequired: z.boolean().optional(),
  nextForm: z.object({
    enabled: z.boolean().optional(),
    formId: z.string().max(100).optional(),
    formName: z.string().max(200).optional(),
    url: z.string().max(2000).optional(),
    buttonText: z.string().max(100).optional(),
  }).strict().optional(),

  blocks: z.array(saveBlockWithIdSchema).default([]),
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

  folder: z.string().trim().min(1).max(100).optional(),
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

  folder: z.string().trim().min(1).max(100).optional(),
  settings: z.object({
    identityMode: z.enum(["anonymous", "identified"]).optional(),
    formSlug: z.string().trim().max(200).optional(),
    language: z.string().trim().max(50).optional(),
    emailNotifications: z.boolean().optional(),
    collectEmails: z.boolean().optional(),
    limitOneResponse: z.boolean().optional(),
    themeColor: z.string().regex(/^#[\da-f]{6}$/i).optional(),
    cardStyle: z.string().trim().max(50).optional(),
    progressBar: z.boolean().optional(),
  }).strict().optional(),
}).strict();

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
