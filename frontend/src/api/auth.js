import api from "./axios";

export const login = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data.data;
};

export const register = async (user) => {
  const { data } = await api.post("/auth/register", user);
  return data.data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data.data;
};
