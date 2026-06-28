import axios from 'axios';
import { env } from '../env';
import Cookies from "js-cookie";

export const apiClient = axios.create({
  // Replace with your actual backend API base URL
  baseURL: env("VITE_API_BASE_URL", 'https://api.swiftvtu.com/api/v1'),
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (config.url?.includes("/sanctum/csrf-cookie")) {
    config.baseURL = import.meta.env.VITE_BACKEND; // no /api
  }
  const token = Cookies.get("XSRF-TOKEN");
  if (token) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
  }
  return config;
});


// Request Interceptor: Automatically attach the auth token to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);