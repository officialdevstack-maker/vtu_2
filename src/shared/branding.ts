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
  // Public contact details from Settings > General (shown in the landing
  // footer). Optional because caches written before these fields existed
  // won't have them.
  app_email?: string | null;
  app_phone?: string | null;
};

const FALLBACK: Branding = {
  app_name: "Vendify",
  logo: null,
  meta_title: "Vendify",
  meta_description: null,
  app_email: null,
  app_phone: null,
};

// Persisted across full page reloads (not just within one SPA session) so
// the real brand name/logo/title are available immediately on next visit —
// index.html's inline bootstrap script reads this exact same key to set
// document.title before React (or even the JS bundle) has loaded, and this
// hook reads it again as `initialData` so there's no loading flash either.
export const BRANDING_STORAGE_KEY = "vendify-branding-cache-v1";

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

// Keeps the browser tab title, meta description and favicon tallied with
// whatever the admin has configured, site-wide. Mount once near the app root.
export function useDocumentBranding(): void {
  const { meta_title, meta_description, logo, isLoading } = useBranding();

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

    if (logo) {
      let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        document.head.appendChild(icon);
      }
      // The static tag declares type="image/svg+xml" for the bundled default;
      // the uploaded logo is usually PNG/JPG, so drop the stale hint.
      icon.removeAttribute("type");
      icon.href = logo;
    }
  }, [meta_title, meta_description, logo, isLoading]);
}
