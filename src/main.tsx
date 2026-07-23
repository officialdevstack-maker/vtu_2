import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/queryClient";
import {
  persistCatalogInBackground,
  restorePersistedCatalog,
} from "@/shared/queryPersistence";
import { router } from "./app/router";
import "./index.css";

restorePersistedCatalog(queryClient);

// Mounted here (outside the router) rather than inside RootLayout, so that
// route-error.tsx's errorElement — which replaces RootLayout entirely when
// it fires — still has a QueryClient available (useBranding() needs one).
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);

// Persist only the small public catalog whitelist, and perform serialization
// during idle time so a successful request never blocks interaction or paint.
persistCatalogInBackground(queryClient);
