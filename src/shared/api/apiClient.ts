import axios from 'axios';
import { env } from '../env';
import Cookies from 'js-cookie';

const apiBaseUrl = env('VITE_API_BASE_URL', 'http://localhost:8000/api').replace(/\/+$|\/api\/?$/i, '/api').replace(/\/$/, '');
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

apiClient.interceptors.request.use((config) => {
  if (config.url?.includes('/sanctum/csrf-cookie')) {
    config.baseURL = apiBaseUrl.replace(/\/api(?:\/v1)?$/i, '');
  }

  const token = Cookies.get('XSRF-TOKEN');
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }

  const authToken = getAuthToken();
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
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
