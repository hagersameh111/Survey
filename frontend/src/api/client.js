// Small fetch wrapper. Set VITE_API_URL in .env (e.g. https://api.myapp.com/api)
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = "GET", params, body, signal } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }

  const token = localStorage.getItem("token"); // adjust to however you store auth
  const res = await fetch(url, {
    method,
    signal,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      message = (await res.json()).message || message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(message, res.status);
  }
  return res.status === 204 ? null : res.json();
}