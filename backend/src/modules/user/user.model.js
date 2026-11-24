import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Exclude password from query results by default
    },

    avatar: {
      type: String,
      default: null,
    },

    // Denormalized counter of this user's own currently-published Private
    // surveys (Free-plan limit, see config/plans.js's
    // PLAN_LIMITS.free.maxActiveSurveys). Mutated ONLY via the atomic
    // conditional updates in user-write-fence.js (never via a full-document
    // load + save()), mirroring Workspace's activeSurveyCount — see that
    // model's comment for why no writeFence/optimisticConcurrency is needed
    // alongside it.
    activePrivateSurveyCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false, // Disable the __v field
  }
);

const User = mongoose.model("User", userSchema);

export default User;
