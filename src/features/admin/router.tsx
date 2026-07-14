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
        path: "help",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/help/getting-started");
          return { Component };
        },
      },
      {
        path: "ai-manager",
        children: [
          {
            index: true,
            lazy: async () => {
              const { default: Component } =
                await import("./pages/ai-manager/ai-manager");
              return { Component };
            },
          },
          {
            path: "chat/:conversationId",
            lazy: async () => {
              const { default: Component } =
                await import("./pages/ai-manager/ai-manager");
              return { Component };
            },
          },
        ],
      },
      // APIs
      {
        path: "customers/users",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/customers/users");
          return { Component };
        },
      },
      {
        path: "customers/users/new",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/customers/customer-form");
          return { Component };
        },
      },
      {
        path: "customers/users/:id",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/customers/customer-detail");
          return { Component };
        },
      },
      {
        path: "customers/users/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/customers/customer-form");
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
        path: "customers/roles/new",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/customers/role-form");
          return { Component };
        },
      },
      {
        path: "customers/roles/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/customers/role-form");
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
        path: "apis/provider/new",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/apis/provider-form");
          return { Component };
        },
      },
      {
        path: "apis/provider/:id",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/apis/provider-detail");
          return { Component };
        },
      },
      {
        path: "apis/provider/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/apis/provider-form");
          return { Component };
        },
      },
      {
        path: "affiliates",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/affiliates/affiliate");
          return { Component };
        },
      },
      {
        // One affiliate's own little admin — a shared shell (header + tab
        // nav + instance context) with each concern as a nested page.
        path: "affiliates/:id",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/affiliates/affiliate-layout");
          return { Component };
        },
        children: [
          {
            index: true,
            lazy: async () => {
              const { default: Component } =
                await import("./pages/affiliates/overview");
              return { Component };
            },
          },
          {
            path: "customers",
            lazy: async () => {
              const { default: Component } =
                await import("./pages/affiliates/customers");
              return { Component };
            },
          },
          {
            path: "transactions",
            lazy: async () => {
              const { default: Component } =
                await import("./pages/affiliates/transactions");
              return { Component };
            },
          },
          {
            path: "messages",
            lazy: async () => {
              const { default: Component } =
                await import("./pages/affiliates/messages");
              return { Component };
            },
          },
          {
            path: "controls",
            lazy: async () => {
              const { default: Component } =
                await import("./pages/affiliates/controls");
              return { Component };
            },
          },
          {
            path: "directives",
            lazy: async () => {
              const { default: Component } =
                await import("./pages/affiliates/directives");
              return { Component };
            },
          },
        ],
      },
      {
        path: "affiliates/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/affiliates/affiliate-form");
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
        path: "apis/gateway/new",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/apis/gateway-form");
          return { Component };
        },
      },
      {
        path: "apis/gateway/:id",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/apis/gateway-detail");
          return { Component };
        },
      },
      {
        path: "apis/gateway/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/apis/gateway-form");
          return { Component };
        },
      },
      {
        path: "apis/routing",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/apis/service-routing");
          return { Component };
        },
      },
      {
        path: "apis/sim-vending",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/apis/sim-vending");
          return { Component };
        },
      },
      {
        path: "apis/sim-vending/devices/:deviceId/sims/new",
        lazy: async () => {
          const { default: Component } = await import("./pages/apis/sim-form");
          return { Component };
        },
      },
      {
        path: "apis/sim-vending/devices/:deviceId/sims/:simId/edit",
        lazy: async () => {
          const { default: Component } = await import("./pages/apis/sim-form");
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
          const { default: Component } =
            await import("./pages/products/cable/index");
          return { Component };
        },
      },
      {
        path: "products/cable/new",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/cable/cable-plan-form");
          return { Component };
        },
      },
      {
        path: "products/cable/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/cable/cable-plan-form");
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
          const { default: Component } =
            await import("./pages/products/bill-plan-form");
          return { Component };
        },
      },
      {
        path: "products/bill/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/products/bill-plan-form");
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
          const { default: Component } =
            await import("./pages/airtime-to-cash/index");
          return { Component };
        },
      },
      // Operations
      {
        path: "wallet-withdrawals",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/wallet-withdrawals/index");
          return { Component };
        },
      },
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
          const { default: Component } =
            await import("./pages/growth/discounts");
          return { Component };
        },
      },
      {
        path: "growth/discounts/new",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/growth/discount-form");
          return { Component };
        },
      },
      {
        path: "growth/discounts/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/growth/discount-form");
          return { Component };
        },
      },
      {
        path: "growth/cashback",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/growth/cashback");
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
          const { default: Component } =
            await import("./pages/growth/event-form");
          return { Component };
        },
      },
      {
        path: "growth/events/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/growth/event-form");
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
          const { default: Component } =
            await import("./pages/growth/promo-form");
          return { Component };
        },
      },
      {
        path: "growth/promos/:id/edit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/growth/promo-form");
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
        path: "notifications/inbox",
        lazy: async () => {
          const { default: Component } =
            await import("../user/pages/notifications");
          return { Component };
        },
      },
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
        path: "mobile-app",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/mobile-app/index");
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
          const { default: Component } =
            await import("../account/pages/AccountSettings");
          return { Component };
        },
      },
    ],
  },
];
