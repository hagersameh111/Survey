import api from "./axios";

/* ---------- existing functions (unchanged) ---------- */

export const createForm = async (form) => {
  const { data } = await api.post("/forms", form);
  return data.data;
};

export const getForm = async (formId) => {
  const { data } = await api.get(`/forms/${formId}`);
  return data.data;
};

export const getPublicForm = async (formId) => {
  const { data } = await api.get(`/public/forms/${formId}`);
  return data.data;
};

export const submitFormResponse = async (formId, response, participantToken) => {
  const { data } = await api.post(`/public/forms/${formId}/responses`, response, {
    headers: participantToken ? { "X-Participant-Token": participantToken } : {},
  });
  return data.data;
};

export const issueParticipantToken = async (formId) => {
  const { data } = await api.post(`/public/forms/${formId}/participant-tokens`);
  return data.data.participantToken;
};

export const updateForm = async (formId, changes) => {
  const { data } = await api.patch(`/forms/${formId}`, changes);
  return data.data;
};

export const saveFormBuilder = async (formId, builder) => {
  const { data } = await api.put(`/forms/${formId}/builder`, builder);
  return data.data;
};

/* ---------- NEW: dashboard / sidebar ---------- */
// Matches your { data: { data: ... } } response envelope.
// Endpoint paths below are assumptions: change them to match your backend.

// Normalise field names so the UI only deals with one shape
const normalizeForm = (f) => {
  const id = f.id ?? f._id;
  const status = f.status ?? "draft";
  return {
    id,
    title: f.title ?? f.name ?? "Untitled form",
    status,
    folder: f.folder ?? "my-workspace",
    responsesCount: f.responsesCount ?? f.responses_count ?? f.responses ?? 0,
    createdAt: f.createdAt ?? f.created_at,
    updatedAt: f.updatedAt ?? f.updated_at,
    shortUrl: f.shortUrl ?? f.short_url ?? f.link ?? (status === "published" ? `${window.location.origin}/view?formId=${id}` : ""),
  };
};

export const getFolders = async (signal) => {
  const { data } = await api.get("/forms/folders", { signal });
  return (data.data ?? []).map((f) => ({
    id: f.id ?? f._id,
    slug: f.slug,
    name: f.name,
    section: f.section ?? "private", // "private" | "shared"
    count: f.formsCount ?? f.forms_count ?? f.count ?? 0,
  }));
};

export const getForms = async ({ folder, sort, order }, signal) => {
  const { data } = await api.get("/forms", { params: { folder, sort, order }, signal });
  return (data.data ?? []).map(normalizeForm);
};

export const getResponseStats = async (signal) => {
  const { data } = await api.get("/forms/stats/responses", { signal });
  return data.data;
};

export const deleteForm = async (formId) => {
  await api.delete(`/forms/${formId}`);
};

export const duplicateForm = async (formId) => {
  const { data } = await api.post(`/forms/${formId}/duplicate`);
  return data.data;
};

export const publishForm = async (formId) => {
  const { data } = await api.post(`/forms/${formId}/publish`);
  return data.data;
};

export const closeForm = async (formId) => {
  const { data } = await api.post(`/forms/${formId}/close`);
  return data.data;
};

export const reopenForm = async (formId) => {
  const { data } = await api.post(`/forms/${formId}/reopen`);
  return data.data;
};

export const updateFormAccess = async (formId, access) => {
  const { data } = await api.patch(`/forms/${formId}/access`, access);
  return data.data;
};

export const updateFormIdentityMode = async (formId, identityMode) => {
  const { data } = await api.patch(`/forms/${formId}/settings/identity-mode`, { identityMode });
  return data.data;
};

export const getResponses = async (formId, params = {}) => {
  const { data } = await api.get(`/forms/${formId}/responses`, { params });
  return data;
};

export const getResponse = async (formId, responseId) => {
  const { data } = await api.get(`/forms/${formId}/responses/${responseId}`);
  return data.data;
};
