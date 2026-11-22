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

    buttonText: { type: String, trim: true, maxlength: 100, default: "" },
    ratingRequired: { type: Boolean, default: true },
    nextForm: { type: mongoose.Schema.Types.Mixed, default: {} },

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

const accessSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["open", "code"],
      default: "open",
      required: true,
    },

    codeHash: {
      type: String,
      select: false,
    },
  },
  {
    _id: false,
  }
);

const settingsSchema = new mongoose.Schema(
  {
    identityMode: {
      type: String,
      enum: ["anonymous", "identified"],
      default: "anonymous",
    },
  },
  {
    _id: false,
    strict: false,
  }
);

const hideVersionKey = (_document, returnedObject) => {
  delete returnedObject.__v;
  delete returnedObject.writeFence;
  return returnedObject;
};

const formSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    writeFence: {
      type: Number,
      select: false,
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

    folder: {
      type: String,
      trim: true,
      default: "my-workspace",
      index: true,
    },

    // Team-workspace visibility. "shared" forms belong to `workspace` (see
    // workspace/workspace.model.js) even though `owner` keeps recording the
    // original creator for attribution. The private<->workspace invariant
    // (workspace is set iff visibility === "shared") is enforced in
    // form.service.js, not here, matching this schema's existing light
    // validation style.
    visibility: {
      type: String,
      enum: ["private", "shared"],
      default: "private",
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },

    // URL convenience only — never treated as authorization. Length is
    // plan-governed (see config/plans.js) and generated in form.service.js.
    shortCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    settings: {
      type: settingsSchema,
      default: () => ({}),
    },

    access: {
  type: accessSchema,
  default: () => ({ type: "open" }),
},

    pages: {
      type: [pageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    optimisticConcurrency: true,
    toJSON: {
      transform: hideVersionKey,
    },
    toObject: {
      transform: hideVersionKey,
    },
  }

);


const Form = mongoose.model("Form", formSchema);

export default Form;
