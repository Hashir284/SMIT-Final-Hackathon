import axios from "axios";

/**
 * Auto baseURL:
 * - Local (http://localhost:5173) → http://localhost:8000/api
 * - Production (same domain) → /api
 */
const api = axios.create({
  baseURL:
    window.location.protocol === "http:"
      ? "http://localhost:8000/api"
      : "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Success → return data directly (so api.get() gives body, not full response)
// Error → throw Error with backend message
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

export default api;
export { api };
