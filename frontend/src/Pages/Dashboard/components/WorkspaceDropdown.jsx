import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check, Briefcase, User, Plus } from "lucide-react";
import { useWorkspace } from "../../../context/WorkspaceContext.jsx";
import { createWorkspace } from "../../../api/workspaces";
import { PLAN_LABELS } from "../../../config/plans.js";
import { DEFAULT_FOLDER } from "../../../config/folders.js";

const WorkspaceDropdown = () => {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace, refresh } = useWorkspace();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspacePlan, setNewWorkspacePlan] = useState("premium");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdNotice, setCreatedNotice] = useState("");

  const currentLabel = activeWorkspace ? activeWorkspace.name || "Untitled workspace" : "Personal";

  const handleCreateWorkspace = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const workspace = await createWorkspace({ name: newWorkspaceName.trim(), plan: newWorkspacePlan });
      refresh();
      setActiveWorkspaceId(workspace._id);
      setNewWorkspaceName("");
      setShowNewModal(false);
      setCreatedNotice(
        "Workspace created. It is pending activation — no payment provider is connected yet, so an operator must activate its subscription before you can invite members or publish Shared surveys."
      );
    } catch (error) {
      setCreateError(error.response?.data?.message || "Could not create the workspace.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 text-lg font-medium text-text transition hover:opacity-80"
      >
        <span>{currentLabel}</span>
        <ChevronDown size={18} className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-10 z-50 w-72 rounded-2xl border border-border bg-white p-3 shadow-xl">
          <div className="mb-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Switch workspace
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceId(null);
                setIsOpen(false);
                navigate(`/dashboard/${DEFAULT_FOLDER}`);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
                !activeWorkspaceId ? "bg-primary-light font-semibold text-primary" : "text-text hover:bg-background"
              }`}
            >
              <div className="flex items-center gap-3">
                <User size={16} />
                <span>Personal</span>
              </div>
              {!activeWorkspaceId && <Check size={16} />}
            </button>

            {workspaces.map((workspace) => (
              <button
                key={workspace._id}
                type="button"
                onClick={() => {
                  setActiveWorkspaceId(workspace._id);
                  setIsOpen(false);
                navigate("/dashboard/shared");
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
                  activeWorkspaceId === workspace._id
                    ? "bg-primary-light font-semibold text-primary"
                    : "text-text hover:bg-background"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase size={16} />
                  <span>{workspace.name || "Untitled workspace"}</span>
                  <span className="text-xs text-text-muted">{PLAN_LABELS[workspace.plan]}</span>
                </div>
                {activeWorkspaceId === workspace._id && <Check size={16} />}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowNewModal(true);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary-light/50"
            >
              <Plus size={16} />
              <span>Create team workspace</span>
            </button>
          </div>
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="mb-4 text-xl font-semibold text-text">Create team workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Workspace name (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Acme Research"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Plan</label>
                <select
                  value={newWorkspacePlan}
                  onChange={(e) => setNewWorkspacePlan(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                >
                  <option value="premium">Premium — 10 active surveys, 5 invited members</option>
                  <option value="ultra">Ultra — unlimited active surveys, 20 invited members</option>
                </select>
              </div>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text transition hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setCreatedNotice("")}>
          <div
            className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-semibold text-text">Workspace created</h3>
            <p className="text-sm text-text-secondary">{createdNotice}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setCreatedNotice("")}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDropdown;
