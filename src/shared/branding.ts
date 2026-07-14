import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/apiClient";
import primaryLogoUrl from "@/assets/vendify-logo.png";

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

const PRIMARY_LOGO_URL = primaryLogoUrl;

const FALLBACK: Branding = {
  app_name: "Vendify",
  logo: PRIMARY_LOGO_URL,
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
export const BRANDING_STORAGE_KEY = "vendify-branding-cache-v2";

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
        // The primary Vendify mark ships with the frontend so auth screens,
        // loaders and navigation never depend on a separate image request to
        // the API host (which may be deployed on another origin).
        const branding = { ...r.data.data, logo: PRIMARY_LOGO_URL };
        writeCache(branding);
        return branding;
      }),
    // Branding rarely changes — 30 minutes keeps repeat pings rare within a
    // session without going all the way to Infinity, which (combined with
    // the localStorage cache surviving page reloads) could otherwise show a
    // days-stale brand name forever after just one admin edit.
    staleTime: 30 * 60 * 1000,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
  });

  return { ...FALLBACK, ...data, logo: PRIMARY_LOGO_URL, isLoading };
}

// NOTE: document title / meta / favicon management now lives in a single
// place — src/shared/seo.tsx (SeoProvider) — so per-page useSeo() overrides
// never race a global default. See that file for the head-tag logic.
