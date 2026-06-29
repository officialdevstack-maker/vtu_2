import type { RouteObject } from "react-router";
import { createElement } from "react";
import { Navigate } from "react-router-dom";

export const airtimeRouter: RouteObject[] = [
    {
        path: 'create',
        element: createElement(Navigate, { to: "/airtime", replace: true }),
    },
    {
        path: 'airtime',
        
        lazy: async () => {
            const { default: Component } = await import("./pages/create")
            return { Component  }
        }
    }
];
