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

export const createForm = async (userId, formData) => {
  const { title, description, folder } = formData;

  const form = await Form.create({
    owner: userId,
    title,
    description,
    folder: folder || "my-workspace",
    status: "draft",
  });

  return form;
};

export const duplicateForm = async (formId, userId) => {
  const sourceForm = await Form.findOne({
    _id: formId,
    owner: userId,
  });

  if (!sourceForm) {
    throw new Error("Form not found");
  }

  const form = await Form.create({
    owner: sourceForm.owner,
    title: sourceForm.title,
    description: sourceForm.description,
    status: "draft",
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
  });

  return form;
};

export const getFormById = async (formId, userId) => {
  const form = await Form.findOne({
    _id: formId,
    owner: userId,
  });

  if (!form) {
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

  try {
    await runInMongoTransaction(async (session) => {
      const coordinated = await coordinateFormWrite(formId, session, { owner: userId });
      if (!coordinated) {
        const error = new Error("Form not found");
        error.statusCode = 404;
        throw error;
      }

      const deleted = await Form.deleteOne(
        { _id: formId, owner: userId },
        { session }
      );

      if (deleted.deletedCount !== 1) {
        const error = new Error("Form not found");
        error.statusCode = 404;
        throw error;
      }

      await Response.deleteMany({ form: formId }, { session });
      await ParticipantToken.deleteMany({ form: formId }, { session });
    });
  } catch (error) {
    if (isTransactionConflict(error)) {
      throw createTransactionConflictError();
    }

    throw error;
  }
};

const toPublicFormDto = (form) => ({
  _id: form._id.toString(),
  title: form.title,
  description: form.description,
  identityMode: getIdentityMode(form.settings?.identityMode),
  pages: [...form.pages]
    .sort((left, right) => left.order - right.order)
    .map((page) => ({
      _id: page._id.toString(),
      type: page.type,
      title: page.title,
      description: page.description,
      buttonText: page.buttonText,
      ratingRequired: page.ratingRequired,
      nextForm: structuredClone(page.nextForm || {}),
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
    return null;
  }

  const form = await Form.findOne({
    _id: formId,
    status: "published",
    "access.type": "open",
  });

  return form ? toPublicFormDto(form) : null;
};

export const getAllForms = async (userId) => {
  return listForms(userId);
};

export const listForms = async (
  userId,
  { folder, sort = "updatedAt", order = "desc" } = {}
) => {
  const filter = { owner: userId };

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
  const form = await Form.findOne({
    _id: formId,
    owner: userId,
  });

  if (!form) {
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
  const form = await Form.findOne({
    _id: formId,
    owner: userId,
  });

  if (!form) {
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
  const form = await Form.findOne({
    _id: formId,
    owner: userId,
  });

  if (!form) {
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


export const publishForm = async (formId, userId) => {
  const form = await Form.findOne({
  _id: formId,
  owner: userId,
}).select("+access.codeHash");

  if (!form) {
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


form.status = "published";
await saveForm(form);

const safeForm = form.toObject();

if (safeForm.access) {
  delete safeForm.access.codeHash;
}

return safeForm;

};
export const closeForm = async (formId, userId) => {
  const form = await Form.findOne({
    _id: formId,
    owner: userId,
  });

  if (!form) {
    throw new Error("Form not found");
  }

  if (form.status !== "published") {
    throw new Error("Only published forms can be closed");
  }

  form.status = "closed";
  await saveForm(form);

  return form;
};

export const reopenForm = async (formId, userId) => {
  const form = await Form.findOne({
    _id: formId,
    owner: userId,
  });

  if (!form) {
    throw new Error("Form not found");
  }

  if (form.status !== "closed") {
    throw new Error("Only closed forms can be reopened");
  }

  form.status = "published";
  await saveForm(form);

  return form;
};


export const updateFormAccess = async (formId, userId, accessData) => {
  const form = await Form.findOne({
    _id: formId,
    owner: userId,
  }).select("+access.codeHash");

  if (!form) {
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
      codeHash: undefined,
    };
  } else {
    const codeHash = await bcrypt.hash(accessData.code, 12);

    form.access = {
      type: "code",
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

  const form = await Form.findOne({
    _id: formId,
    owner: userId,
  });

  if (!form) {
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
