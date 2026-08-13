import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

if (!backendUrl) {
  throw new Error(
    "VITE_BACKEND_URL is not defined. Add it to your environment variables."
  );
}

const api = axios.create({
  baseURL: backendUrl.replace(/\/$/, ""),

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

export default api;