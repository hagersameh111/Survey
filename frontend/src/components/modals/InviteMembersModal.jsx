import { useState, useEffect } from "react";
import {
  X,
  Copy,
  Mail,
  User,
  Users,
  ChevronDown,
  Building2,
} from "lucide-react";
import InvitePermissionDropdown from "./InvitePermissionDropdown";

// Reusable dropdown for selecting Individual or Organization
const InviteAsDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "Individual", icon: User },
    { label: "Organization", icon: Users },
  ];

  const SelectedIcon =
    options.find((option) => option.label === value)?.icon || User;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-white px-4 transition hover:border-primary"
      >
        <div className="flex items-center gap-3">
          <SelectedIcon size={18} className="text-text-secondary" />
          <span className="text-sm">{value}</span>
        </div>

        <ChevronDown
          size={18}
          className={`text-text-muted transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {options.map((option) => {
            const OptionIcon = option.icon;

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  onChange(option.label);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition last:border-b-0 hover:bg-background"
              >
                <OptionIcon size={18} className="text-text-secondary" />
                <span className="text-sm">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Dropdown for Individual: Alone or Existing Organization
const IndividualTypeDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { label: "My Team", value: "My Team", icon: User },
    {
      label: "Existing Organization",
      value: "existing",
      icon: Building2,
    },
  ];

  const selectedOption = options.find(
    (option) => option.value === value
  );

  const SelectedIcon = selectedOption?.icon || User;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-white px-4 transition hover:border-primary"
      >
        <div className="flex items-center gap-3">
          <SelectedIcon size={18} className="text-text-secondary" />
          <span className="text-sm">
            {selectedOption?.label || "Select an option"}
          </span>
        </div>

        <ChevronDown
          size={18}
          className={`text-text-muted transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {options.map((option) => {
            const OptionIcon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition last:border-b-0 hover:bg-background"
              >
                <OptionIcon size={18} className="text-text-secondary" />
                <span className="text-sm">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Dropdown for choosing an existing organization
const OrganizationDropdown = ({
  organizations = [],
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  const selectedOrganization = organizations.find(
    (organization) =>
      (typeof organization === "string"
        ? organization
        : organization._id) === value
  );

  const getOrganizationId = (organization) =>
    typeof organization === "string"
      ? organization
      : organization._id;

  const getOrganizationName = (organization) =>
    typeof organization === "string"
      ? organization
      : organization.name;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-white px-4 transition hover:border-primary"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Building2
            size={18}
            className="shrink-0 text-text-secondary"
          />
          <span className="truncate text-sm">
            {selectedOrganization
              ? getOrganizationName(selectedOrganization)
              : "Select an organization"}
          </span>
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 text-text-muted transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[110%] z-50 max-h-48 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
          {organizations.length > 0 ? (
            organizations.map((organization) => {
              const id = getOrganizationId(organization);
              const name = getOrganizationName(organization);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onChange(id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition last:border-b-0 hover:bg-background"
                >
                  <Building2
                    size={18}
                    className="shrink-0 text-text-secondary"
                  />
                  <span className="truncate text-sm">{name}</span>
                </button>
              );
            })
          ) : (
            <p className="px-4 py-3 text-sm text-text-muted">
              No organizations available.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const InviteMembersModal = ({
  open,
  onClose,
  organizations = [],
  onInvite,
}) => {
  const [inviteType, setInviteType] = useState("Organization");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("Can View Only");
  const [message, setMessage] = useState("");

  // Organization invitation fields
  const [organizationName, setOrganizationName] = useState("");

  // Individual invitation fields
  const [individualType, setIndividualType] = useState("alone");
  const [selectedOrganization, setSelectedOrganization] = useState("");

  const orgLink =
    "https://forms/formhub.com/my-workspace/aDezff/45ggghrT2210&43#55$123";

  const indLink = "https://forms/formhub.com/sign-up";

  const inviteLink =
    inviteType === "Organization" ? orgLink : indLink;

  const handleInviteTypeChange = (type) => {
    setInviteType(type);
    setOrganizationName("");
    setSelectedOrganization("");
    setIndividualType("alone");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (error) {
      console.error("Failed to copy invitation link:", error);
    }
  };

  const handleInvite = () => {
    const invitation = {
      email: email.trim(),
      inviteType,
      permission: inviteType === "Organization" ? permission : null,
      message: message.trim(),
      inviteLink,
      ...(inviteType === "Organization"
        ? { organizationName: organizationName.trim() }
        : {
            individualType,
            organizationId:
              individualType === "existing"
                ? selectedOrganization
                : null,
          }),
    };

    // Send the invitation data to the parent when a handler is provided.
    if (onInvite) {
      onInvite(invitation);
    }
  };

  // Close the modal using Escape
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };

    if (open) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-[420px] rounded-3xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-lg font-semibold text-text">
            Invite members
          </h2>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Invite an individual"
              onClick={() => handleInviteTypeChange("Individual")}
              className={`transition ${
                inviteType === "Individual"
                  ? "text-text"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <User size={18} />
            </button>

            <button
              type="button"
              aria-label="Invite an organization"
              onClick={() => handleInviteTypeChange("Organization")}
              className={`transition ${
                inviteType === "Organization"
                  ? "text-text"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Users size={18} />
            </button>

            <div className="ml-2 mr-1 h-4 w-px bg-border" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="text-text-muted transition hover:text-text"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6 pt-4">
          {/* Invitation Link */}
          <div className="flex overflow-hidden rounded-xl border border-primary-light bg-primary-light">
            <div className="flex-1 break-all p-3 px-4 text-sm text-primary">
              {inviteLink}
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

          {/* Email Input */}
          <div className="flex h-11 items-center gap-3 rounded-xl border border-primary px-4 transition focus-within:ring-1 focus-within:ring-primary">
            <Mail size={18} className="shrink-0 text-text-muted" />

            <input
              type="email"
              placeholder="Add Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
            />
          </div>

          {/* Invite As */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Invite as
            </label>

            <InviteAsDropdown
              value={inviteType}
              onChange={handleInviteTypeChange}
            />
          </div>

          {/* Organization Fields */}
          {inviteType === "Organization" && (
            <>
              <div>
                <label
                  htmlFor="organizationName"
                  className="mb-2 block text-sm font-medium text-text"
                >
                  Organization Name
                </label>

                <div className="flex h-11 items-center gap-3 rounded-xl border border-border px-4 transition focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <Building2
                    size={18}
                    className="shrink-0 text-text-muted"
                  />

                  <input
                    id="organizationName"
                    type="text"
                    placeholder="Enter organization name"
                    value={organizationName}
                    onChange={(event) =>
                      setOrganizationName(event.target.value)
                    }
                    className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text">
                  Permission
                </label>

                <InvitePermissionDropdown
                  value={permission}
                  onChange={setPermission}
                />

                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  People you invite can view, edit, delete or add to your
                  files.
                </p>
              </div>
            </>
          )}

          {/* Individual Fields */}
          {inviteType === "Individual" && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">
                  Individual Type
                </label>

                <IndividualTypeDropdown
                  value={individualType}
                  onChange={(value) => {
                    setIndividualType(value);
                    setSelectedOrganization("");
                  }}
                />
              </div>

              {/* Show organizations only when Existing Organization is selected */}
              {individualType === "existing" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">
                    Select Organization
                  </label>

                  <OrganizationDropdown
                    organizations={organizations}
                    value={selectedOrganization}
                    onChange={setSelectedOrganization}
                  />
                </div>
              )}
            </>
          )}

          {/* Message */}
          <div>
            <label
              htmlFor="inviteMessage"
              className="mb-2 block text-sm font-medium text-text"
            >
              Add a message{" "}
              <span className="font-normal text-text-muted">
                (optional)
              </span>
            </label>

            <textarea
              id="inviteMessage"
              rows={3}
              placeholder="Write your message..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full resize-none rounded-xl border border-border p-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-text transition hover:bg-background"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleInvite}
              disabled={
                !email.trim() ||
                (inviteType === "Organization" &&
                  !organizationName.trim()) ||
                (inviteType === "Individual" &&
                  individualType === "existing" &&
                  !selectedOrganization)
              }
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;