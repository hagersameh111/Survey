import { issueParticipantToken } from "./participant-token.service.js";

export const issue = async (req, res) => {
  try {
    const participantToken = await issueParticipantToken(req.params.formId);

    return res.status(201).json({
      success: true,
      data: { participantToken },
    });
  } catch (error) {
    if ([404, 409].includes(error.statusCode)) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.statusCode === 404 ? "Form not found" : error.message,
      });
    }

    console.error("Participant token issuance failed", {
      errorName: error?.name || "Error",
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
