import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getWorkspaces } from "../api/workspaces";

// Deliberately minimal: {workspaces, activeWorkspaceId, setActiveWorkspaceId}
// only. This is the one justified exception to this codebase's "no global
// context, per-component getCurrentUser()" convention — Navbar, Sidebar,
// AccountSettings, and the form-creation flow all need to agree on which
// workspace (or "Personal", activeWorkspaceId === null) is currently active.
const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!localStorage.getItem("token")) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getWorkspaces()
      .then((list) => setWorkspaces(list || []))
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (activeWorkspaceId && !workspaces.some((workspace) => workspace._id === activeWorkspaceId)) {
      setActiveWorkspaceId(null);
    }
  }, [workspaces, activeWorkspaceId]);

  const activeWorkspace = workspaces.find((workspace) => workspace._id === activeWorkspaceId) || null;

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace, loading, refresh }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
