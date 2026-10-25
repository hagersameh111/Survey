import mongoose from "mongoose";
import Form from "./form.model.js";

import bcrypt from "bcrypt";

const assertFormIsDraft = (form) => {
  if (form.status !== "draft") {
    throw new Error("Form content can only be changed for draft forms");
  }
};

export const createForm = async (userId, formData) => {
  const { title, description } = formData;

  const form = await Form.create({
    owner: userId,
    title,
    description,
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
    pages: sourceForm.pages.map((page) => ({
      type: page.type,
      title: page.title,
      description: page.description,
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

export const getAllForms = async (userId) => {
  const forms = await Form.find({
    owner: userId,
  }).sort({ createdAt: -1 });

  return forms;
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

  await form.save();

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

  await form.save();

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

  await form.save();

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
  const questionBlockTypes = new Set([
    "short_text",
    "long_text",
    "email",
    "phone",
    "number",
    "date",
    "single_choice",
    "multiple_choice",
    "dropdown",
    "rating",
  ]);

  const hasQuestion = questionPages.some((page) =>
    page.blocks.some((block) =>
      questionBlockTypes.has(block.type)
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
await form.save();

const safeForm = form.toObject();

if (safeForm.access) {
  delete safeForm.access.codeHash;
}

return safeForm;

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

  await form.save();

  return {
    type: form.access.type,
  };
};

