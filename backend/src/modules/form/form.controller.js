import {
  createForm,
  getFormById,
  updateForm,
  addPage,
  saveBuilder as saveBuilderService,
  publishForm as publishFormService,
  getAllForms as getAllFormsService,
  updateFormAccess as updateFormAccessService,
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

export const getAll = async (req, res) => {
  try {
    const forms = await getAllFormsService(req.user.id);

    return res.status(200).json({
      count: forms.length,
      data: forms,
    });
  } catch (error) {
    console.error("Get all forms error:", error);

    return res.status(500).json({
      message: "Internal server error",
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


export const publish = async (req, res) => {
  try {
    const form = await publishFormService(
      req.params.formId,
      req.user.id
    );

    return res.status(200).json({
      message: "Form published successfully",
      data: form,
    });
  } catch (error) {
    if (error.details) {
      return res.status(400).json({
        message: error.message,
        errors: error.details,
      });
    }

    if (error.message === "Form not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error.message === "Form is already published" ||
      error.message === "Closed forms cannot be published"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Publish form error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


export const updateAccess = async (req, res) => {
  try {
    const result = await updateFormAccessService(
      req.params.formId,
      req.user.id,
      req.body
    );

    return res.status(200).json({
      message: "Form access settings updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error("Update form access error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
