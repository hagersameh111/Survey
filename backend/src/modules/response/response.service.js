import mongoose from "mongoose";
import { z } from "zod";
import Form from "../form/form.model.js";
import { getFormById } from "../form/form.service.js";
import { isValidDateOnly, questionDataSchemas } from "../form/form.validation.js";
import {
  findParticipantTokenForSubmission,
  markParticipantTokenConsumed,
  isValidParticipantToken,
} from "./participant-token.service.js";
import Response from "./response.model.js";
import {
  coordinateFormWrite,
  createTransactionConflictError,
  isTransactionConflict,
  runInMongoTransaction,
} from "../form/form-write-fence.js";

const ANSWERABLE_QUESTION_TYPES = new Set(Object.keys(questionDataSchemas));

const createServiceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getOwnedForm = async (formId, ownerId) => {
  try {
    return await getFormById(formId, ownerId);
  } catch (error) {
    if (error.message === "Form not found") {
      throw createServiceError("Form not found", 404);
    }

    throw error;
  }
};

const toResponseSummaryDto = (response) => ({
  responseId: response._id.toString(),
  submittedAt: response.submittedAt,
});

const toAnswerDto = (entry) => {
  const answer = {
    questionId: entry.questionId?.toString?.() ?? String(entry.questionId),
    value: entry.value,
  };

  if (entry.question !== undefined) {
    answer.question = entry.question;
  }
  if (entry.type !== undefined) {
    answer.type = entry.type;
  }

  return answer;
};

const toResponseDetailDto = (response) => {
  const result = {
    responseId: response._id.toString(),
    submittedAt: response.submittedAt,
    participantInfo: (response.participantInfo ?? []).map(toAnswerDto),
    answers: (response.answers ?? []).map(toAnswerDto),
  };

  if (response.participant) {
    result.participant = {
      name: response.participant.name,
      dob: response.participant.dob,
      email: response.participant.email,
      phone: response.participant.phone,
    };
  }

  return result;
};

