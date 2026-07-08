import axios from 'axios';
import { env } from '../env';
import Cookies from 'js-cookie';

// Dev: '/api' (vite proxy). Prod: absolute URL injected at build time via VITE_API_BASE_URL.
const normalizeApiBaseUrl = (value: string | undefined) => {
  const raw = (value ?? '').trim();

  if (!raw || raw === '/' || raw === './') {
    return '/api';
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const pathname = url.pathname.replace(/\/+$/, '');

      if (!pathname || pathname === '/') {
        return `${url.origin}/api`;
      }

      return /\/api(?:\/|$)/i.test(pathname)
        ? `${url.origin}${pathname}`
        : `${url.origin}${pathname}/api`;
    } catch {
      return raw.replace(/\/+$/, '');
    }
  }

  const pathname = raw.replace(/\/+$/, '');

  if (!pathname || pathname === '/') {
    return '/api';
  }

  return /\/api(?:\/|$)/i.test(pathname) ? pathname : `${pathname}/api`;
};

const rawBaseUrl = env('VITE_API_BASE_URL', '/api') as string;
const apiBaseUrl = normalizeApiBaseUrl(rawBaseUrl);
const siteBaseUrl = apiBaseUrl.replace(/\/api(?:\/v\d+)?$/i, '');
export const AUTH_TOKEN_KEY = 'kora-auth-token';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const setRequestHeader = (headers: unknown, name: string, value: string) => {
  if (!headers) return;

  if (typeof (headers as { set?: unknown }).set === 'function') {
    (headers as { set: (headerName: string, headerValue: string) => void }).set(name, value);
    return;
  }

  (headers as Record<string, string>)[name] = value;
};

apiClient.interceptors.request.use((config) => {
  if (config.url?.includes('/sanctum/csrf-cookie')) {
    config.baseURL = siteBaseUrl;
  }

  const token = Cookies.get('XSRF-TOKEN');
  if (token) {
    setRequestHeader(config.headers, 'X-XSRF-TOKEN', decodeURIComponent(token));
  }

  const authToken = getAuthToken();
  if (authToken) {
    setRequestHeader(config.headers, 'Authorization', `Bearer ${authToken}`);
  }

  return config;
});

// export const formatApiResponse = async <T>(
//   apiPromise: Promise<AxiosResponse<T>>
// ): Promise<FormattedResponse<T>> => {
//   try {
//     // Wait for the Axios request to finish
//     const response = await apiPromise;

//     return {
//       success: true,
//       data: response.data,
//       // Laravel often sends a message in the response body, fallback to default if not present
//       message: (response.data as any)?.message || "Request successful",
//       errors: null,
//       statusCode: response.status,
//     };
//   } catch (error) {
//     if (error instanceof AxiosError) {
//       // Handle Axios HTTP errors (e.g., 401, 419, 422, 500)
//       const data = error.response?.data;
      
//       return {
//         success: false,
//         data: null,
//         message: data?.message || error.message || "An unexpected error occurred.",
//         // Laravel puts validation errors inside an 'errors' object
//         errors: data?.errors || null, 
//         statusCode: error.response?.status || null,
//       };
//     }

//     // Handle non-Axios generic JavaScript errors (e.g., network failure, coding error)
//     return {
//       success: false,
//       data: null,
//       message: error instanceof Error ? error.message : "Unknown error occurred",
//       errors: null,
//       statusCode: 500,
//     };
//   }
// };
