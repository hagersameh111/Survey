import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "heading",
        "text",
        "image",
        "divider",

        "short_text",
        "long_text",
        "email",
        "phone",
        "number",
        "date",

        "single_choice",
        "multiple_choice",
        "dropdown",

        "rating",
      ],
      required: true,
    },

    order: {
      type: Number,
      required: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: true,
  }
);

const pageSchema = new mongoose.Schema(
  {
type: {
  type: String,
  enum: [
    "welcome",
    "participant_info",
    "questions",
    "ending",
  ],
  required: true,
},

    title: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    order: {
      type: Number,
      required: true,
    },

    blocks: {
      type: [blockSchema],
      default: [],
    },
  },
  {
    _id: true,
  }
);

const formSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    pages: {
      type: [pageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Form = mongoose.model("Form", formSchema);

export default Form;