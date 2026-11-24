import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Only a SHA-256 hash is ever stored. The raw token is generated,
    // returned once, and never logged — mirrors
    // response/participant-token.model.js exactly.
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "revoked", "expired"],
      default: "pending",
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// At most one PENDING invitation per email per workspace. Re-inviting the
// same email after it is revoked/expired/accepted is allowed and creates a
// new Invitation document.
invitationSchema.index(
  { workspace: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

invitationSchema.index({ tokenHash: 1 }, { unique: true });

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
