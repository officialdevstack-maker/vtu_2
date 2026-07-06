import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/apiClient";

// Public, unauthenticated subset of General settings (see
// BrandingController::show on the backend) — safe to call from pages
// rendered before login (landing, auth screens) as well as the
// authenticated app, so every place the brand name/logo appears tallies
// with what the admin configured in Settings > General.
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type Branding = {
  app_name: string;
  logo: string | null;
  meta_title: string;
  meta_description: string | null;
};

const FALLBACK: Branding = {
  app_name: "KORA",
  logo: null,
  meta_title: "KORA",
  meta_description: null,
};

// Persisted across full page reloads (not just within one SPA session) so
// the real brand name/logo/title are available immediately on next visit —
// index.html's inline bootstrap script reads this exact same key to set
// document.title before React (or even the JS bundle) has loaded, and this
// hook reads it again as `initialData` so there's no loading flash either.
export const BRANDING_STORAGE_KEY = "branding-cache-v1";

function readCache(): { data: Branding; updatedAt: number } | null {
  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(data: Branding): void {
  try {
    window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify({ data, updatedAt: Date.now() }));
  } catch {
    // Storage full or unavailable (private browsing) — not worth failing over.
  }
}

export function useBranding(): Branding & { isLoading: boolean } {
  const cached = readCache();

  const { data, isLoading } = useQuery({
    queryKey: ["branding"],
    queryFn: () =>
      apiClient.get<ApiEnvelope<Branding>>("/branding").then((r) => {
        writeCache(r.data.data);
        return r.data.data;
      }),
    // Branding rarely changes — 30 minutes keeps repeat pings rare within a
    // session without going all the way to Infinity, which (combined with
    // the localStorage cache surviving page reloads) could otherwise show a
    // days-stale brand name forever after just one admin edit.
    staleTime: 30 * 60 * 1000,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
  });

  return { ...FALLBACK, ...data, isLoading };
}

// Keeps the browser tab title and meta description tallied with whatever
// the admin has configured, site-wide. Mount once near the app root.
export function useDocumentBranding(): void {
  const { meta_title, meta_description, isLoading } = useBranding();

  useEffect(() => {
    if (isLoading) return;
    document.title = meta_title;

    if (meta_description) {
      let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = "description";
        document.head.appendChild(tag);
      }
      tag.content = meta_description;
    }
  }, [meta_title, meta_description, isLoading]);
}
