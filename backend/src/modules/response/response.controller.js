import {
  getResponseForForm,
  listResponsesForForm,
  submitResponse,
} from "./response.service.js";

const handleReadError = (res, error, operation) => {
  if ([400, 404].includes(error.statusCode)) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error(`${operation} error:`, error);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const list = async (req, res) => {
  try {
    const result = await listResponsesForForm(
      req.params.formId,
      req.user.id,
      req.responseListQuery
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleReadError(res, error, "List responses");
  }
};

export const getById = async (req, res) => {
  try {
    const response = await getResponseForForm(
      req.params.formId,
      req.params.responseId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleReadError(res, error, "Get response");
  }
};

export const submit = async (req, res) => {
  try {
    const result = await submitResponse(req.params.formId, req.body, {
      userId: req.user?.id,
      participantToken: req.participantToken,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if ([400, 401, 403, 404, 409].includes(error.statusCode)) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Submit response error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
