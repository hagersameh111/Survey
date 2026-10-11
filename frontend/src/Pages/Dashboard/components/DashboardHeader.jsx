import { useState, useRef, useEffect } from "react";
import { CalendarDays, UserPlus, ChevronDown, Check } from "lucide-react";
import ViewSwitcher from "./ViewSwitcher";
import InviteMembersModal from "../../../components/modals/InviteMembersModal";
import { SORT_OPTIONS } from "../FolderPage";

const SortDropdown = ({ sort, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-medium text-text-secondary transition hover:border-primary"
      >
        <CalendarDays size={18} />
        {sort.label}
        <ChevronDown size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-48 rounded-2xl border border-border bg-white p-2 shadow-xl">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o); setOpen(false); }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-text hover:bg-background"
            >
              {o.label}
              {o.value === sort.value && <Check size={16} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardHeader = ({ title, view, onViewChange, sort, onSortChange }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-4xl font-medium capitalize text-text">{title}</h1>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary"
          >
            <UserPlus size={18} />
            Invite
          </button>
        </div>

        <div className="flex items-center gap-4">
          <SortDropdown sort={sort} onChange={onSortChange} />
          <ViewSwitcher view={view} onChange={onViewChange} />
        </div>
      </div>

      <div className="mt-6 h-px bg-divider" />

      <InviteMembersModal open={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </>
  );
};

export default DashboardHeader;