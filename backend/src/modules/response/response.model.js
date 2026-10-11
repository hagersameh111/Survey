import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
  form: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true, index: true },
  formOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  participant: {
    name: { type: String, trim: true, default: "" },
    dob: { type: String, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  answers: [{
    questionId: { type: String, required: true },
    question: { type: String, default: "" },
    type: { type: String, default: "" },
    value: mongoose.Schema.Types.Mixed,
  }],
}, { timestamps: true, versionKey: false });

export default mongoose.model("Response", responseSchema);
