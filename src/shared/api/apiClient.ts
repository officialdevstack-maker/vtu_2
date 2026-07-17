import axios from 'axios';
import { env } from '../env';

// API base URL comes from VITE_API_BASE_URL in the environment; no Vite proxy is required.
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
let nativeAccessToken: string | null = null;
let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

type NativeWindow = Window & {
  __VENDIFY_NATIVE__?: string;
  __VENDIFY_DEVICE_ID__?: string;
  __VENDIFY_DEVICE_NAME__?: string;
  __vendifySetAccessToken?: (token: string | null) => void;
  ReactNativeWebView?: { postMessage: (message: string) => void };
};

export const isNativeClient = () =>
  typeof window !== 'undefined' && Boolean((window as NativeWindow).__VENDIFY_NATIVE__);

export const postToNative = (message: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  (window as NativeWindow).ReactNativeWebView?.postMessage(JSON.stringify(message));
};

export const primeCsrfProtection = async (force = false) => {
  if (isNativeClient()) return null;
  if (!force && csrfToken) return csrfToken;
  if (!force && csrfRequest) return csrfRequest;

  csrfRequest = axios
    .get<{ token: string }>(`${siteBaseUrl}/sanctum/csrf-token`, {
      withCredentials: true,
      headers: { Accept: 'application/json' },
    })
    .then((response) => {
      csrfToken = response.data.token;
      return csrfToken;
    })
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    // Purge credentials written by older builds. Browser authentication now
    // lives only in Laravel's encrypted HttpOnly cookie. The native shell may
    // inject a short-lived access token, which remains in memory only.
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return nativeAccessToken;
  } catch {
    // Safari privacy modes and restricted embedded browsers may expose the
    // Storage API while throwing on access. Treat that as no persisted token
    // instead of crashing the entire route tree during app bootstrap.
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  nativeAccessToken = token;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      // Storage can be unavailable in restricted embedded browsers.
    }
    window.dispatchEvent(new CustomEvent('vendify:native-token-updated'));
  }
};

if (typeof window !== 'undefined') {
  (window as NativeWindow).__vendifySetAccessToken = (token) => setAuthToken(token);
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  // Add the XSRF header only to state-changing requests below. Sending it on
  // GET/HEAD turns every cross-origin read into an OPTIONS + GET pair.
  withXSRFToken: false,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
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

apiClient.interceptors.request.use(async (config) => {
  const requestUrl = config.url ?? '';
  const normalizedUrl = requestUrl.replace(/^\/+/, '');
  config.url = normalizedUrl;

  if (normalizedUrl.includes('sanctum/csrf-cookie')) {
    config.baseURL = siteBaseUrl;
  }

  const method = (config.method ?? 'get').toLowerCase();
  const requiresCsrf = !['get', 'head', 'options'].includes(method);
  const native = typeof window !== 'undefined'
    ? (window as NativeWindow).__VENDIFY_NATIVE__
    : undefined;
  if (requiresCsrf && !native) {
    const sessionToken = await primeCsrfProtection();
    if (sessionToken) {
      setRequestHeader(config.headers, 'X-CSRF-TOKEN', sessionToken);
    }
  }

  const authToken = getAuthToken();
  // Only the native shell uses bearer authentication. Web requests rely on
  // the encrypted HttpOnly Sanctum session cookie and CSRF protection.
  if (native && authToken) {
    setRequestHeader(config.headers, 'Authorization', `Bearer ${authToken}`);
  }

  // Tell the backend which channel this request came from, so a purchase is
  // recorded with the right origin platform. The native shell sets
  // window.__VENDIFY_NATIVE__ = 'app' (see webview injectedJavaScript); a plain
  // browser leaves it unset and the backend defaults to "web".
  if (native) {
    setRequestHeader(config.headers, 'X-Client-Platform', native);
    const nativeWindow = window as NativeWindow;
    if (nativeWindow.__VENDIFY_DEVICE_ID__) {
      setRequestHeader(config.headers, 'X-Device-Id', nativeWindow.__VENDIFY_DEVICE_ID__);
    }
    if (nativeWindow.__VENDIFY_DEVICE_NAME__) {
      setRequestHeader(config.headers, 'X-Device-Name', nativeWindow.__VENDIFY_DEVICE_NAME__);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const expiresAt = response.headers['x-session-expires-at'];
    if (typeof expiresAt === 'string' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vendify:session-expiry-updated', { detail: expiresAt }));
    }
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url ?? '');
    if (status === 419) {
      csrfToken = null;
      const retryConfig = error?.config as (typeof error.config & {
        _vendifyCsrfRetried?: boolean;
      }) | undefined;

      if (retryConfig && !retryConfig._vendifyCsrfRetried && !isNativeClient()) {
        retryConfig._vendifyCsrfRetried = true;
        const refreshedToken = await primeCsrfProtection(true);
        if (refreshedToken) {
          setRequestHeader(retryConfig.headers, 'X-CSRF-TOKEN', refreshedToken);
          return apiClient.request(retryConfig);
        }
      }
    }
    if (status === 401 && !url.includes('login') && !url.includes('auth/refresh') && typeof window !== 'undefined') {
      if (isNativeClient()) {
        postToNative({ type: 'vendify-auth-refresh-required' });
      } else {
        window.dispatchEvent(new CustomEvent('vendify:session-expired'));
      }
    }
    return Promise.reject(error);
  },
);

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
