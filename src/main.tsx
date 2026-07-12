import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { queryClient, isCatalogQueryKey } from "@/shared/queryClient";
import { router } from "./app/router";
import "./index.css";

// Restores catalog queries (plan/network/settings lists — see
// CATALOG_QUERY_KEYS) from localStorage on boot, so a page reload paints
// those screens instantly from the last known data while React Query
// revalidates in the background. User- and admin-specific queries are
// filtered out below: they must never outlive the session in localStorage,
// and their freshness matters more than their paint time.
const persister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: "vtu-query-cache",
});

// Mounted here (outside the router) rather than inside RootLayout, so that
// route-error.tsx's errorElement — which replaces RootLayout entirely when
// it fires — still has a QueryClient available (useBranding() needs one).
// PersistQueryClientProvider renders a QueryClientProvider internally.
createRoot(document.getElementById("root")!).render(
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister,
      maxAge: 24 * 60 * 60 * 1000,
      // Bump to invalidate every persisted entry after a breaking change to
      // a catalog endpoint's response shape.
      buster: "v1",
      dehydrateOptions: {
        shouldDehydrateQuery: (query) =>
          query.state.status === "success" && isCatalogQueryKey(query.queryKey),
      },
    }}
  >
    <RouterProvider router={router} />
  </PersistQueryClientProvider>,
);
