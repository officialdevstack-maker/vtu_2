import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The backend returns a few different error envelope shapes across
// endpoints (validation-shaped {errors}, plain {message}, raw {status,
// message}) — but every one of them puts a human-readable string at either
// response.data.errors or response.data.message, so this covers all of them.
export function extractApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const validationErrors = data?.errors;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string" && data.message) return data.message;
  }
  return fallback;
}

// Mirrors backend ValidPhoneForNetwork's prefix map exactly, so the network
// we auto-select on the frontend always matches what the server would accept.
const NETWORK_PREFIXES: Record<string, string[]> = {
  mtn: ["0803", "0806", "0810", "0813", "0814", "0816", "0703", "0706", "0903", "0906", "0913", "0916"],
  airtel: ["0802", "0808", "0812", "0708", "0701", "0902", "0907", "0901", "0912"],
  glo: ["0805", "0807", "0811", "0815", "0705", "0905", "0915"],
  "9mobile": ["0809", "0817", "0818", "0909", "0908"],
};

export function detectNetwork(phone: string): string | null {
  const prefix = phone.slice(0, 4);
  for (const [net, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) return net;
  }
  return null;
}

export function redirect(path: any) {
  const _path = path as string
  const isExternal = _path.startsWith('http://') || _path.startsWith('https://') || _path.startsWith('//');

  window.location.href = isExternal ? _path : `${window.location.origin}${_path.startsWith('/') ? path : `/${path}`}`;
}