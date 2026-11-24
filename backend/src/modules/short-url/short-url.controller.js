import { createShortUrl, listShortUrls, resolveShortUrl, updateShortUrl } from "./short-url.service.js";

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Internal server error" });

export const list = async (req, res) => {
  try { return res.json({ success: true, data: await listShortUrls(req.user.id) }); }
  catch (error) { return sendError(res, error); }
};

export const create = async (req, res) => {
  try { return res.status(201).json({ success: true, data: await createShortUrl(req.user.id, req.body) }); }
  catch (error) { return sendError(res, error); }
};

export const update = async (req, res) => {
  try { return res.json({ success: true, data: await updateShortUrl(req.user.id, req.params.id, req.body) }); }
  catch (error) { return sendError(res, error); }
};

export const redirect = async (req, res) => {
  try {
    const result = await resolveShortUrl(req.params.code);
    if (result.url) return res.redirect(302, result.url);
    res.set({ "Content-Type": result.file.type, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.file.name)}` });
    return res.send(result.file.data);
  } catch (error) {
    return res.status(error.statusCode || 500).type("text/plain").send(error.statusCode ? error.message : "Internal server error");
  }
};
