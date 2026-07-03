
import type { RouteObject } from "react-router";
import { createElement } from "react";
import { Navigate } from "react-router-dom";

export const authRouter: RouteObject[] = [
    {
        path: 'auth/dashboard',
        element: createElement(Navigate, { to: "/dashboard", replace: true }),
    },
    {
        path: 'auth',
        lazy: async () => {
            const { default: Component } = await import("./pages/login")
            return { Component }
        }
    },
    {
        path: 'login',
        lazy: async () => {
            const { default: Component } = await import("./pages/login")
            return { Component }
        }
    },
    {
        path: 'register',
        lazy: async () => {
            const { default: Component } = await import("./pages/register")
            return { Component }
        }
    }
];
