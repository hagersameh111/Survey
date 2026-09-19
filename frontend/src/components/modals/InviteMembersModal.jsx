import { useState, useEffect } from "react";
import { X, Copy, Mail, User, Users, ChevronDown } from "lucide-react";
import InvitePermissionDropdown from "./InvitePermissionDropdown";

// Custom Dropdown for "Invite as" (Individual vs Organization)
const InviteAsDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = [
    { label: "Individual", icon: User },
    { label: "Organization", icon: Users },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-white px-4 transition hover:border-primary"
      >
        <div className="flex items-center gap-3">
          {value === "Organization" ? (
            <Users size={18} className="text-text-secondary" />
          ) : (
            <User size={18} className="text-text-secondary" />
          )}
          <span className="text-sm">{value}</span>
        </div>
        <ChevronDown size={18} className={`text-text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                onChange(opt.label);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition last:border-b-0 hover:bg-background"
            >
              <opt.icon size={18} className="text-text-secondary" />
              <span className="text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const InviteMembersModal = ({ open, onClose }) => {
  // State to toggle between Individual and Organization modes
  const [inviteType, setInviteType] = useState("Organization");
  
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("Can View Only");
  const [message, setMessage] = useState("");

  // Dynamic link based on the selected mode
  const orgLink = "https://forms/formhub.com/my-workspace/aDezff/45ggghrT2210&43#55$123";
  const indLink = "https://forms/formhub.com/sign-up";
  const inviteLink = inviteType === "Organization" ? orgLink : indLink;

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-3xl bg-white shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-lg font-semibold text-text">Invite members</h2>
          
          <div className="flex items-center gap-4">
            {/* Top Toggle Icons - Synced with inviteType state */}
            <button 
              onClick={() => setInviteType("Individual")}
              className={`transition ${inviteType === "Individual" ? "text-text" : "text-text-muted hover:text-text"}`}
            >
              <User size={18} />
            </button>
            <button 
              onClick={() => setInviteType("Organization")}
              className={`transition ${inviteType === "Organization" ? "text-text" : "text-text-muted hover:text-text"}`}
            >
              <Users size={18} />
            </button>
            
            {/* Divider */}
            <div className="h-4 w-px bg-border ml-2 mr-1"></div>

            <button onClick={onClose} className="text-text-muted transition hover:text-text">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6 pt-4">
          
          {/* Invite Link */}
          <div className="flex overflow-hidden rounded-xl bg-primary-light border border-primary-light">
            <div className="flex-1 break-all p-3 px-4 text-sm text-primary">
              {inviteLink}
            </div>
            <button
              onClick={copyLink}
              className="flex w-14 items-center justify-center bg-primary text-white transition hover:bg-primary-hover"
            >
              <Copy size={18} />
            </button>
          </div>

          {/* Email Input */}
          <div className="flex h-11 items-center gap-3 rounded-xl border border-primary px-4 focus-within:ring-1 focus-within:ring-primary transition">
            <Mail size={18} className="text-text-muted" />
            <input
              type="email"
              placeholder="Add Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm outline-none placeholder:text-text-muted"
            />
          </div>

          {/* Invite As Dropdown */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text">Invite as</label>
            <InviteAsDropdown value={inviteType} onChange={setInviteType} />
          </div>

          {/* Permission Dropdown - CONDITIONAL (Only shows in Organization mode) */}
          {inviteType === "Organization" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-text">Permission</label>
              <InvitePermissionDropdown value={permission} onChange={setPermission} />
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                People you invite can view, edit, delete or add to your files.
              </p>
            </div>
          )}

          {/* Message Textarea */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Add a message <span className="font-normal text-text-muted">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-xl border border-border p-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-text transition hover:bg-background"
            >
              Cancel
            </button>
            <button className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover">
              Invite
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;