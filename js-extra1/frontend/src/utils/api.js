import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://career-connect-backend-d4bgh3d5b5d6cdhy.centralindia-01.azurewebsites.net/api",
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("career_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

