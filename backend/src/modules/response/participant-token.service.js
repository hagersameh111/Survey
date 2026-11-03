import { createHash, randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Form from "../form/form.model.js";
import {
  coordinateFormWrite,
  createTransactionConflictError,
  isTransactionConflict,
  runInMongoTransaction,
} from "../form/form-write-fence.js";
import ParticipantToken from "./participant-token.model.js";
import Response from "./response.model.js";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const createTokenError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const hashParticipantToken = (rawToken) =>
  createHash("sha256").update(rawToken, "utf8").digest("hex");

export const isValidParticipantToken = (rawToken) =>
  typeof rawToken === "string" && TOKEN_PATTERN.test(rawToken);

const isValidFormId = (formId) =>
  typeof formId === "string" &&
  /^[a-f\d]{24}$/i.test(formId) &&
  mongoose.isValidObjectId(formId);

const getEligibleForm = async (formId) => {
  if (!isValidFormId(formId)) {
    return null;
  }

  const form = await Form.findOne({
    _id: formId,
    status: "published",
    "access.type": "open",
  });

  if (!form) {
    return null;
  }

  if (form.status !== "published" || form.access?.type !== "open") {
    return null;
  }

  const identityMode = form.settings?.identityMode;
  if (identityMode !== undefined && identityMode !== "anonymous") {
    return null;
  }

  return form;
};

export const issueParticipantToken = async (formId) => {
  const form = await getEligibleForm(formId);
  if (!form) {
    throw createTokenError("Form not found", 404);
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashParticipantToken(rawToken);
  const issuedAt = new Date();

  try {
    await runInMongoTransaction(async (session) => {
      const coordinated = await coordinateFormWrite(form._id, session, {
        status: "published",
        "access.type": "open",
        $or: [
          { "settings.identityMode": "anonymous" },
          { "settings.identityMode": { $exists: false } },
        ],
      });

      if (!coordinated) {
        throw createTokenError("Form not found", 404);
      }

      await ParticipantToken.create([{
        form: form._id,
        tokenHash,
        issuedAt,
        consumedAt: null,
      }], { session });
    });
  } catch (error) {
    if (isTransactionConflict(error)) {
      throw createTransactionConflictError();
    }
    if (error.code === 11000) {
      throw createTokenError("Token issuance conflicted with another request", 409);
    }
    throw error;
  }

  return rawToken;
};

export const findParticipantTokenForSubmission = async (formId, rawToken, { session } = {}) => {
  if (!isValidParticipantToken(rawToken)) {
    throw createTokenError("A valid participant token is required", 401);
  }

  const tokenHash = hashParticipantToken(rawToken);
  let tokenQuery = ParticipantToken.findOne({
    form: formId,
    tokenHash,
  });
  if (session) {
    tokenQuery = tokenQuery.session(session);
  }
  const participantToken = await tokenQuery;

  if (!participantToken) {
    throw createTokenError("A valid participant token is required", 401);
  }

  if (participantToken.consumedAt) {
    throw createTokenError("A response has already been submitted for this form", 409);
  }

  let responseQuery = Response.exists({
    form: formId,
    participantTokenHash: tokenHash,
  });
  if (session) {
    responseQuery = responseQuery.session(session);
  }

  const existingResponse = await responseQuery;
  if (existingResponse) {
    return { participantToken, tokenHash, alreadySubmitted: true };
  }

  return { participantToken, tokenHash };
};

export const markParticipantTokenConsumed = async (participantTokenId, formId, session) => {
  if (!session) {
    throw new Error("A MongoDB session is required to consume a participant token");
  }

  return ParticipantToken.findOneAndUpdate(
    { _id: participantTokenId, form: formId, consumedAt: null },
    { $set: { consumedAt: new Date() } },
    { returnDocument: "after", session }
  );
};
