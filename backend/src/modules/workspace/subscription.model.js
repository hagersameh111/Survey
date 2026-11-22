import mongoose from "mongoose";

// Stands in for a real billing provider (e.g. Stripe) integration. No
// payment is ever processed by this codebase; `status` only ever changes
// via the platform-admin activation endpoint (see workspace.service.js's
// activateSubscription), which is a manual/ops mechanism until a real
// billing webhook replaces it.
const subscriptionSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
    },

    plan: {
      type: String,
      enum: ["premium", "ultra"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending_activation", "active", "canceled", "past_due"],
      default: "pending_activation",
    },

    billingProvider: {
      type: String,
      default: null,
    },

    externalId: {
      type: String,
      default: null,
    },

    currentPeriodEnd: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
