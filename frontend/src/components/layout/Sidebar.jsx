import { useMemo, useState } from "react";
import { Plus, Search, LayoutGrid, ChevronUp, UserPlus } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import InviteMembersModal from "../modals/InviteMembersModal";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

const Section = ({ title, items }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="space-y-1 pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-2 py-2 text-primary"
      >
        <span className="text-sm font-medium">{title}</span>
        <ChevronUp size={16} className={`transition-transform ${open ? "" : "rotate-180"}`} />
      </button>

      {open &&
        (items.length === 0 ? (
          <p className="px-4 py-2 text-sm text-text-muted">No folders</p>
        ) : (
          items.map((f) => (
            <NavLink
              key={f.id}
              to={`/dashboard/${f.slug}`}
              className={({ isActive }) =>
                `flex w-full items-center justify-between rounded-xl px-4 py-2.5 transition ${
                  isActive
                    ? "bg-primary-light font-medium text-text"
                    : "text-text-secondary hover:bg-background"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{f.name}</span>
                  <span className={`text-sm ${isActive ? "font-medium text-primary" : ""}`}>
                    {f.count ?? ""}
                  </span>
                </>
              )}
            </NavLink>
          ))
        ))}
    </div>
  );
};

const Sidebar = ({ folders, stats }) => {
  const [search, setSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? folders.filter((f) => f.name.toLowerCase().includes(q)) : folders;
  }, [folders, search]);

  const percent = Math.min(100, (stats.collected / (stats.limit || 1)) * 100);

  // The create action always uses the currently selected scope: creating
  // from the Shared tab produces a workspace-owned survey in the active
  // workspace; creating from anywhere else produces a personal survey.
  const createHref = activeWorkspaceId
    ? `/form-builder?visibility=shared&workspaceId=${activeWorkspaceId}`
    : "/form-builder";

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 rounded-2xl bg-surface p-4 shadow-sm sm:p-5 lg:w-72">
      <div className="space-y-4">
        <Link
          to={createHref}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-white transition hover:bg-primary-hover"
        >
          <Plus size={18} />
          <span className="font-medium">Create form</span>
        </Link>

        <button
          onClick={() => setShowInviteModal(true)}
          disabled={!activeWorkspaceId}
          title={!activeWorkspaceId ? "Switch to a team workspace to invite members" : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-transparent py-3 text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus size={18} />
          <span className="font-medium">Invite New Member</span>
        </button>
      </div>

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

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text">
            <LayoutGrid size={18} />
            <span className="font-medium">Surveys</span>
          </div>
          <button className="rounded-lg p-1 text-primary transition hover:bg-primary-light" aria-label="New folder">
            <Plus size={18} />
          </button>
        </div>

        {!activeWorkspaceId && (
          <Section title="Private" items={filtered.filter((f) => f.section === "private")} />
        )}
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="mb-3 text-sm font-medium text-text-secondary">Responses collected</h3>
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs font-medium">
          <span className="text-primary">{stats.collected}</span>
          <span className="text-text-muted"> / {stats.limit}</span>
        </p>
      </div>

      <InviteMembersModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={activeWorkspaceId}
        workspaceName={activeWorkspace?.name}
      />
    </aside>
  );
};

export default Sidebar;
