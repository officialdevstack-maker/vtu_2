import type { RouteObject } from "react-router";
import { createElement } from "react";
import { Navigate } from "react-router-dom";

export const userRouter: RouteObject[] = [
  {
    index: true,
    element: createElement(Navigate, { to: "/dashboard", replace: true }),
  },
  {
    path: "dashboard",
    lazy: async () => {
      const { default: Component } = await import("./pages/dashboard");
      return { Component };
    },
  },
  {
    path: "services",
    lazy: async () => {
      const { default: Component } = await import("./pages/services");
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
    path: "wallet",
    lazy: async () => {
      const { default: Component } = await import("./pages/wallet");
      return { Component };
    },
  },
  {
    path: "buy-airtime",
    lazy: async () => {
      const { default: Component } = await import("./pages/buy-airtime");
      return { Component };
    },
  },
  {
    path: "buy-data",
    lazy: async () => {
      const { default: Component } = await import("./pages/buy-data");
      return { Component };
    },
  },
  {
    path: "cable-tv",
    lazy: async () => {
      const { default: Component } = await import("./pages/cable-tv");
      return { Component };
    },
  },
  {
    path: "electricity",
    lazy: async () => {
      const { default: Component } = await import("./pages/electricity");
      return { Component };
    },
  },
  {
    path: "airtime-to-cash",
    lazy: async () => {
      const { default: Component } = await import("./pages/airtime-to-cash");
      return { Component };
    },
  },
  {
    path: "pricing",
    lazy: async () => {
      const { default: Component } = await import("./pages/pricing");
      return { Component };
    },
  },
  {
    path: "admin",
    lazy: async () => {
      const { default: Component } = await import("../admin/pages/admin");
      return { Component };
    },
  },
  {
    path: "notifications",
    lazy: async () => {
      const { default: Component } = await import("./pages/notifications");
      return { Component };
    },
  },
  {
    path: "settings",
    lazy: async () => {
      const { default: Component } = await import(
        "../account/pages/AccountSettings"
      );
      return { Component };
    },
  },
  {
    path: "upgrade-account",
    lazy: async () => {
      const { default: Component } = await import("./pages/upgrade-account");
      return { Component };
    },
  },
  {
    path: "referral",
    lazy: async () => {
      const { default: Component } = await import("./pages/referral");
      return { Component };
    },
  },
  {
    path: "beneficiaries",
    lazy: async () => {
      const { default: Component } = await import("./pages/beneficiaries");
      return { Component };
    },
  },
  // Legacy redirects
  {
    path: "profile",
    element: createElement(Navigate, { to: "/settings", replace: true }),
  },
  {
    path: "data",
    element: createElement(Navigate, { to: "/buy-data", replace: true }),
  },
  {
    path: "bills",
    element: createElement(Navigate, { to: "/services", replace: true }),
  },
];
