import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import ShortUrl from "./short-url.model.js";

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const code = () => randomBytes(6).toString("base64url");
const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};
const dto = (entry) => ({
  id: entry._id.toString(),
  code: entry.code,
  originalUrl: entry.originalUrl,
  fileName: entry.fileName,
  fileType: entry.fileType,
  active: entry.active,
  expiresAt: entry.expiresAt,
  createdAt: entry.createdAt,
});

export const listShortUrls = async (owner) => (await ShortUrl.find({ owner }).sort({ createdAt: -1 })).map(dto);

export const createShortUrl = async (owner, body) => {
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date())) throw fail("Expiration must be a future date");
  const isFile = Boolean(body.file);
  let originalUrl = "";
  let fileName = "";
  let fileType = "";
  let fileData;
  if (isFile) {
    if (typeof body.file.name !== "string" || typeof body.file.data !== "string") throw fail("A valid file is required");
    const data = Buffer.from(body.file.data, "base64");
    if (!data.length || data.length > 5 * 1024 * 1024) throw fail("File must be between 1 byte and 5 MB");
    fileName = body.file.name.slice(0, 255);
    fileType = typeof body.file.type === "string" && /^[\w!#$&^_.+-]+\/[\w!#$&^_.+-]+$/.test(body.file.type)
      ? body.file.type.slice(0, 150)
      : "application/octet-stream";
    fileData = data;
  } else {
    originalUrl = safeUrl(body.url);
    if (!originalUrl) throw fail("Enter a valid http or https URL");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const entry = await ShortUrl.create({ owner, code: code(), originalUrl, fileName, fileType, fileData, active: true, expiresAt });
      return dto(entry);
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw fail("Could not allocate a short code. Try again.", 503);
};

export const updateShortUrl = async (owner, id, changes) => {
  if (!mongoose.isValidObjectId(id)) throw fail("Invalid short URL ID");
  const updates = {};
  if (changes.active !== undefined) updates.active = changes.active;
  if (changes.expiresAt !== undefined) {
    if (!changes.expiresAt) updates.expiresAt = null;
    else {
      const date = new Date(changes.expiresAt);
      if (!Number.isFinite(date.getTime()) || date <= new Date()) throw fail("Expiration must be a future date");
      updates.expiresAt = date;
    }
  }
  const entry = await ShortUrl.findOneAndUpdate({ _id: id, owner }, { $set: updates }, { new: true, runValidators: true });
  if (!entry) throw fail("Short URL not found", 404);
  return dto(entry);
};

export const resolveShortUrl = async (codeValue) => {
  const entry = await ShortUrl.findOne({ code: codeValue }).select("+fileData");
  if (!entry) throw fail("Short URL not found", 404);
  if (!entry.active) throw fail("This short URL has been disabled", 410);
  if (entry.expiresAt && entry.expiresAt <= new Date()) throw fail("This short URL has expired", 410);
  if (entry.fileData) return { file: { name: entry.fileName, type: entry.fileType || "application/octet-stream", data: entry.fileData } };
  return { url: entry.originalUrl };
};
