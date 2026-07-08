import { useState } from "react";
import { X, Copy, Mail } from "lucide-react";
import InvitePermissionDropdown from "./InvitePermissionDropdown";

const InviteMembersModal = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("Can View Only");
  const [message, setMessage] = useState("");

  const inviteLink =
    "https://forms/formhub.com/my-workspace/aDezff/45ggghrT2210&43#55$123";

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="text-2xl font-semibold text-text">
            Invite members
          </h2>

          <button onClick={onClose}>
            <X className="text-text-secondary" />
          </button>
        </div>

        <div className="space-y-6 p-6">

          {/* Invite Link */}

          <div className="flex overflow-hidden rounded-xl bg-primary-light">
            <div className="flex-1 break-all p-4 text-primary">
              {inviteLink}
            </div>

            <button
              onClick={copyLink}
              className="flex w-16 items-center justify-center bg-primary text-white"
            >
              <Copy />
            </button>
          </div>

          {/* Email */}

          <div className="flex h-12 items-center gap-3 rounded-xl border border-primary px-4">
            <Mail
              size={18}
              className="text-text-muted"
            />

            <input
              type="email"
              placeholder="Add Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full outline-none"
            />
          </div>

          {/* Permission */}

          <div>
            <label className="mb-2 block font-medium">
              Invite as
            </label>

            <InvitePermissionDropdown
              value={permission}
              onChange={setPermission}
            />

            <p className="mt-2 text-sm text-text-muted">
              People you invite can view, edit, delete or add to your files.
            </p>
          </div>

          {/* Message */}

          <div>
            <label className="mb-2 block font-medium">
              Add a message
              <span className="font-normal text-text-muted">
                {" "}
                (optional)
              </span>
            </label>

            <textarea
              rows={5}
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-border p-4 outline-none focus:border-primary"
            />
          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-8 py-3 transition hover:bg-background"
            >
              Cancel
            </button>

            <button className="rounded-xl bg-primary px-8 py-3 text-white transition hover:bg-primary-hover">
              Invite
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;