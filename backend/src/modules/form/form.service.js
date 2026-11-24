import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Form from "./form.model.js";
import Response from "../response/response.model.js";
import ParticipantToken from "../response/participant-token.model.js";
import {
  coordinateFormWrite,
  createTransactionConflictError,
  isTransactionConflict,
  runInMongoTransaction,
} from "./form-write-fence.js";
import { publicBlockDataSchemas, questionDataSchemas } from "./form.validation.js";
import Workspace from "../workspace/workspace.model.js";
import Subscription from "../workspace/subscription.model.js";
import { hasActiveWorkspaceAccess } from "../workspace/workspace.service.js";
import {
  incrementWorkspaceCounter,
  decrementWorkspaceCounter,
} from "../workspace/workspace-write-fence.js";
import {
  incrementUserCounter,
  decrementUserCounter,
} from "../user/user-write-fence.js";
import { PLAN_LIMITS } from "../../config/plans.js";

import bcrypt from "bcrypt";

const ANSWERABLE_BLOCK_TYPES = new Set(Object.keys(questionDataSchemas));

const hasAnswerableBlock = (page) =>
  (page.blocks || []).some((block) => ANSWERABLE_BLOCK_TYPES.has(block.type));

const validateBlocksForPublishing = (pages, errors) => {
  pages.forEach((page, pageIndex) => {
    (page.blocks || []).forEach((block, blockIndex) => {
      const pageReference = `page ${page.order ?? pageIndex + 1} (${page._id ?? "unknown"})`;
      const blockReference = `block ${block.order ?? blockIndex + 1} (${block._id ?? "unknown"})`;
      const dataSchema = publicBlockDataSchemas[block.type];

      if (!dataSchema) {
        errors.push(`${pageReference}, ${blockReference}: unsupported block type "${String(block.type)}"`);
        return;
      }

      const result = dataSchema.safeParse(block.data ?? {});
      if (!result.success) {
        for (const issue of result.error.issues) {
          const dataPath = issue.path.length > 0 ? issue.path.join(".") : "data";
          errors.push(`${pageReference}, ${blockReference} (${block.type}), data.${dataPath}: ${issue.message}`);
        }
      }
    });
  });
};

const getIdentityMode = (identityMode) => {
  if (identityMode === undefined) {
    return "anonymous";
  }

  if (identityMode === "anonymous" || identityMode === "identified") {
    return identityMode;
  }

  throw new Error("Invalid stored identity mode");
};

const assertFormIsDraft = (form) => {
  if (form.status !== "draft") {
    throw new Error("Form content can only be changed for draft forms");
  }
};

const saveForm = async (form) => {
  try {
    await form.save();
  } catch (error) {
    if (error?.name === "VersionError") {
      const conflict = new Error(
        "Form was changed by another request. Reload and try again."
      );
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
};

// Shared-form authorization. Private forms keep EXACTLY the same check as
// before this feature (`String(form.owner) === String(userId)`), so every
// function below behaves identically for private forms; only a Shared form
// additionally allows any active member of its workspace, any role — any
// active member may create/edit/publish/close/delete Shared surveys.
//
// Every call re-reads Membership fresh (hasActiveWorkspaceAccess), so a
// request whose check runs after a removal commits is correctly denied.
// A request already past this check when removal commits may still
// complete its action — see "Membership-removal concurrency: the actual
// guarantee" in docs/workspace-concurrency.md for the precise, tested
// contract; this is a deliberate, documented bound, not an oversight.
const assertFormAccess = async (form, userId) => {
  if (!form) {
    return false;
  }

  if (form.visibility === "shared") {
    if (!form.workspace) {
      return false;
    }

    return hasActiveWorkspaceAccess(form.workspace, userId);
  }

  return String(form.owner) === String(userId);
};

// URL convenience only — never treated as authorization. Ambiguity-free
// alphabet (no 0/O/1/I/l). A small modulo bias from byte%alphabet.length is
// acceptable for a non-cryptographic convenience code at these lengths.
const SHORT_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

const generateShortCode = (length) => {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => SHORT_CODE_ALPHABET[byte % SHORT_CODE_ALPHABET.length]).join("");
};

const createFormAtomicWithShortCode = async (attrs, shortCodeLength) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Form.create({ ...attrs, shortCode: generateShortCode(shortCodeLength) });
    } catch (error) {
      if (error.code === 11000 && attempt < 4) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Could not generate a unique short code");
};

