import { useEffect, useState } from "react";
import { Copy, Mail, X } from "lucide-react";
import { inviteMember } from "../../api/workspaces";

const InviteMembersModal = ({ open, onClose, workspaceId, workspaceName }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [invitationToken, setInvitationToken] = useState("");

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setRole("member");
      setError("");
      setInvitationToken("");
    }
  }, [open]);

  if (!open) return null;

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!workspaceId) return;
    setSubmitting(true);
    setError("");
    try {
      const invitation = await inviteMember(workspaceId, { email: email.trim(), role });
      setInvitationToken(invitation.invitationToken);
    } catch (invitationError) {
      setError(invitationError.response?.data?.message || "Could not create the invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/accept-invitation?token=${invitationToken}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (copyError) {
      console.error("Failed to copy invitation link:", copyError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-[420px] rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-lg font-semibold text-text">
            Invite to {workspaceName || "workspace"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close modal" className="text-text-muted transition hover:text-text">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6 pt-4">
          {!invitationToken ? (
            <form onSubmit={handleInvite} className="space-y-5">
              <div className="flex h-11 items-center gap-3 rounded-xl border border-primary px-4 transition focus-within:ring-1 focus-within:ring-primary">
                <Mail size={18} className="shrink-0 text-text-muted" />
                <input
                  type="email"
                  required
                  placeholder="Member's email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text">Role</label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-primary"
                >
                  <option value="member">Member — can create and edit Shared surveys</option>
                  <option value="admin">Admin — can also invite and remove members</option>
                </select>
              </div>

              <p className="text-xs leading-relaxed text-text-muted">
                No email provider is connected yet, so the invitation link below must be shared manually once created.
              </p>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-text transition hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email.trim() || submitting}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send invitation"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-sm text-text-secondary">
                Invitation created for <span className="font-medium text-text">{email}</span>. Share this link with them — it can only be used once and expires in 7 days.
              </p>
              <div className="flex overflow-hidden rounded-xl border border-primary-light bg-primary-light">
                <div className="flex-1 break-all p-3 px-4 text-sm text-primary">
                  {`${window.location.origin}/accept-invitation?token=${invitationToken}`}
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  aria-label="Copy invitation link"
                  className="flex w-14 shrink-0 items-center justify-center bg-primary text-white transition hover:bg-primary-hover"
                >
                  <Copy size={18} />
                </button>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;
