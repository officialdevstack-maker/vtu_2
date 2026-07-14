import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { useBranding } from "./branding";
import { env } from "./env";

// Canonical site origin used for <link rel="canonical"> and og:url. In
// production set VITE_SITE_URL=https://vendify.com.ng; locally it falls back to
// the real origin so dev builds don't advertise the production domain.
const SITE_URL = (
  (env("VITE_SITE_URL") as string | undefined) ||
  (typeof window !== "undefined" ? window.location.origin : "https://vendify.com.ng")
).replace(/\/+$/, "");

const DEFAULT_DESCRIPTION =
  "Vendify is the fast, secure way to buy airtime and data, pay electricity, cable TV and exam bills in Nigeria — with instant delivery, low prices and 24/7 support.";

export type PageSeo = {
  /** Page-specific title, shown as "{title} — {Brand}". Omit on the home page. */
  title?: string;
  /** Page-specific meta/OG description. Falls back to brand, then default. */
  description?: string;
  /** Extra JSON-LD injected while this page is mounted (e.g. FAQ, Product). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Set true on private/transactional pages to keep them out of the index. */
  noIndex?: boolean;
};

type SeoContextValue = {
  register: (seo: PageSeo) => void;
  unregister: () => void;
};

const SeoContext = createContext<SeoContextValue | null>(null);

/** Create the meta tag if missing, then set its content. */
function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string | null,
) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (content == null) return;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = rel;
    document.head.appendChild(tag);
  }
  tag.href = href;
}

const JSONLD_ID = "seo-page-jsonld";

/**
 * Owns every SEO-relevant head tag site-wide, in one place, so there's no race
 * between a global default and a per-page override: pages register their SEO
 * via useSeo(), which updates state here, and this single effect re-applies the
 * merged (brand + page + route) result to the DOM.
 */
export function SeoProvider({ children }: { children: ReactNode }) {
  const [pageSeo, setPageSeo] = useState<PageSeo>({});
  const { app_name, meta_title, meta_description, logo, isLoading } =
    useBranding();
  const location = useLocation();

  const value = useMemo<SeoContextValue>(
    () => ({
      register: (seo) => setPageSeo(seo),
      unregister: () => setPageSeo({}),
    }),
    [],
  );

  useEffect(() => {
    if (isLoading) return;

    const brand = app_name || meta_title || "Vendify";
    const title = pageSeo.title ? `${pageSeo.title} — ${brand}` : meta_title || brand;
    const description =
      pageSeo.description || meta_description || DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${location.pathname}`;

    document.title = title;
    document.documentElement.lang = "en";

    upsertMeta("name", "description", description);
    upsertMeta(
      "name",
      "robots",
      pageSeo.noIndex ? "noindex, nofollow" : "index, follow",
    );
    upsertLink("canonical", url);

    // Open Graph
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:site_name", brand);

    // Twitter
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);

    if (logo) {
      // og:image / favicon follow the admin-configured logo when present.
      const absoluteLogo = /^https?:\/\//i.test(logo)
        ? logo
        : `${SITE_URL}${logo.startsWith("/") ? "" : "/"}${logo}`;
      upsertMeta("property", "og:image", absoluteLogo);
      upsertMeta("name", "twitter:image", absoluteLogo);

      let icon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        document.head.appendChild(icon);
      }
      icon.removeAttribute("type");
      icon.href = logo;
    }

    // Per-page JSON-LD (replaced on each route/override change).
    const existing = document.getElementById(JSONLD_ID);
    if (existing) existing.remove();
    if (pageSeo.jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = JSONLD_ID;
      script.textContent = JSON.stringify(pageSeo.jsonLd);
      document.head.appendChild(script);
    }
  }, [
    app_name,
    meta_title,
    meta_description,
    logo,
    isLoading,
    location.pathname,
    pageSeo,
  ]);

  return <SeoContext.Provider value={value}>{children}</SeoContext.Provider>;
}

/**
 * Declare a route's SEO. Safe to call from any page under <SeoProvider>. The
 * override is cleared automatically when the page unmounts, so routes that
 * don't call this fall back to the brand defaults.
 */
export function useSeo(seo: PageSeo): void {
  const ctx = useContext(SeoContext);
  // Serialize so the effect only re-fires when the actual SEO values change,
  // not on every render that passes a fresh object literal.
  const key = JSON.stringify(seo);

  useEffect(() => {
    if (!ctx) return;
    ctx.register(seo);
    return () => ctx.unregister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, key]);
}