const createFormError = (message, statusCode, reasonCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (reasonCode) error.reasonCode = reasonCode;
  return error;
};

export const createForm = async (userId, formData) => {
  const { title, description, folder, visibility, workspaceId } = formData;

  let shortCodeLength = PLAN_LIMITS.free.shortCodeLength;
  let resolvedWorkspace = null;
  let resolvedVisibility = "private";

  if (visibility === "shared") {
    if (!workspaceId) {
      throw createFormError("workspaceId is required for shared forms", 400);
    }

    const hasAccess = await hasActiveWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw createFormError("You do not have access to this workspace", 403);
    }

    const subscription = await Subscription.findOne({ workspace: workspaceId });
    if (!subscription || subscription.status !== "active") {
      throw createFormError(
        "This workspace's subscription is not active yet",
        403,
        "SUBSCRIPTION_NOT_ACTIVE"
      );
    }

    const workspace = await Workspace.findById(workspaceId);
    resolvedVisibility = "shared";
    resolvedWorkspace = workspaceId;
    shortCodeLength = PLAN_LIMITS[workspace.plan].shortCodeLength;
  }

  return createFormAtomicWithShortCode(
    {
      owner: userId,
      title,
      description,
      folder: folder || "my-workspace",
      status: "draft",
      visibility: resolvedVisibility,
      workspace: resolvedWorkspace,
    },
    shortCodeLength
  );
};

export const duplicateForm = async (formId, userId) => {
  const sourceForm = await Form.findOne({ _id: formId });

  if (!sourceForm || !(await assertFormAccess(sourceForm, userId))) {
    throw new Error("Form not found");
  }

  // A duplicate is always created as a private draft owned by the person
  // duplicating it. For a form that was already private and owned by the
  // caller (the only case possible before this feature), this is identical
  // to prior behavior. Promoting a duplicate back to "shared" is a
  // deliberate, separate action, not an automatic side effect of copying.
  const form = await createFormAtomicWithShortCode(
    {
      owner: userId,
      title: sourceForm.title,
      description: sourceForm.description,
      status: "draft",
      visibility: "private",
      workspace: null,
      settings: {
        identityMode: getIdentityMode(sourceForm.settings?.identityMode),
      },
      pages: sourceForm.pages.map((page) => ({
        type: page.type,
        title: page.title,
        description: page.description,
        buttonText: page.buttonText,
        ratingRequired: page.ratingRequired,
        nextForm: structuredClone(page.nextForm || {}),
        order: page.order,
        blocks: page.blocks.map((block) => ({
          type: block.type,
          order: block.order,
          data: structuredClone(block.data),
        })),
      })),
    },
    PLAN_LIMITS.free.shortCodeLength
  );

  return form;
};

export const getFormById = async (formId, userId) => {
  const form = await Form.findOne({ _id: formId });

  if (!form || !(await assertFormAccess(form, userId))) {
    throw new Error("Form not found");
  }

  return form;
};

