import mongoose from "mongoose";
import Form from "./form.model.js";

export const runInMongoTransaction = async (operation) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(() => operation(session));
  } finally {
    await session.endSession();
  }
};

export const coordinateFormWrite = async (formId, session, criteria = {}) => {
  const result = await Form.updateOne(
    { _id: formId, ...criteria },
    { $inc: { writeFence: 1 } },
    { session, timestamps: false }
  );

  return result.matchedCount === 1;
};

export const isTransactionConflict = (error) =>
  error?.code === 112 || error?.hasErrorLabel?.("TransientTransactionError");

export const createTransactionConflictError = () => {
  const error = new Error("The operation conflicted with another request. Please retry.");
  error.statusCode = 409;
  return error;
};
