# Workspace and Shared-Survey Concurrency

## Form visibility and ownership are immutable after creation

A Form's `visibility` ("private" or "shared") and `workspace` are set once,
at creation (`POST /api/v1/forms`), and never again. `updateFormSchema`
(used by `PATCH /api/v1/forms/:formId`) is a `.strict()` Zod schema that does
not declare `visibility` or `workspaceId` fields, so a request body
containing either is rejected with `400` before it ever reaches the
service layer — not silently ignored. No other endpoint accepts or applies
these fields on an existing Form. A Shared survey therefore can never be
converted into a Private one (or vice versa) through the API; the only way
a survey changes workspace is by being created there in the first place.

## Private vs Shared tabs are a view, not a visibility toggle

The frontend's Private/Shared tabs (and the `visibility`/`workspaceId`
query parameters on `GET /api/v1/forms`) only select which collection of
existing surveys to list:

- No `workspaceId` → the caller's own Private surveys (`{owner, visibility:"private"}`).
- `workspaceId` set → that workspace's Shared surveys (`{workspace, visibility:"shared"}`), gated on the caller having an active Membership in that workspace.

Switching tabs changes which query runs; it never mutates any Form
document. Creating a survey from the Shared tab calls the same `POST
/api/v1/forms` endpoint with `{visibility:"shared", workspaceId}`, which
sets those fields once at creation (see above) — it is a different request
than switching tabs, not a side effect of it.

## Role enforcement on Shared surveys

Any active member of a workspace — any role (`owner`, `admin`, `member`) —
may create, view, edit, publish, close, and delete that workspace's Shared
surveys (`assertFormAccess` in `form.service.js` grants access to any
active Membership regardless of role). Only `owner`/`admin` may manage
workspace membership and invitations (`requireWorkspaceRole(["owner",
"admin"])` in `workspace.middleware.js`, and the equivalent checks in
`workspace.service.js`/`invitation.service.js`). This is a deliberate
simplification, not an oversight: the product does not need per-survey
viewer/editor roles.

## The publish/delete quota race (fixed)

`deleteForm` used to decide whether to decrement a workspace's
`activeSurveyCount` based on a `status`/`visibility` value read **before**
its deletion transaction started. If another request published the same
Form between that outer read and the delete transaction's start, the
decrement decision was made from stale data — the counter could end up
permanently off by one, since a form counted as active by a committed
publish could be deleted without ever decrementing it.

The fix (`form.service.js`'s `deleteForm`) derives the decrement decision
from an atomic `Form.findOneAndDelete` performed **inside** the same
transaction/session as the fence bump, so the decision always reflects the
Form's true state as of that transaction — never a value read outside it.
`tests/integration/workspace-quota.test.js` reproduces the exact race
deterministically (pausing the outer read, publishing to completion, then
releasing) and asserts the counter ends up correct.

## Membership-removal concurrency: the actual guarantee

Removing a member (`DELETE /api/v1/workspaces/:workspaceId/members/:userId`)
updates that Membership's `status` to `"removed"` inside a transaction.
Every authorization check for a Shared survey (`assertFormAccess` →
`hasActiveWorkspaceAccess` → a fresh `Membership.findOne({..., status:
"active"})`) re-reads Membership on every request; nothing is cached.

**What this guarantees:**

- **Once a removal transaction commits, every subsequent request's
  authorization check sees `"removed"` and is denied.** This holds
  unconditionally for every Form operation, transactional or not, because
  MongoDB gives read-your-own-writes consistency for a majority-committed
  write read back from the primary, and every check re-reads fresh.
- **A request whose authorization check already resolved `"active"` before
  removal commits may still complete its action**, even if removal commits
  moments later. This is a bounded, inherent race in any check-then-act
  authorization scheme that does not couple every workspace-scoped Form
  mutation's transaction to a write-conflict against the Membership
  document itself. This codebase does not add that coupling — it would
  mean every edit, publish, close, reopen, and delete of a Shared survey
  must also write to Membership inside its transaction, for a benefit
  that only matters in a narrow timing window and does not change the
  eventual, consistent outcome once removal has fully committed.
- For the quota-governed lifecycle operations (publish, close, reopen,
  delete), this same interleaving can never corrupt the workspace's
  `activeSurveyCount`/`activeMemberCount` counters — those are always
  updated via the atomic conditional `$inc` helpers in
  `workspace-write-fence.js`, inside a transaction, regardless of when the
  authorization check ran. The race affects only *whether* an
  already-in-flight request from a just-removed member is allowed to
  complete, never the correctness of the resulting counts.

`tests/integration/membership-removal-concurrency.test.js` locks in this
exact behavior: a sequential case (removal commits, then a new request is
denied) and two in-flight cases (a simple edit and a publish, each
deterministically paused mid-authorization-check while removal commits,
then released) that assert the documented outcome rather than an idealized
stronger one.
