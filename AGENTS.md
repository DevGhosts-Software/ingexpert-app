# Ingexpert - Gemini Agent Context

This file serves as the **primary source of truth** for the Ingexpert project context, architecture, and development standards for AI Agents.

## 1. Project Overview

**Ingexpert** is a comprehensive Stock Management System designed for managing electronic supplies. It features role-based access control (Admin/User), stock tracking, blame management (transaction auditing), and user management.

## 2. Monorepo Architecture

The project uses **pnpm** workspaces and **Turbo** for build orchestration.

### Applications

- **`apps/api` (`@ingexpert/api`)**
  - **Framework:** NestJS 11 + tRPC
  - **Purpose:** Backend logic, tRPC API, Stock management logic.
  - **Auth:** Supabase Auth Integration.
  - **Dependencies:** `@ingexpert/database`, `@ingexpert/schema`.

- **`apps/frontend` (`@ingexpert/frontend`)**
  - **Framework:** Next.js (React 19)
  - **State Management:** TanStack Query + tRPC.
  - **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`).
  - **UI Library:** shadcn/ui (Radix UI + Tailwind).
  - **Purpose:** User interface for Admins and Users.

### Packages

- **`packages/schema` (`@ingexpert/schema`)**
  - **Tech:** Zod.
  - **Purpose:** Centralized Zod schemas and DTOs shared between API and Frontend.

- **`packages/database` (`@ingexpert/database`)**
  - **Tech:** Prisma ORM, PostgreSQL.
  - **Purpose:** Centralized database schema and client generation.
  - **Exports:** Prisma Client instance.

- **`packages/config` (`@ingexpert/config`)**
  - **Purpose:** Shared configuration (ESLint, Prettier).

## 3. Development Mandates & Conventions

### Architectural Rules

1.  **API Flow:**
    - Define/Update Schema in `packages/database`.
    - Generate Prisma Client (`pnpm db:generate` / `pnpm build`).
    - Define **Zod Schemas** in tRPC Routers.
    - Implement Logic in NestJS Services.
    - Expose via tRPC Procedures.
2.  **Database Access:** Only `apps/api` should perform write operations. `apps/frontend` should consume the API via the tRPC client.
3.  **UI Components:** Use `shadcn/ui` components located in `apps/frontend/src/components/ui`. Customize via `apps/frontend/src/app/globals.css` (Tailwind v4).

### Coding Style

- **Strict Typing:** `noImplicitAny` is enforced.
- **Linting:** Respect existing `.eslintrc.js` and `prettier` configs.
- **Naming:**
  - Files: `kebab-case.ts` (e.g., `user-profile.component.tsx`, `auth.service.ts`).
  - Classes: `PascalCase`.
  - Variables/Functions: `camelCase`.

## 4. Commands Reference

- `pnpm dev` - Start dev servers.
- `pnpm build` - Build production artifacts.
- `pnpm db:migrate` - Apply schema changes.
- `pnpm db:studio` - View database content.
