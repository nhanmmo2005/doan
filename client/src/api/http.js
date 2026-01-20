import axios from "axios";

export const http = axios.create({
  // Prefer explicit VITE_API_URL. If not provided, use relative `/api`
  // This avoids accidentally calling localhost from a deployed frontend.
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // nếu backend dùng cookie/refreshToken
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
