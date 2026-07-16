import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { queryClient, isPersistableCatalogQueryKey } from "@/shared/queryClient";
import { router } from "./app/router";
import "./index.css";

// Restores only public, price-free catalog queries from localStorage on boot,
// so network/settings UI can paint from the last known data while React Query
// revalidates in the background. Role-priced plans and all user/admin data are
// filtered out: they must never outlive the session in localStorage.
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
      maxAge: 5 * 60 * 1000,
      // Bump to invalidate every persisted entry after a breaking change to
      // a catalog endpoint's response shape.
      buster: "v2",
      dehydrateOptions: {
        shouldDehydrateQuery: (query) =>
          query.state.status === "success" &&
          isPersistableCatalogQueryKey(query.queryKey),
      },
    }}
  >
    <RouterProvider router={router} />
  </PersistQueryClientProvider>,
);
