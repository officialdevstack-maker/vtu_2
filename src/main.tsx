import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/queryClient";
import { router } from "./app/router";
import "./index.css";

// Mounted here (outside the router) rather than inside RootLayout, so that
// route-error.tsx's errorElement — which replaces RootLayout entirely when
// it fires — still has a QueryClient available (useBranding() needs one).
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
