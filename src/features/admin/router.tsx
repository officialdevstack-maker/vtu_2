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
      // APIs
      {
        path: "apis/provider",
        lazy: async () => {
          const { default: Component } = await import("./pages/apis/provider");
          return { Component };
        },
      },
      {
        path: "apis/gateway",
        lazy: async () => {
          const { default: Component } = await import("./pages/apis/gateway");
          return { Component };
        },
      },
      // Products
      {
        path: "products/airtime-data",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/airtime-data");
          return { Component };
        },
      },
      {
        path: "products/cable",
        lazy: async () => {
          const { default: Component } = await import("./pages/products/cable");
          return { Component };
        },
      },
      {
        path: "products/bill",
        lazy: async () => {
          const { default: Component } = await import("./pages/products/bill");
          return { Component };
        },
      },
      {
        path: "products/exam",
        lazy: async () => {
          const { default: Component } = await import("./pages/products/exam");
          return { Component };
        },
      },
      // Operations
      {
        path: "service-control",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/service-control");
          return { Component };
        },
      },
      {
        path: "customers/users",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/customers/users");
          return { Component };
        },
      },
      {
        path: "customers/roles",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/customers/roles");
          return { Component };
        },
      },
      {
        path: "growth/campaigns",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/growth/campaigns");
          return { Component };
        },
      },
      {
        path: "growth/promos",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/promos");
          return { Component };
        },
      },
      {
        path: "transactions",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/transactions/index");
          return { Component };
        },
      },
      // Communication
      {
        path: "notifications/broadcast",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/notifications/broadcast");
          return { Component };
        },
      },
      {
        path: "notifications/welcome",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/notifications/welcome");
          return { Component };
        },
      },
      {
        path: "notifications/template",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/notifications/template");
          return { Component };
        },
      },
      {
        path: "settings",
        lazy: async () => {
          const { default: Component } = await import("./pages/settings");
          return { Component };
        },
      },
    ],
  },
];
