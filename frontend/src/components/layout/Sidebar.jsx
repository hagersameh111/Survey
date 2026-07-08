import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const Sidebar = ({
  workspaces = [
    { id: 1, name: "My workspace", count: 0 },
    { id: 2, name: "Personal", count: 3 },
    { id: 3, name: "Work", count: 2 },
    { id: 4, name: "Drafts", count: 1 },
  ],

  responses = {
    collected: 0,
    limit: 100,
  },

  onCreateForm = () => {},
  onCreateWorkspace = () => {},
}) => {
  const [search, setSearch] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState(1);
  const [collapsed, setCollapsed] = useState(false);

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((workspace) =>
      workspace.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, workspaces]);

  const progress =
    responses.limit > 0
      ? (responses.collected / responses.limit) * 100
      : 0;

  return (
    <aside className="flex w-72 flex-col rounded-2xl bg-[#E1E9FE] shadow-sm">
      {/* Create Button */}
      <div className="border-b border-border p-4">
        <button
          onClick={onCreateForm}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-white transition hover:bg-primary-hover"
        >
          <Plus size={20} />
          Create form
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-border p-4">
        <div className="flex h-11 items-center gap-3 rounded-xl bg-background px-4">
          <Search
            size={18}
            className="text-text-muted"
          />

          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Workspaces */}
      <div className="flex-1 border-b border-border p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutGrid
              size={18}
              className="text-text-secondary"
            />
            <span className="font-medium text-text-secondary">
              Surveys
            </span>
          </div>

          <button
            onClick={onCreateWorkspace}
            className="rounded-lg border border-border p-2 transition hover:bg-background"
          >
            <Plus size={18} />
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-4 flex w-full items-center justify-between"
        >
          <span className="font-medium text-text-secondary">
            Private
          </span>

          {collapsed ? (
            <ChevronDown
              size={16}
              className="text-primary"
            />
          ) : (
            <ChevronUp
              size={16}
              className="text-primary"
            />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-1">
            {filteredWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => setActiveWorkspace(workspace.id)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all ${
                  activeWorkspace === workspace.id
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-background"
                }`}
              >
                <span>{workspace.name}</span>

                <span>{workspace.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="p-4">
        <h3 className="mb-2 font-medium text-text-secondary">
          Responses collected
        </h3>

        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm">
          <span className="font-semibold text-primary">
            {responses.collected}
          </span>

          <span className="text-text-muted">
            {" "}
            / {responses.limit}
          </span>
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;