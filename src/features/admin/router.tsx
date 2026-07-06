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
        path: "customers/users",
        lazy: async () => {
          const { default: Component } = await import("./pages/customers/users");
          return { Component };
        },
      },
      {
        path: "customers/users/:id",
        lazy: async () => {
          const { default: Component } = await import(
            "./pages/customers/customer-detail"
          );
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
        path: "customers/roles/new",
        lazy: async () => {
          const { default: Component } = await import("./pages/customers/role-form");
          return { Component };
        },
      },
      {
        path: "customers/roles/:id/edit",
        lazy: async () => {
          const { default: Component } = await import("./pages/customers/role-form");
          return { Component };
        },
      },
      {
        path: "apis/provider",
        lazy: async () => {
          const { default: Component } = await import("./pages/apis/provider");
          return { Component };
        },
      },
      {
        path: "apis/provider/:id",
        lazy: async () => {
          const { default: Component } = await import(
            "./pages/apis/provider-detail"
          );
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
      {
        path: "apis/gateway/:id",
        lazy: async () => {
          const { default: Component } = await import(
            "./pages/apis/gateway-detail"
          );
          return { Component };
        },
      },
      // Products
      {
        path: "products/airtime-data",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/airtime-data/index");
          return { Component };
        },
      },
      {
        path: "products/airtime-data/airtime/new",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/airtime-data/network-form");
          return { Component };
        },
      },
      {
        path: "products/airtime-data/airtime-plan/new",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/airtime-data/airtime-plan-form");
          return { Component };
        },
      },
      {
        path: "products/airtime-data/airtime-plan/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/airtime-data/airtime-plan-form");
          return { Component };
        },
      },
      {
        path: "products/airtime-data/data-plans/new",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/airtime-data/data-plan-form");
          return { Component };
        },
      },
      {
        path: "products/airtime-data/data-plans/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/airtime-data/data-plan-form");
          return { Component };
        },
      },
      {
        path: "products/cable",
        lazy: async () => {
          const { default: Component } = await import("./pages/products/cable/index");
          return { Component };
        },
      },
      {
        path: "products/cable/new",
        lazy: async () => {
          const { default: Component } = await import("./pages/products/cable/cable-plan-form");
          return { Component };
        },
      },
      {
        path: "products/cable/:id/edit",
        lazy: async () => {
          const { default: Component } = await import("./pages/products/cable/cable-plan-form");
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
        path: "products/bill/new",
        lazy: async () => {
          const { default: Component } = await import("./pages/products/bill-plan-form");
          return { Component };
        },
      },
      {
        path: "products/bill/:id/edit",
        lazy: async () => {
          const { default: Component } = await import("./pages/products/bill-plan-form");
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
      {
        path: "airtime-to-cash",
        lazy: async () => {
          const { default: Component } = await import("./pages/airtime-to-cash/index");
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
        path: "growth/discounts",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/discounts");
          return { Component };
        },
      },
      {
        path: "growth/discounts/new",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/discount-form");
          return { Component };
        },
      },
      {
        path: "growth/discounts/:id/edit",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/discount-form");
          return { Component };
        },
      },
      {
        path: "growth/cashback",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/cashback");
          return { Component };
        },
      },
      {
        path: "growth/events",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/events");
          return { Component };
        },
      },
      {
        path: "growth/events/new",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/event-form");
          return { Component };
        },
      },
      {
        path: "growth/events/:id/edit",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/event-form");
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
        path: "growth/promos/new",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/promo-form");
          return { Component };
        },
      },
      {
        path: "growth/promos/:id/edit",
        lazy: async () => {
          const { default: Component } = await import("./pages/growth/promo-form");
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
          const { default: Component } = await import("./pages/settings/index");
          return { Component };
        },
      },
      {
        path: "account",
        lazy: async () => {
          const { default: Component } = await import(
            "../account/pages/AccountSettings"
          );
          return { Component };
        },
      },
    ],
  },
];
