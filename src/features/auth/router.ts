
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
    },
    {
        path: 'create-transaction-pin',
        lazy: async () => {
            const { default: Component } = await import("./pages/create-transaction-pin")
            return { Component }
        }
    },
    {
        path: 'forgot-password',
        lazy: async () => {
            const { default: Component } = await import("./pages/forgot-password")
            return { Component }
        }
    },
    {
        path: 'reset-password',
        lazy: async () => {
            const { default: Component } = await import("./pages/reset-password")
            return { Component }
        }
    },
    // VerifyEmailController::verifyFromLink redirects here on success
    // (?verified=1), already-verified (?verified=1&already=true), or
    // failure (?reason=...) — same landing page for all three paths it
    // might redirect to.
    {
        path: 'verify-email',
        lazy: async () => {
            const { default: Component } = await import("./pages/email-verified")
            return { Component }
        }
    },
    {
        path: 'email-verified',
        lazy: async () => {
            const { default: Component } = await import("./pages/email-verified")
            return { Component }
        }
    },
    {
        path: 'email-verification-failed',
        lazy: async () => {
            const { default: Component } = await import("./pages/email-verified")
            return { Component }
        }
    }
];
