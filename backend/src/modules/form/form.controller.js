import {
  createForm,
  getFormById,
  updateForm,
  addPage,
  saveBuilder as saveBuilderService,
} from "./form.service.js";

export const create = async (req, res) => {
  try {
    const form = await createForm(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      data: form,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getById = async (req, res) => {
  try {
    const form = await getFormById(
      req.params.formId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const update = async (req, res) => {
  try {
    const form = await updateForm(
      req.params.formId,
      req.user.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const addPageToForm = async (req, res) => {
  try {
    const form = await addPage(
      req.params.formId,
      req.user.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      data: form,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const saveBuilder = async (req, res) => {
  try {
    const form = await saveBuilderService(
      req.params.formId,
      req.user.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};