export const listResponsesForForm = async (formId, ownerId, { page, limit, sort }) => {
  const form = await getOwnedForm(formId, ownerId);
  const filter = { form: form._id };
  const direction = sort === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;

  const [total, responses] = await Promise.all([
    Response.countDocuments(filter),
    Response.find(filter)
      .select("_id submittedAt")
      .sort({ submittedAt: direction, _id: direction })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    data: responses.map(toResponseSummaryDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getResponseForForm = async (formId, responseId, ownerId) => {
  const form = await getOwnedForm(formId, ownerId);
  const response = await Response.findOne({ _id: responseId, form: form._id })
    .select("_id submittedAt participantInfo participant answers");

  if (!response) {
    throw createServiceError("Response not found", 404);
  }

  return toResponseDetailDto(response);
};

const getIdentityMode = (form) => {
  const identityMode = form.settings?.identityMode;

  if (identityMode === undefined) {
    return "anonymous";
  }

  if (identityMode === "anonymous" || identityMode === "identified") {
    return identityMode;
  }

  throw createServiceError("Invalid stored form identity mode", 500);
};

const isEmptyAnswer = (value) =>
  (typeof value === "string" && value.trim().length === 0) ||
  (Array.isArray(value) && value.length === 0);

const validateAnswerValue = (block, value) => {
  const { type, data = {} } = block;

  if (type === "short_text" || type === "long_text") {
    if (typeof value !== "string") {
      throw createServiceError("Answer must be text", 400);
    }

    if (data.minLength !== undefined && value.length < data.minLength) {
      throw createServiceError("Answer is shorter than the allowed minimum", 400);
    }

    if (data.maxLength !== undefined && value.length > data.maxLength) {
      throw createServiceError("Answer exceeds the allowed maximum length", 400);
    }

    return;
  }

  if (type === "email") {
    if (typeof value !== "string" || !z.string().email().safeParse(value).success) {
      throw createServiceError("Answer must be a valid email address", 400);
    }
    return;
  }

  if (type === "phone") {
    if (typeof value !== "string") {
      throw createServiceError("Answer must be text", 400);
    }
    return;
  }

  if (type === "date") {
    if (!isValidDateOnly(value)) {
      throw createServiceError("Answer must be a valid YYYY-MM-DD date", 400);
    }

    if (data.minDate !== undefined && value < data.minDate) {
      throw createServiceError("Answer is before the allowed date range", 400);
    }

    if (data.maxDate !== undefined && value > data.maxDate) {
      throw createServiceError("Answer is after the allowed date range", 400);
    }
    return;
  }

  if (type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw createServiceError("Answer must be a finite number", 400);
    }

    if (data.min !== undefined && value < data.min) {
      throw createServiceError("Answer is below the allowed minimum", 400);
    }

    if (data.max !== undefined && value > data.max) {
      throw createServiceError("Answer is above the allowed maximum", 400);
    }
    return;
  }

  if (type === "single_choice" || type === "dropdown") {
    const allowedOptions = new Set(
      (Array.isArray(data.options) ? data.options : []).map((option) => option.label)
    );

    if (typeof value !== "string" || !allowedOptions.has(value)) {
      throw createServiceError("Answer is not one of the allowed options", 400);
    }
    return;
  }

  if (type === "multiple_choice") {
    if (!Array.isArray(value) || !value.every((choice) => typeof choice === "string")) {
      throw createServiceError("Answer must be an array of choices", 400);
    }

    const allowedOptions = new Set(
      (Array.isArray(data.options) ? data.options : []).map((option) => option.label)
    );

    if (value.some((choice) => !allowedOptions.has(choice))) {
      throw createServiceError("Answer contains an option that is not allowed", 400);
    }

    if (new Set(value).size !== value.length) {
      throw createServiceError("Answer contains duplicate options", 400);
    }

    if (data.maxSelections !== undefined && value.length > data.maxSelections) {
      throw createServiceError("Answer exceeds the maximum number of selections", 400);
    }
    return;
  }

  if (type === "rating") {
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      !Number.isInteger(data.scale) ||
      value < 1 ||
      value > data.scale
    ) {
      throw createServiceError("Rating must be an integer from 1 to the configured scale", 400);
    }
    return;
  }

  throw createServiceError("Question type cannot accept an answer", 400);
};

const getTrustedIdentity = async (identityMode, formId, context = {}) => {
  if (identityMode === "identified") {
    if (!mongoose.isValidObjectId(context.userId)) {
      throw createServiceError("Authentication is required for this form", 401);
    }

    return { identity: { respondentUser: context.userId } };
  }

  if (identityMode !== "anonymous") {
    throw createServiceError("Form not found", 404);
  }

  if (typeof context.participantToken !== "string") {
    throw createServiceError("A valid participant token is required", 401);
  }

  if (!isValidParticipantToken(context.participantToken)) {
    throw createServiceError("A valid participant token is required", 401);
  }

  return { participantToken: context.participantToken };
};

export const submitResponse = async (formId, submission, context = {}) => {
  if (!mongoose.isValidObjectId(formId)) {
    throw createServiceError("Invalid form ID", 400);
  }

  const form = await Form.findById(formId);

  if (!form) {
    throw createServiceError("Form not found", 404);
  }

  if (form.status !== "published" || form.access?.type !== "open") {
    throw createServiceError("Form not found", 404);
  }

  const identityMode = getIdentityMode(form);
  const { identity, participantToken } = await getTrustedIdentity(identityMode, form._id, context);
  const questionsById = new Map();

  for (const page of form.pages || []) {
    for (const block of page.blocks || []) {
      if (ANSWERABLE_QUESTION_TYPES.has(block.type)) {
        if (page.type !== "participant_info" && page.type !== "questions") {
          throw createServiceError(
            "Form contains answerable blocks on a display-only page",
            500
          );
        }

        const questionSchema = questionDataSchemas[block.type];
        const parsedData = questionSchema?.safeParse(block.data);

        if (!block._id || !parsedData?.success) {
          throw createServiceError("Form contains invalid question configuration", 500);
        }

        const questionId = block._id.toString().toLowerCase();
        if (questionsById.has(questionId)) {
          throw createServiceError("Form contains duplicate question IDs", 500);
        }

        questionsById.set(questionId, {
          _id: block._id,
          type: block.type,
          data: parsedData.data,
          pageType: page.type,
        });
      }
    }
  }

  const validateSubmission = () => {
    const submittedById = new Map();

    for (const answer of submission.answers) {
      const questionId = answer.questionId.toLowerCase();

      if (submittedById.has(questionId)) {
        throw createServiceError("A question can only be answered once", 400);
      }

      const question = questionsById.get(questionId);
      if (!question) {
        throw createServiceError("Question not found in this form", 400);
      }

      submittedById.set(questionId, { question, value: answer.value });
    }

    const validatedParticipantInfo = [];
    const validatedAnswers = [];

    for (const [questionId, question] of questionsById) {
      const submitted = submittedById.get(questionId);
      const required = question.data?.required === true;

      if (!submitted || isEmptyAnswer(submitted.value)) {
        if (required) {
          throw createServiceError("A required question is unanswered", 400);
        }
        continue;
      }

      validateAnswerValue(question, submitted.value);
      const entry = {
        questionId,
        value: submitted.value,
      };

      if (question.pageType === "participant_info") {
        validatedParticipantInfo.push(entry);
      } else {
        validatedAnswers.push(entry);
      }
    }

    return { validatedParticipantInfo, validatedAnswers };
  };

  const identityCriteria = identityMode === "anonymous"
    ? {
        $or: [
          { "settings.identityMode": "anonymous" },
          { "settings.identityMode": { $exists: false } },
        ],
      }
    : { "settings.identityMode": "identified" };

  let transactionResult;

  try {
    await runInMongoTransaction(async (session) => {
      // The callback may be retried, so discard values from any aborted attempt.
      transactionResult = undefined;

      const coordinated = await coordinateFormWrite(form._id, session, {
        status: "published",
        "access.type": "open",
        ...identityCriteria,
      });

      if (!coordinated) {
        throw createServiceError("Form not found", 404);
      }

      let responseIdentity = identity;
      let participantTokenRecord;
      let tokenAlreadySubmitted = false;

      if (participantToken) {
        const token = await findParticipantTokenForSubmission(
          form._id,
          participantToken,
          { session }
        );
        participantTokenRecord = token.participantToken;
        responseIdentity = { participantTokenHash: token.tokenHash };
        tokenAlreadySubmitted = token.alreadySubmitted === true;
      }

      // Preserve the token-before-answer error precedence within the same
      // fenced transaction. Invalid answers abort without consuming a token.
      const { validatedParticipantInfo, validatedAnswers } = validateSubmission();

      if (tokenAlreadySubmitted) {
        const repairedMarker = await markParticipantTokenConsumed(
          participantTokenRecord._id,
          form._id,
          session
        );

        if (!repairedMarker) {
          throw createServiceError(
            "A response has already been submitted for this form",
            409
          );
        }

        // Commit this safe repair, then return the existing duplicate status
        // after the transaction has completed.
        transactionResult = { alreadySubmitted: true };
        return;
      }

      const [response] = await Response.create([{
        form: form._id,
        ...responseIdentity,
        participantInfo: validatedParticipantInfo,
        answers: validatedAnswers,
      }], { session });

      if (participantTokenRecord) {
        const consumedToken = await markParticipantTokenConsumed(
          participantTokenRecord._id,
          form._id,
          session
        );

        if (!consumedToken) {
          throw createServiceError(
            "A response has already been submitted for this form",
            409
          );
        }
      }

      transactionResult = {
        responseId: response._id,
        submittedAt: response.submittedAt,
      };
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createServiceError("A response has already been submitted for this form", 409);
    }
    if (isTransactionConflict(error)) {
      throw createTransactionConflictError();
    }
    throw error;
  }

  if (transactionResult?.alreadySubmitted) {
    throw createServiceError("A response has already been submitted for this form", 409);
  }

  return transactionResult;
};
