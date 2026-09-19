import { useState } from "react";
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  ChevronUp, 
  ChevronRight,
  UserPlus,
  // Users is imported but not used here, you can remove it or keep it if needed later
} from "lucide-react";
import { Link } from "react-router-dom"; 
import InviteMembersModal from "../modals/InviteMembersModal";

const Sidebar = () => {
  const [search, setSearch] = useState("");
  
  // Fixed: matching the state names used in the JSX below
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <aside className="flex w-72 flex-col gap-6 rounded-2xl bg-surface p-5 shadow-sm">
      
      {/* Top Section: Members & Invite */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-text">
          <span className="font-medium">All Members</span>
          <div className="flex items-center gap-1 cursor-pointer text-text-secondary transition hover:text-primary">
            <span className="text-sm">12</span>
            <ChevronRight size={16} />
          </div>
        </div>

        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-transparent py-3 text-primary transition hover:bg-primary-light"
        >
          <UserPlus size={18} />
          <span className="font-medium">Invite New Member</span>
        </button>

       <Link 
          to="/form-builder" 
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-white transition hover:bg-primary-hover"
        >
          <Plus size={18} />
          <span className="font-medium">Create form</span>
        </Link>
      </div>

      {/* Search */}
      <div className="flex h-11 items-center gap-3 rounded-xl bg-background px-4">
        <Search size={18} className="text-text-muted" />
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
      </div>

      {/* Surveys Section */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text">
            <LayoutGrid size={18} />
            <span className="font-medium">Surveys</span>
          </div>
          <button className="rounded-lg p-1 text-primary transition hover:bg-primary-light">
            <Plus size={18} />
          </button>
        </div>

        {/* Private Surveys */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-2 text-primary">
            <span className="font-medium text-sm">Private</span>
            <ChevronUp size={16} />
          </div>
          
          <button className="flex w-full items-center justify-between rounded-xl bg-primary-light px-4 py-2.5 text-text transition">
            <span className="font-medium">My workspace</span>
            <span className="text-sm font-medium text-primary">0</span>
          </button>
          
          <button className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-text-secondary transition hover:bg-background">
            <span>Personal</span>
            <span className="text-sm">3</span>
          </button>
          
          <button className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-text-secondary transition hover:bg-background">
            <span>Drafts</span>
            <span className="text-sm">1</span>
          </button>
        </div>

        {/* Shared Surveys */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center justify-between px-2 py-2 text-primary">
            <span className="font-medium text-sm">Shared surveys</span>
            <ChevronUp size={16} />
          </div>
          
          <button className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-text-secondary transition hover:bg-background">
            <span>Team surveys</span>
            <span className="text-sm">1</span>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="border-t border-border pt-5">
        <h3 className="mb-3 text-sm font-medium text-text-secondary">
          Responses collected
        </h3>
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-primary" style={{ width: "0%" }} />
        </div>
        <p className="text-xs font-medium">
          <span className="text-primary">0</span>
          <span className="text-text-muted"> / 100</span>
        </p>
      </div>
      
      {/* Render the modal outside of the progress div for cleaner structure */}
      <InviteMembersModal 
        open={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
      />
    </aside>
  );
};

export default Sidebar;