export const deleteForm = async (formId, userId) => {
  if (
    typeof formId !== "string" ||
    !/^[a-f\d]{24}$/i.test(formId) ||
    !mongoose.isValidObjectId(formId)
  ) {
    const error = new Error("Invalid form ID");
    error.statusCode = 400;
    throw error;
  }

  const form = await Form.findOne({ _id: formId });

  if (!form || !(await assertFormAccess(form, userId))) {
    const error = new Error("Form not found");
    error.statusCode = 404;
    throw error;
  }

  const criteria =
    form.visibility === "shared"
      ? { workspace: form.workspace, visibility: "shared" }
      : { owner: userId };

  try {
    await runInMongoTransaction(async (session) => {
      const coordinated = await coordinateFormWrite(formId, session, criteria);
      if (!coordinated) {
        const error = new Error("Form not found");
        error.statusCode = 404;
        throw error;
      }

      // Atomically fetch-and-delete, inside the same transaction/session as
      // the fence bump above, so the quota decision below is derived from
      // the Form's TRUE current status as of this transaction — never from
      // the pre-transaction read above. A concurrent publish/reopen/close
      // could have changed `status` between that outer read and this
      // transaction starting; deciding the counter update from the stale
      // outer value (the bug the prior review flagged) can silently
      // miscount the workspace's active-survey counter. Deriving it from
      // `deletedForm` here — captured atomically at the moment of
      // deletion — closes that gap.
      const deletedForm = await Form.findOneAndDelete(
        { _id: formId, ...criteria },
        { session }
      );

      if (!deletedForm) {
        const error = new Error("Form not found");
        error.statusCode = 404;
        throw error;
      }

      await Response.deleteMany({ form: formId }, { session });
      await ParticipantToken.deleteMany({ form: formId }, { session });

      if (deletedForm.visibility === "shared" && deletedForm.status === "published") {
        await decrementWorkspaceCounter(deletedForm.workspace, "activeSurveyCount", session);
      }

      if (deletedForm.visibility === "private" && deletedForm.status === "published") {
        await decrementUserCounter(deletedForm.owner, "activePrivateSurveyCount", session);
      }
    });
  } catch (error) {
    if (isTransactionConflict(error)) {
      throw createTransactionConflictError();
    }

    throw error;
  }
};

const isSafeRedirectUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch { return false; }
};

const toPublicFormDto = (form) => ({
  _id: form._id.toString(),
  title: form.title,
  description: form.description,
  identityMode: getIdentityMode(form.settings?.identityMode),
  status: form.status,
  settings: structuredClone(form.settings?.toObject?.() ?? form.settings ?? {}),
  pages: [...form.pages]
    .sort((left, right) => left.order - right.order)
    .map((page) => ({
      _id: page._id.toString(),
      type: page.type,
      title: page.title,
      description: page.description,
      buttonText: page.buttonText,
      config: structuredClone(page.config || {}),
      ratingRequired: page.ratingRequired,
      nextForm: (() => {
        const config = structuredClone(page.nextForm || {});
        if (config.enabled && config.url && !isSafeRedirectUrl(config.url)) {
          throw new Error("Published Form contains an invalid redirect URL");
        }
        return config;
      })(),
      order: page.order,
      blocks: [...page.blocks]
        .sort((left, right) => left.order - right.order)
        .map((block) => {
          const dataSchema = publicBlockDataSchemas[block.type];
          const parsedData = dataSchema?.safeParse(block.data ?? {});

          if (!block._id || !parsedData?.success) {
            throw new Error("Published Form contains invalid block configuration");
          }

          return {
            _id: block._id.toString(),
            type: block.type,
            order: block.order,
            data: parsedData.data,
          };
        }),
    })),
});

export const getPublicFormById = async (formId) => {
  if (
    typeof formId !== "string" ||
    !/^[a-f\d]{24}$/i.test(formId) ||
    !mongoose.isValidObjectId(formId)
  ) {
    const error = new Error("Invalid form ID");
    error.statusCode = 400;
    throw error;
  }

  const form = await Form.findById(formId);
  if (!form) return null;
  if (form.status !== "published") {
    const messages = { draft: "This survey is not published", paused: "This survey is paused", closed: "This survey is closed", expired: "This survey has expired" };
    const error = new Error(messages[form.status] || "This survey is unavailable");
    error.statusCode = 403;
    throw error;
  }
  if (form.access?.type !== "open") {
    const error = new Error("This survey is not publicly accessible");
    error.statusCode = 403;
    throw error;
  }

  return form ? toPublicFormDto(form) : null;
};

export const getAllForms = async (userId) => {
  return listForms(userId);
};

