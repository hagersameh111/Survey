import { previewInvitation, acceptInvitation } from "./invitation.service.js";

const handleError = (error, res, fallbackMessage) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.reasonCode ? { code: error.reasonCode } : {}),
    });
  }

  console.error(fallbackMessage, { errorName: error?.name || "Error" });

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const preview = async (req, res) => {
  try {
    const data = await previewInvitation(req.params.token);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error, res, "Invitation preview failed");
  }
};

export const accept = async (req, res) => {
  try {
    const { workspace, membership } = await acceptInvitation(req.body.token, req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        workspaceId: workspace._id,
        workspaceName: workspace.name,
        role: membership.role,
      },
    });
  } catch (error) {
    return handleError(error, res, "Invitation acceptance failed");
  }
};
