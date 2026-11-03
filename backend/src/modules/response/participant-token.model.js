import mongoose from "mongoose";

const participantTokenSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
  }
);

participantTokenSchema.index(
  { form: 1, tokenHash: 1 },
  { unique: true }
);

const ParticipantToken = mongoose.model("ParticipantToken", participantTokenSchema);

export default ParticipantToken;
