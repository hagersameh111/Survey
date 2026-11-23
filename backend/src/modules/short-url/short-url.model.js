import mongoose from "mongoose";

const shortUrlSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  originalUrl: { type: String, default: "" },
  fileName: { type: String, default: "" },
  fileType: { type: String, default: "" },
  fileData: { type: Buffer, select: false },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("ShortUrl", shortUrlSchema);
