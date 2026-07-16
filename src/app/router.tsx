import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./route-layout";
import RouteErrorPage from "./route-error";
import { authRouter } from "@/features/auth/router";
import { userRouter } from "@/features/user/router";
import { adminRouter } from "@/features/admin/router";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    // Catches both unmatched paths (404) and any thrown error anywhere in
    // this tree — see route-error.tsx.
    errorElement: <RouteErrorPage />,
    children: [
      // public routes
      {
        index: true,
        lazy: async () => {
          const { default: Component } = await import("@/features/landing/landing-page");
          return { Component };
        },
      },
      {
        path: "privacy",
        lazy: async () => {
          const { PrivacyPolicyPage: Component } = await import("@/features/legal/legal-page");
          return { Component };
        },
      },
      {
        path: "terms",
        lazy: async () => {
          const { TermsOfServicePage: Component } = await import("@/features/legal/legal-page");
          return { Component };
        },
      },
      {
        path: "refund-policy",
        lazy: async () => {
          const { RefundPolicyPage: Component } = await import("@/features/legal/legal-page");
          return { Component };
        },
      },

      // Public "download the mobile app" page — no auth, reads /app/latest.
      {
        path: "download",
        lazy: async () => {
          const { default: Component } = await import(
            "@/features/download/download-page"
          );
          return { Component };
        },
      },

      ...authRouter,

      {
        lazy: async () => {
          const { default: Component } = await import("@/features/auth/comonents/ProtectedLayout");
          return { Component };
        },
        children: [
          {
            lazy: async () => {
              const { default: Component } = await import("@/features/user/components/layout");
              return { Component };
            },
            children: [...userRouter],
          },
        ],
      },
      // admin routes — auth + admin-role guard
      {
        lazy: async () => {
          const { default: Component } = await import("@/features/admin/components/AdminProtectedLayout");
          return { Component };
        },
        children: [...adminRouter],
      },
    ],
  },
]);
