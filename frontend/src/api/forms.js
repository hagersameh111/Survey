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

export const submitFormResponse = async (formId, response) => {
  const { data } = await api.post(`/public/forms/${formId}/responses`, response);
  return data.data;
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
const normalizeForm = (f) => ({
  id: f.id ?? f._id,
  title: f.title ?? f.name ?? "Untitled form",
  status: f.status ?? "draft",
  folder: f.folder ?? "my-workspace",
  responsesCount: f.responsesCount ?? f.responses_count ?? f.responses ?? 0,
  createdAt: f.createdAt ?? f.created_at,
  updatedAt: f.updatedAt ?? f.updated_at,
  shortUrl: f.shortUrl ?? f.short_url ?? f.link ?? "",
});

export const getFolders = async (signal) => {
  const { data } = await api.get("/folders", { signal });
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
  const { data } = await api.get("/stats/responses", { signal }); // { collected, limit }
  return data.data;
};

export const deleteForm = async (formId) => {
  await api.delete(`/forms/${formId}`);
};

export const duplicateForm = async (formId) => {
  const { data } = await api.post(`/forms/${formId}/duplicate`);
  return data.data;
};
