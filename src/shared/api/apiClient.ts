import axios from 'axios';
import { env } from '../env';

export const apiClient = axios.create({
  // Replace with your actual backend API base URL
  baseURL: env("VITE_API_BASE_URL", 'https://api.swiftvtu.com/api/v1'),
  timeout: 50000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
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