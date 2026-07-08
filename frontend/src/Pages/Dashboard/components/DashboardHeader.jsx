import { useState } from "react";
import {
  CalendarDays,
  UserPlus,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";

import ViewSwitcher from "./ViewSwitcher";
import InviteMembersModal from "../../../components/modals/InviteMembersModal";

const DashboardHeader = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-medium text-text">
              My workspace
            </h1>

            <button className="text-text-muted transition hover:text-primary">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 text-text-secondary transition hover:text-primary"
          >
            <UserPlus size={18} />
            Invite
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <button className="flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 text-text-secondary transition hover:border-primary">
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