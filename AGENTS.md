# AGENTS

## Project Overview

This repository is a React + TypeScript + Vite application for a VTU-style services dashboard. It includes admin and user feature areas, routing layouts, shared UI components, API client utilities, and Tailwind/CSS styling.

The app structure is organized by feature domain under `src/`, with separate subfolders for `admin`, `airtime`, `auth`, `data`, `user`, and `redesign`. The `shared` folder contains reusable components, helper utilities, and configuration values.

## Purpose of This Document

`AGENTS.md` is intended to help AI agents, contributors, and maintainers understand:

- how to interpret the repository layout
- what roles and responsibilities agents should take
- common coding conventions and architectural patterns
- testing, linting, and build workflows
- how to safely modify and extend the app

## Recommended Agent Roles

### 1. Code Authoring Agent

This agent should:

- add new features or pages following existing conventions
- extend components and layouts in a consistent way
- update routing and navigation cleanly
- use TypeScript interfaces and type safety
- preserve readability and maintainability

### 2. Code Review Agent

This agent should:

- verify code follows project structure and naming patterns
- check for correct imports, route usage, and component composition
- ensure no unnecessary dependencies are added
- inspect TypeScript usage and React hooks patterns
- suggest improvements for accessibility, UX, and performance

### 3. Refactoring Agent

This agent should:

- simplify repeated logic into shared utilities
- extract UI patterns into reusable components
- optimize state handling in pages and forms
- clean up styling and layout duplication
- preserve functionality while improving structure

### 4. Documentation Agent

This agent should:

- keep README and AGENTS.md up to date
- document component responsibilities and API expectations
- explain custom configuration or unusual implementation details
- add usage notes for contributors and reviewers

## Core Repository Structure

### Root Files

- `package.json` - application dependencies and scripts
- `vite.config.ts` - Vite build/dev configuration
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript configuration
- `eslint.config.js` - linting rules and file targeting
- `README.md` - generic Vite React template info

### `public/`

- static assets served by Vite

### `src/`

- `App.tsx`, `main.tsx`, `index.css`, `App.css` - application entry and global styling
- `app/` - app-level routes, layouts, and feature modules
- `shared/` - utilities, components, API client, and shared layout logic
- `redesign/` - alternate or experimental design system and styles

## `src/app/` Conventions

### Feature Domain Organization

The admin and user sections follow a domain-driven layout:

- `admin/` contains admin-specific router and pages
- `user/` contains user-facing pages, layout, sidebar, and topbar
- `auth/` contains authentication routing and validation
- `airtime/` contains airtime-specific routes and UI elements

Subfolders reflect feature sets e.g. `admin/pages/products`, `admin/pages/notifications`, `user/pages/dashboard`.

### Routing Approach

- `router.tsx` files define route trees using React Router v7
- `route-layout.tsx` and feature-specific layouts compose nested routes
- `auth/router.ts` likely handles public vs protected route flows
- maintain route nesting by feature and layout boundary

### Component Conventions

- pages are typically `.tsx` files in `pages/`
- shared layout and navigation live in `components/`
- feature-specific UI elements may live under `component/` or `components/`
- use `tsx` for content and logic components

## Shared Layer and Utilities

### `src/shared/`

- `button.tsx` - shared button component style
- `config.ts` - configuration and static settings
- `env.ts` - environment variable helpers
- `type.ts` - shared TypeScript types
- `utils.ts` - generic helper functions
- `api/apiClient.ts` - common HTTP client setup, likely for Axios
- `components/` - reusable UI building blocks like sidebar, topbar, wallet mini, order summary
- `layouts/` - shared layout wrappers, including `user-layout.tsx`
- `providers/auth.tsx` - auth provider and context handling

### Best Practices

- Prefer shared components for repeated UI patterns
- Avoid copy-pasting styles or layout markup across pages
- Keep API calls centralized in `shared/api/apiClient.ts`
- Use both `env.ts` and `config.ts` for runtime and build-time configuration

## Styling and Design

### Tailwind and CSS

- project uses Tailwind CSS via `@tailwindcss/vite`
- global styles are managed in `index.css` and `App.css`
- the `redesign/` folder includes an alternate styling system and fonts
- follow existing spacing, color, and utility patterns when adding UI

## Common Workflow Commands

- `npm run dev` - start the Vite development server
- `npm run build` - compile TypeScript and build production assets
- `npm run lint` - run ESLint across the repository
- `npm run preview` - preview production build locally

## Contribution Guidelines for Agents

### Adding a new page or feature

1. add a new page under the appropriate domain folder
2. update the feature router file for that area
3. add layout or sidebar navigation only when needed
4. use existing shared UI components where possible
5. add validation and type definitions in `auth/validators.ts` or `shared/type.ts` if needed

### Changing routing

- preserve existing route hierarchy
- keep route strings in sync with page filenames
- ensure nested layouts remain wrapped correctly
- do not change route structure without verifying navigation flows

### Working with forms

- use `react-hook-form` for form state
- use `zod` for schema validation when applicable
- keep form components modular and reusable

### Avoiding common issues

- do not introduce direct DOM manipulation unless necessary
- avoid adding new global CSS selectors unless localized styles are required
- keep third-party dependency additions minimal and justified
- do not bypass TypeScript strictness with `any` without strong reason

## Agent Guidance for Reviews

### Quality checks

- ensure the new code is consistent with the app’s feature folder structure
- verify imports from `src/shared` use relative paths correctly
- confirm that `React Router` navigation is consistent and uses the correct `Link`/`NavLink` patterns
- check that admin/user boundaries remain isolated in the feature layout
- verify any API calls use `axios` via `shared/api/apiClient.ts`

### Performance and UX

- prefer memoization for expensive derived values
- avoid unnecessary rerenders on route changes
- ensure layout components preserve mobile responsiveness
- keep data loading patterns clear and declarative

## When to Update `AGENTS.md`

Update this document when:

- new major app sections are added
- the routing architecture changes significantly
- a new shared utility or layout pattern is introduced
- contribution requirements or agent responsibilities evolve

## Appendix: Quick Reference

- `src/app/router.tsx` - primary app router
- `src/app/route-layout.tsx` - app-level route layout
- `src/features/admin/router.tsx` - admin route tree
- `src/features/user/router.tsx` - user route tree
- `src/shared/api/apiClient.ts` - HTTP client configuration
- `src/shared/providers/auth.tsx` - auth provider and context

---

This file is intentionally descriptive to orient agents and contributors to the repository’s architecture and expected workflow. Keep it current with the codebase as the project evolves.
