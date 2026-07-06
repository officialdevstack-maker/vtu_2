import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./route-layout";
import RouteErrorPage from "./route-error";
import { authRouter, ProtectedLayout } from "@/features/auth";
import App from "@/App";
import { UserLayout, userRouter } from "@/features/user";
import { adminRouter } from "@/features/admin";
import AdminProtectedLayout from "@/features/admin/components/AdminProtectedLayout";

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
        element: <App />,
      },

      ...authRouter,

      {
        element: <ProtectedLayout />,
        children: [
          {
            element: <UserLayout />,
            children: [...userRouter],
          },
        ],
      },
      // admin routes — auth + admin-role guard
      {
        element: <AdminProtectedLayout />,
        children: [...adminRouter],
      },
    ],
  },
]);
