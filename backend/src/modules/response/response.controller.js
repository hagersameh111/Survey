import { createResponse, getPublicForm } from "./response.service.js";

export const getForm = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: await getPublicForm(req.params.formId) });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const submit = async (req, res) => {
  try {
    const response = await createResponse(req.params.formId, req.body);
    return res.status(201).json({ success: true, data: response });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
