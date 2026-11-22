import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "removed"],
      default: "active",
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    removedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Exact-value partial index: at most one ACTIVE membership per user per
// workspace. A removed member may be re-invited and re-accept later,
// creating a new active Membership document rather than reviving the old
// one. (response.model.js's partial indexes key on $type for an optional
// field; this one keys on a fixed status value — a different, equally
// valid idiom, noted here for future readers.)
membershipSchema.index(
  { workspace: 1, user: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;
