import axios from "axios";
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000/api"
    : "/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("quiz_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || "An unexpected error occurred";
    const details = error.response?.data?.details || null;
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("quiz_token");
      // Redirect if session expired and user is not on an auth screen
      const path = window.location.pathname;
      if (
        path !== "/login" &&
        path !== "/register" &&
        path !== "/forgot-password" &&
        path !== "/reset-password"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject({
      message,
      details,
      status,
      originalError: error,
    });
  },
);

export default api;
