import api from "./axios";

/* Mirrors api/forms.js's envelope-unwrap convention exactly. */

export const createWorkspace = async ({ name, plan }) => {
  const { data } = await api.post("/workspaces", { name, plan });
  return data.data;
};

export const getWorkspaces = async (signal) => {
  const { data } = await api.get("/workspaces", { signal });
  return data.data;
};

export const getWorkspace = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}`);
  return data.data;
};

export const getWorkspaceMembers = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/members`);
  return data.data;
};

export const removeWorkspaceMember = async (workspaceId, userId) => {
  await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
};

export const inviteMember = async (workspaceId, { email, role }) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/invitations`, { email, role });
  return data.data;
};

export const getPendingInvitations = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/invitations`);
  return data.data;
};

export const revokeInvitation = async (workspaceId, invitationId) => {
  await api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
};

export const previewInvitation = async (token) => {
  const { data } = await api.get(`/invitations/${token}`);
  return data.data;
};

export const acceptInvitation = async (token) => {
  const { data } = await api.post("/invitations/accept", { token });
  return data.data;
};