export const listForms = async (
  userId,
  { folder, sort = "updatedAt", order = "desc", visibility, workspaceId } = {}
) => {
  let filter;

  if (workspaceId) {
    if (!(await hasActiveWorkspaceAccess(workspaceId, userId))) {
      throw createFormError("Workspace not found", 404);
    }

    filter = { workspace: workspaceId, visibility: "shared" };
  } else {
    filter = { owner: userId, visibility: visibility || "private" };
  }

  if (folder === "drafts") {
    filter.status = "draft";
  } else if (folder && folder !== "my-workspace") {
    filter.folder = folder;
  }

  const sortField = {
    created_at: "createdAt",
    updated_at: "updatedAt",
    title: "title",
  }[sort] || "updatedAt";
  const sortOrder = order === "asc" ? 1 : -1;

  return Form.find(filter)
    .select("-__v")
    .sort({ [sortField]: sortOrder })
    .lean();
};

export const updateForm = async (formId, userId, formData) => {
  const form = await Form.findOne({ _id: formId });

  if (!form || !(await assertFormAccess(form, userId))) {
    throw new Error("Form not found");
  }

  assertFormIsDraft(form);

  if (formData.title !== undefined) {
    form.title = formData.title;
  }

  if (formData.description !== undefined) {
    form.description = formData.description;
  }

  if (formData.folder !== undefined) {
    form.folder = formData.folder;
  }

  if (formData.settings !== undefined) {
    form.settings = { ...form.settings?.toObject?.(), ...formData.settings };
  }

  await saveForm(form);

  return form;
};

export const addPage = async (formId, userId, pageData) => {
  const form = await Form.findOne({ _id: formId });

  if (!form || !(await assertFormAccess(form, userId))) {
    throw new Error("Form not found");
  }

  assertFormIsDraft(form);

  const pages = form.pages;

  const hasWelcome = pages.some(
    (page) => page.type === "welcome"
  );

  const hasParticipantInfo = pages.some(
    (page) => page.type === "participant_info"
  );

  const hasEnding = pages.some(
    (page) => page.type === "ending"
  );

  // Welcome rules
  if (pageData.type === "welcome") {
    if (hasWelcome) {
      throw new Error("Welcome page already exists");
    }

    if (pages.length > 0) {
      throw new Error("Welcome page must be the first page");
    }
  }

  // Participant info rules
  if (pageData.type === "participant_info") {
    if (hasParticipantInfo) {
      throw new Error(
        "Participant info page already exists"
      );
    }

    if (!hasWelcome) {
      throw new Error(
        "Welcome page must be created first"
      );
    }

    if (hasEnding) {
      throw new Error(
        "Participant info page must be before the ending page"
      );
    }
  }

  // Questions rules
  if (pageData.type === "questions") {
    if (!hasWelcome) {
      throw new Error(
        "Welcome page must be created first"
      );
    }

    if (hasEnding) {
      throw new Error(
        "Questions page must be before the ending page"
      );
    }
  }

  // Ending rules
  if (pageData.type === "ending") {
    if (hasEnding) {
      throw new Error("Ending page already exists");
    }

    if (!hasWelcome) {
      throw new Error(
        "Welcome page must be created first"
      );
    }
  }

  const nextOrder =
    pages.length > 0
      ? Math.max(...pages.map((page) => page.order)) + 1
      : 1;

  form.pages.push({
    type: pageData.type,
    title: pageData.title || "",
    description: pageData.description || "",
    order: nextOrder,
    blocks: [],
  });

  await saveForm(form);

  return form;
};


