import mongoose from "mongoose";
import Form from "../form/form.model.js";
import Response from "./response.model.js";

export const getPublicForm = async (formId) => {
  if (!mongoose.isValidObjectId(formId)) throw new Error("Form not found");
  const form = await Form.findById(formId).select("title description status settings pages").lean();
  if (!form || form.status === "closed") throw new Error("Form not found");
  return form;
};

export const createResponse = async (formId, payload) => {
  if (!mongoose.isValidObjectId(formId)) throw new Error("Form not found");
  const form = await Form.findById(formId);
  if (!form || form.status === "closed") throw new Error("Form not found");

  const blocks = form.pages.find((page) => page.type === "questions")?.blocks || [];
  const answers = Object.entries(payload.answers || {}).flatMap(([questionId, value]) => {
    const block = blocks.find((item) => String(item._id) === questionId);
    if (!block || ["heading", "text", "image", "divider"].includes(block.type)) return [];
    return [{ questionId, question: block.data?.question || "", type: block.type, value }];
  });

  return Response.create({ form: form._id, formOwner: form.owner, participant: payload.participant || {}, answers });
};
