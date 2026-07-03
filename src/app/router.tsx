import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./route-layout";
import { authRouter, ProtectedLayout } from "@/features/auth";
import App from "@/App";
import { UserLayout, userRouter } from "@/features/user";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // public routes
      {
        index: true,
        element: <App />,
      },

      ...authRouter,

      {
        element: <ProtectedLayout />,
        children: [{
          element:<UserLayout />,
          children: [...userRouter]
        }],
      },
    ],
  },
]);
