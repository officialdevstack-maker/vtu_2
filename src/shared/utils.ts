import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore localStorage errors in restricted environments.
    }
  }, [key, state]);

  return [state, setState] as const;
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
      | { message?: string; error?: string; errors?: Record<string, string[]> }
      | undefined;
    const validationErrors = data?.errors;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string" && data.message) return data.message;
    // A few older endpoints (e.g. CustomerController::upgrade) put the
    // string at `error` instead of `message`.
    if (typeof data?.error === "string" && data.error) return data.error;
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

// Converts a local Nigerian number (leading 0) to a wa.me link; a number
// already in international format (no leading 0) passes through untouched.
export function toWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

export function redirect(path: any) {
  const _path = path as string
  const isExternal = _path.startsWith('http://') || _path.startsWith('https://') || _path.startsWith('//');

  window.location.href = isExternal ? _path : `${window.location.origin}${_path.startsWith('/') ? path : `/${path}`}`;
}
