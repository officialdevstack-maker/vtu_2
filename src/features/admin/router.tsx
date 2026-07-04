import type { RouteObject } from "react-router";
import Layout from "./components/layout";

export const adminRouter: RouteObject[] = [
  {
    path: "admin",
    element: <Layout />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Component } = await import("./pages/admin");
          return { Component };
        },
      },
      {
        path: "customers/users",
        lazy: async () => {
          const { default: Component } = await import("./pages/customers/users");
          return { Component };
        },
      },
      {
        path: "customers/roles",
        lazy: async () => {
          const { default: Component } = await import("./pages/customers/roles");
          return { Component };
        },
      },
      {
        path: "*",
        lazy: async () => {
          const { default: Component } = await import("./pages/admin");
          return { Component };
        },
      },
    ],
  },
];
