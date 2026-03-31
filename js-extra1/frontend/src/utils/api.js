import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:6001/api",
  timeout: 12000
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("career_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

