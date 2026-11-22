import User from "./user.model.js";

// User-specific atomic conditional updates, mirroring
// workspace/workspace-write-fence.js's incrementWorkspaceCounter/
// decrementWorkspaceCounter exactly, but scoped to a User document's own
// denormalized counters instead of a Workspace's. Same rationale applies:
// counters are self-fencing via these atomic conditional $inc updates, so
// no full-document load + save() race is possible.
//
// A `limit` of Infinity is never enforced server-side via the $lt guard,
// since Infinity cannot be compared meaningfully in a MongoDB query filter
// (not reachable today — individual users are always on the Free plan,
// which has a finite maxActiveSurveys — but kept for parity).
export const incrementUserCounter = async (userId, counterField, limit, session) => {
  const filter = { _id: userId };

  if (Number.isFinite(limit)) {
    filter[counterField] = { $lt: limit };
  }

  const result = await User.updateOne(
    filter,
    { $inc: { [counterField]: 1 } },
    { session }
  );

  return result.matchedCount === 1;
};

export const decrementUserCounter = async (userId, counterField, session) => {
  const result = await User.updateOne(
    { _id: userId, [counterField]: { $gt: 0 } },
    { $inc: { [counterField]: -1 } },
    { session }
  );

  return result.matchedCount === 1;
};
