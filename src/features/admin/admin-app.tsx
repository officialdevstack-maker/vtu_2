import { useRoutes } from "react-router-dom";
import AdminProtectedLayout from "./components/AdminProtectedLayout";
import { adminRouter } from "./router";

// Loaded only for /admin/* so the large admin route table and shell never
// enter the public/auth/customer startup graph.
export default function AdminApp() {
  return useRoutes([
    {
      element: <AdminProtectedLayout />,
      children: adminRouter,
    },
  ]);
}
