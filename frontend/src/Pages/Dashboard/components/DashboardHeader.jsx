import { useState } from "react";
import { CalendarDays, UserPlus, ChevronDown } from "lucide-react";
import ViewSwitcher from "./ViewSwitcher";
import WorkspaceDropdown from "./WorkspaceDropdown";
import InviteMembersModal from "../../../components/modals/InviteMembersModal";

const DashboardHeader = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        {/* Left: Interactive Workspace Dropdown */}
        <div className="flex items-center gap-6">
          <WorkspaceDropdown />

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 text-text-secondary transition hover:text-primary font-medium text-sm"
          >
            <UserPlus size={18} />
            Invite
          </button>
        </div>

        {/* Right: Filtering & Views */}
        <div className="flex items-center gap-4">
          <button className="flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 text-text-secondary transition hover:border-primary text-sm font-medium">
            <CalendarDays size={18} />
            Date created
            <ChevronDown size={18} />
          </button>

          <ViewSwitcher />
        </div>
      </div>

      <div className="mt-6 h-px bg-divider" />

      <InviteMembersModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </>
  );
};

export default DashboardHeader;