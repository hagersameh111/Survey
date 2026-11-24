import mongoose from "mongoose";

// Paid team entity. Distinct from Form.folder's "my-workspace" default
// string, which is an unrelated personal grouping label, not a team.
//
// activeSurveyCount/activeMemberCount are denormalized counters mutated
// ONLY via the atomic conditional updates in workspace-write-fence.js
// (never via a full-document load + save()), so no writeFence/
// optimisticConcurrency is needed on this schema.
const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      type: String,
      enum: ["premium", "ultra"],
      required: true,
    },

    activeSurveyCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeMemberCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

workspaceSchema.index({ owner: 1 });

const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;
