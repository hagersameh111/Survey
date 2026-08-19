import { useState } from "react";
import { Folder, Plus, ChevronDown, Check, Briefcase, User, FileEdit } from "lucide-react";

const WorkspaceDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([
    { id: 1, name: "My workspace", type: "default" },
    { id: 2, name: "Personal", type: "folder" },
    { id: 3, name: "Work", type: "folder" },
    { id: 4, name: "Drafts", type: "folder" },
  ]);
  const [currentWorkspace, setCurrentWorkspace] = useState("My workspace");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const handleCreateWorkspace = (e) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      setWorkspaces((prev) => [...prev, { id: Date.now(), name: newWorkspaceName, type: "folder" }]);
      setCurrentWorkspace(newWorkspaceName);
      setNewWorkspaceName("");
      setShowNewModal(false);
    }
  };

  return (
    <div className="relative">
      {/* Workspace Switcher Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-4xl font-medium text-text transition hover:opacity-80 cursor-pointer"
      >
        <span>{currentWorkspace}</span>
        <ChevronDown size={24} className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-14 z-50 w-72 rounded-2xl border border-border bg-white p-3 shadow-xl">
          <div className="mb-2 px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            Switch Workspace
          </div>

          <div className="space-y-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setCurrentWorkspace(ws.name);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
                  currentWorkspace === ws.name ? "bg-primary-light text-primary font-semibold" : "text-text hover:bg-background"
                }`}
              >
                <div className="flex items-center gap-3">
                  {ws.type === "default" ? <User size={16} /> : <Briefcase size={16} />}
                  <span>{ws.name}</span>
                </div>
                {currentWorkspace === ws.name && <Check size={16} />}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-border pt-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowNewModal(true);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary-light/50"
            >
              <Plus size={16} />
              <span>Create New Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-semibold text-text mb-4">Create New Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g., Marketing Q3"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-background transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDropdown;