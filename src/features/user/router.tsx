import type { RouteObject } from "react-router";

export const userRouter: RouteObject[] = [
  {
    path: "dashboard",
    lazy: async () => {
      const { default: Component } = await import("./pages/dashboard");
      return { Component };
    },
  },
  {
    path: "data",
    lazy: async () => {
      const { default: Component } = await import("./pages/buy-data");
      return { Component };
    },
  },
  {
    path: "bills",
    lazy: async () => {
      const { default: Component } = await import("./pages/utility-bills");
      return { Component };
    },
  },
  {
    path: "transactions",
    lazy: async () => {
      const { default: Component } = await import("./pages/transactions");
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
];
