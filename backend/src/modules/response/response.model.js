import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: (value) =>
          typeof value === "string" ||
          (typeof value === "number" && Number.isFinite(value)) ||
          (Array.isArray(value) && value.every((item) => typeof item === "string")),
        message: "Answer value must be a string, number, or array of strings",
      },
    },
  },
  {
    _id: false,
  }
);

const responseSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },

    respondentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    participantTokenHash: {
      type: String,
      select: false,
    },

    answers: {
      type: [answerSchema],
      default: [],
    },

    participantInfo: {
      type: [answerSchema],
      default: [],
    },

    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

responseSchema.index(
  { form: 1, respondentUser: 1 },
  {
    unique: true,
    partialFilterExpression: {
      respondentUser: { $type: "objectId" },
    },
  }
);

responseSchema.index(
  { form: 1, participantTokenHash: 1 },
  {
    unique: true,
    partialFilterExpression: {
      participantTokenHash: { $type: "string" },
    },
  }
);

const Response = mongoose.model("Response", responseSchema);

export default Response;
