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

export function useBranding(): Branding & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["branding"],
    queryFn: () =>
      apiClient.get<ApiEnvelope<Branding>>("/branding").then((r) => r.data.data),
    staleTime: Infinity,
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
