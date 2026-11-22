import Workspace from "./workspace.model.js";

// Workspace-specific atomic conditional updates, kept separate from
// form-write-fence.js's coordinateFormWrite (which is hardcoded to the Form
// model). Workspace documents are never loaded-then-saved wholesale, so
// there is no full-document race to fence against with a writeFence/
// optimisticConcurrency field — the counters are self-fencing via these
// atomic conditional $inc updates instead.
//
// A `limit` of Infinity (Ultra plan) is never enforced server-side via the
// $lt guard, since Infinity cannot be compared meaningfully in a MongoDB
// query filter.
export const incrementWorkspaceCounter = async (workspaceId, counterField, limit, session) => {
  const filter = { _id: workspaceId };

  if (Number.isFinite(limit)) {
    filter[counterField] = { $lt: limit };
  }

  const result = await Workspace.updateOne(
    filter,
    { $inc: { [counterField]: 1 } },
    { session }
  );

  return result.matchedCount === 1;
};

export const decrementWorkspaceCounter = async (workspaceId, counterField, session) => {
  const result = await Workspace.updateOne(
    { _id: workspaceId, [counterField]: { $gt: 0 } },
    { $inc: { [counterField]: -1 } },
    { session }
  );

  return result.matchedCount === 1;
};