export const saveBuilder = async (formId, userId, builderData) => {
  const form = await Form.findOne({ _id: formId });

  if (!form || !(await assertFormAccess(form, userId))) {
    throw new Error("Form not found");
  }

  assertFormIsDraft(form);

  const pages = builderData.pages;

  for (const page of pages) {
    if (
      (page.type === "welcome" || page.type === "ending") &&
      hasAnswerableBlock(page)
    ) {
      throw new Error(`${page.type} pages cannot contain answerable blocks`);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Validate Page Structure
  |--------------------------------------------------------------------------
  */

  const welcomePages = pages.filter(
    (page) => page.type === "welcome"
  );

  const participantInfoPages = pages.filter(
    (page) => page.type === "participant_info"
  );

  const endingPages = pages.filter(
    (page) => page.type === "ending"
  );

  // Welcome can exist only once
  if (welcomePages.length > 1) {
    throw new Error("Welcome page can only exist once");
  }

  // Participant info can exist only once
  if (participantInfoPages.length > 1) {
    throw new Error(
      "Participant info page can only exist once"
    );
  }

  // Ending can exist only once
  if (endingPages.length > 1) {
    throw new Error("Ending page can only exist once");
  }

  // Welcome must be first
  if (
    welcomePages.length === 1 &&
    pages[0].type !== "welcome"
  ) {
    throw new Error("Welcome page must be the first page");
  }

  // Participant info cannot exist before welcome
  const welcomeIndex = pages.findIndex(
    (page) => page.type === "welcome"
  );

  const participantInfoIndex = pages.findIndex(
    (page) => page.type === "participant_info"
  );

  if (
    participantInfoIndex !== -1 &&
    (welcomeIndex === -1 ||
      participantInfoIndex < welcomeIndex)
  ) {
    throw new Error(
      "Participant info page must come after welcome"
    );
  }

  // Ending must be last
  const endingIndex = pages.findIndex(
    (page) => page.type === "ending"
  );

  if (
    endingIndex !== -1 &&
    endingIndex !== pages.length - 1
  ) {
    throw new Error("Ending page must be the last page");
  }

  /*
  |--------------------------------------------------------------------------
  | Build Pages
  |--------------------------------------------------------------------------
  */

  const savedPages = [];

  const seenPageIds = new Set();
  const seenBlockIds = new Set();

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const pageData = pages[pageIndex];

    let page;

    /*
    |--------------------------------------------------------------------------
    | Existing Page
    |--------------------------------------------------------------------------
    */

    if (pageData.id) {
      if (!mongoose.isValidObjectId(pageData.id)) {
        throw new Error("Invalid page id");
      }

      if (seenPageIds.has(pageData.id)) {
        throw new Error("Duplicate page id");
      }

      const existingPage = form.pages.id(pageData.id);

      if (!existingPage) {
        throw new Error("Page not found");
      }

      seenPageIds.add(pageData.id);

      page = existingPage;
    }

    /*
    |--------------------------------------------------------------------------
    | New Page
    |--------------------------------------------------------------------------
    */

    else {
      page = {
        type: pageData.type,
        title: "",
        description: "",
        blocks: [],
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Update Page Data
    |--------------------------------------------------------------------------
    */

    page.type = pageData.type;
    page.title = pageData.title || "";
    page.description = pageData.description || "";
    page.buttonText = pageData.buttonText || "";
    page.config = pageData.config || {};
    page.ratingRequired = pageData.ratingRequired !== false;
    page.nextForm = pageData.nextForm || {};

    // Order comes from array position
    page.order = pageIndex + 1;

    /*
    |--------------------------------------------------------------------------
    | Build Blocks
    |--------------------------------------------------------------------------
    */

    const savedBlocks = [];

    for (
      let blockIndex = 0;
      blockIndex < pageData.blocks.length;
      blockIndex++
    ) {
      const blockData = pageData.blocks[blockIndex];

      let block;

      /*
      |--------------------------------------------------------------------------
      | Existing Block
      |--------------------------------------------------------------------------
      */

      if (blockData.id) {
        if (!mongoose.isValidObjectId(blockData.id)) {
          throw new Error("Invalid block id");
        }

        if (seenBlockIds.has(blockData.id)) {
          throw new Error("Duplicate block id");
        }

        const existingBlock = page.blocks.id(
          blockData.id
        );

        if (!existingBlock) {
          throw new Error(
            "Block not found in this page"
          );
        }

        seenBlockIds.add(blockData.id);

        block = existingBlock;
      }

      /*
      |--------------------------------------------------------------------------
      | New Block
      |--------------------------------------------------------------------------
      */

      else {
        block = {};
      }

      /*
      |--------------------------------------------------------------------------
      | Update Block
      |--------------------------------------------------------------------------
      */

      block.type = blockData.type;
      block.data = blockData.data;

      // Order comes from array position
      block.order = blockIndex + 1;

      savedBlocks.push(block);
    }

    page.blocks = savedBlocks;

    savedPages.push(page);
  }

  /*
  |--------------------------------------------------------------------------
  | Replace Form Pages
  |--------------------------------------------------------------------------
  |
  | Pages/blocks that are NOT included in the request
  | are considered deleted.
  |
  */

  form.pages = savedPages;

  await saveForm(form);

  return form;
};

const getWorkspacePlan = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId).select("plan").lean();
  return workspace?.plan;
};

const createQuotaError = () => {
  const error = new Error("This workspace has reached its active-survey limit for its plan");
  error.statusCode = 403;
  error.reasonCode = "SURVEY_LIMIT_REACHED";
  return error;
};

// Free-plan limit on a user's own Private surveys, kept entirely separate
// from Shared workspace quotas (different counter, different document,
// different reasonCode) per docs/workspace-concurrency.md's existing
// separation of concerns. Individual users have no `plan` field of their
// own yet — there is no paid tier for Private surveys — so this is always
// PLAN_LIMITS.free.maxActiveSurveys, matching createForm's shortCodeLength
// default for private forms.
const PRIVATE_SURVEY_LIMIT = PLAN_LIMITS.free.maxActiveSurveys;

const createPrivateQuotaError = () => {
  const error = new Error(
    `You have reached the Free plan limit of ${PRIVATE_SURVEY_LIMIT} active private surveys`
  );
  error.statusCode = 403;
  error.reasonCode = "PRIVATE_SURVEY_LIMIT_REACHED";
  return error;
};

export const publishForm = async (formId, userId) => {
  const form = await Form.findOne({
  _id: formId,
}).select("+access.codeHash");

  if (!form || !(await assertFormAccess(form, userId))) {
    throw new Error("Form not found");
  }

  if (form.status === "published") {
    throw new Error("Form is already published");
  }

  if (form.status === "closed") {
    throw new Error("Closed forms cannot be published");
  }

  if (
  form.access?.type === "code" &&
  !form.access.codeHash
) {
  throw new Error(
    "Access code must be configured before publishing"
  );
}

  const pages = [...form.pages].sort(
    (a, b) => a.order - b.order
  );

  const errors = [];

  validateBlocksForPublishing(pages, errors);

  for (const page of pages) {
    if (
      (page.type === "welcome" || page.type === "ending") &&
      hasAnswerableBlock(page)
    ) {
      errors.push(`${page.type} pages cannot contain answerable blocks`);
    }
  }

  const welcomePages = pages.filter(
    (page) => page.type === "welcome"
  );

  const participantInfoPages = pages.filter(
    (page) => page.type === "participant_info"
  );

  const questionPages = pages.filter(
    (page) => page.type === "questions"
  );

  const endingPages = pages.filter(
    (page) => page.type === "ending"
  );

  // Welcome
  if (welcomePages.length !== 1) {
    errors.push("Form must have exactly one welcome page");
  } else if (pages[0]?._id.toString() !== welcomePages[0]._id.toString()) {
    errors.push("Welcome page must be the first page");
  }

  // Participant info is optional, but can exist only once.
  if (participantInfoPages.length > 1) {
    errors.push("Participant info page can only exist once");
  }

  if (
    participantInfoPages.length === 1 &&
    welcomePages.length === 1 &&
    pages.findIndex(
      (page) => page.type === "participant_info"
    ) < pages.findIndex(
      (page) => page.type === "welcome"
    )
  ) {
    errors.push("Participant info page must come after welcome");
  }

  // At least one questions page
  if (questionPages.length === 0) {
    errors.push("Form must have at least one questions page");
  }

  // Ending
  if (endingPages.length !== 1) {
    errors.push("Form must have exactly one ending page");
  } else if (
    pages[pages.length - 1]?._id.toString() !==
    endingPages[0]._id.toString()
  ) {
    errors.push("Ending page must be the last page");
  }

  // Questions must contain at least one question block.
  const hasQuestion = questionPages.some((page) =>
    page.blocks.some((block) =>
      ANSWERABLE_BLOCK_TYPES.has(block.type)
    )
  );

  if (!hasQuestion) {
    errors.push("Form must contain at least one question");
  }

  if (errors.length > 0) {
    const error = new Error("Form cannot be published");
    error.details = errors;
    throw error;
  }

  if (form.visibility === "shared") {
    const plan = await getWorkspacePlan(form.workspace);
    const limit = PLAN_LIMITS[plan]?.maxActiveSurveys ?? 0;

    try {
      await runInMongoTransaction(async (session) => {
        const incremented = await incrementWorkspaceCounter(
          form.workspace,
          "activeSurveyCount",
          limit,
          session
        );

        if (!incremented) {
          throw createQuotaError();
        }

        const coordinated = await coordinateFormWrite(form._id, session, { status: form.status });
        if (!coordinated) {
          throw createTransactionConflictError();
        }

        await Form.updateOne({ _id: form._id }, { $set: { status: "published" } }, { session });
      });
    } catch (error) {
      if (isTransactionConflict(error)) {
        throw createTransactionConflictError();
      }

      throw error;
    }

    form.status = "published";
  } else {
    // Unlike the Shared branch above (which coordinates via writeFence,
    // since a Shared Form's status is advanced with a plain Form.updateOne,
    // never a document save()), Private forms' every other mutator
    // (saveBuilder/updateForm/updateFormAccess/updateFormIdentityMode)
    // still goes through plain `form.save()` and therefore still relies on
    // mongoose's own __v optimistic-concurrency check for conflict
    // detection (see form-concurrency.test.js). So the user-counter
    // increment is wrapped around that SAME `form.save()` call (passing
    // the transaction's session into it) rather than switched to
    // coordinateFormWrite/Form.updateOne — preserving the exact existing
    // __v-based concurrency contract while still making the counter
    // increment and the status flip atomic with each other.
    try {
      await runInMongoTransaction(async (session) => {
        const incremented = await incrementUserCounter(
          form.owner,
          "activePrivateSurveyCount",
          PRIVATE_SURVEY_LIMIT,
          session
        );

        if (!incremented) {
          throw createPrivateQuotaError();
        }

        form.status = "published";

        try {
          await form.save({ session });
        } catch (saveError) {
          if (saveError?.name === "VersionError") {
            const conflict = new Error(
              "Form was changed by another request. Reload and try again."
            );
            conflict.statusCode = 409;
            throw conflict;
          }

          throw saveError;
        }
      });
    } catch (error) {
      if (isTransactionConflict(error)) {
        throw createTransactionConflictError();
      }

      throw error;
    }
  }

  const safeForm = form.toObject();

  if (safeForm.access) {
    delete safeForm.access.codeHash;
  }

  return safeForm;
};

export const closeForm = async (formId, userId) => {
  const form = await Form.findOne({ _id: formId });

  if (!form || !(await assertFormAccess(form, userId))) {
    throw new Error("Form not found");
  }

  if (form.status !== "published") {
    throw new Error("Only published forms can be closed");
  }

  if (form.visibility === "shared") {
    try {
      await runInMongoTransaction(async (session) => {
        const coordinated = await coordinateFormWrite(form._id, session, { status: "published" });
        if (!coordinated) {
          throw createTransactionConflictError();
        }

        await Form.updateOne({ _id: form._id }, { $set: { status: "closed" } }, { session });
        await decrementWorkspaceCounter(form.workspace, "activeSurveyCount", session);
      });
    } catch (error) {
      if (isTransactionConflict(error)) {
        throw createTransactionConflictError();
      }

      throw error;
    }

    form.status = "closed";
  } else {
    try {
      await runInMongoTransaction(async (session) => {
        form.status = "closed";

        try {
          await form.save({ session });
        } catch (saveError) {
          if (saveError?.name === "VersionError") {
            const conflict = new Error(
              "Form was changed by another request. Reload and try again."
            );
            conflict.statusCode = 409;
            throw conflict;
          }

          throw saveError;
        }

        await decrementUserCounter(form.owner, "activePrivateSurveyCount", session);
      });
    } catch (error) {
      if (isTransactionConflict(error)) {
        throw createTransactionConflictError();
      }

      throw error;
    }
  }

  return form;
};

export const pauseForm = async (formId, userId) => {
  const form = await Form.findOne({ _id: formId, owner: userId });
  if (!form) throw new Error("Form not found");
  if (form.status !== "published") throw new Error("Only published forms can be paused");
  form.status = "paused";
  await saveForm(form);
  return form;
};

export const resumeForm = async (formId, userId) => {
  const form = await Form.findOne({ _id: formId, owner: userId });
  if (!form) throw new Error("Form not found");
  if (form.status !== "paused") throw new Error("Only paused forms can be resumed");
  form.status = "published";
  await saveForm(form);
  return form;
};

export const reopenForm = async (formId, userId) => {
  const form = await Form.findOne({ _id: formId });

  if (!form || !(await assertFormAccess(form, userId))) {
    throw new Error("Form not found");
  }

  if (form.status !== "closed") {
    throw new Error("Only closed forms can be reopened");
  }

  if (form.visibility === "shared") {
    const plan = await getWorkspacePlan(form.workspace);
    const limit = PLAN_LIMITS[plan]?.maxActiveSurveys ?? 0;

    try {
      await runInMongoTransaction(async (session) => {
        const incremented = await incrementWorkspaceCounter(
          form.workspace,
          "activeSurveyCount",
          limit,
          session
        );

        if (!incremented) {
          throw createQuotaError();
        }

        const coordinated = await coordinateFormWrite(form._id, session, { status: "closed" });
        if (!coordinated) {
          throw createTransactionConflictError();
        }

        await Form.updateOne({ _id: form._id }, { $set: { status: "published" } }, { session });
      });
    } catch (error) {
      if (isTransactionConflict(error)) {
        throw createTransactionConflictError();
      }

      throw error;
    }

    form.status = "published";
  } else {
    try {
      await runInMongoTransaction(async (session) => {
        const incremented = await incrementUserCounter(
          form.owner,
          "activePrivateSurveyCount",
          PRIVATE_SURVEY_LIMIT,
          session
        );

        if (!incremented) {
          throw createPrivateQuotaError();
        }

        form.status = "published";

        try {
          await form.save({ session });
        } catch (saveError) {
          if (saveError?.name === "VersionError") {
            const conflict = new Error(
              "Form was changed by another request. Reload and try again."
            );
            conflict.statusCode = 409;
            throw conflict;
          }

          throw saveError;
        }
      });
    } catch (error) {
      if (isTransactionConflict(error)) {
        throw createTransactionConflictError();
      }

      throw error;
    }
  }

  return form;
};


export const updateFormAccess = async (formId, userId, accessData) => {
  const form = await Form.findOne({ _id: formId }).select("+access.codeHash");

  if (!form || !(await assertFormAccess(form, userId))) {
    const error = new Error("Form not found");
    error.statusCode = 404;
    throw error;
  }

  if (form.status !== "draft") {
    const error = new Error(
      "Access settings can only be changed for draft forms"
    );
    error.statusCode = 400;
    throw error;
  }

  if (accessData.type === "open") {
    form.access = {
      type: "open",
      multipleUse: Boolean(accessData.multipleUse),
      codeHash: undefined,
    };
  } else {
    const codeHash = await bcrypt.hash(accessData.code, 12);

    form.access = {
      type: "code",
      multipleUse: Boolean(accessData.multipleUse),
      codeHash,
    };
  }

  await saveForm(form);

  return {
    type: form.access.type,
  };
};

export const updateFormIdentityMode = async (
  formId,
  userId,
  identityMode
) => {
  if (identityMode !== "anonymous" && identityMode !== "identified") {
    const error = new Error("Invalid identity mode");
    error.statusCode = 400;
    throw error;
  }

  const form = await Form.findOne({ _id: formId });

  if (!form || !(await assertFormAccess(form, userId))) {
    const error = new Error("Form not found");
    error.statusCode = 404;
    throw error;
  }

  if (form.status !== "draft") {
    const error = new Error(
      "Identity mode can only be changed for draft forms"
    );
    error.statusCode = 400;
    throw error;
  }

  form.settings ??= {};
  form.settings.identityMode = identityMode;

  await saveForm(form);

  return {
    formId: form._id,
    identityMode: getIdentityMode(form.settings.identityMode),
  };
};
