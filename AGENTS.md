# Ingexpert - Gemini Agent Context

This file serves as the **primary source of truth** for the Ingexpert project context, architecture, and development standards for AI Agents.

## 1. Project Overview

**Ingexpert** is a high-performance, Corporate Stock Management System. It follows an **Offline-First / Admin-Only** user management philosophy:

- **Public Registration is Disabled:** Only Admins can create new user accounts (Employees).
- **Security:** End-to-end type safety with tRPC and RS256 JWT validation via JWKS.

## 2. Monorepo Architecture

The project uses **pnpm** workspaces and **Turbo** for build orchestration.

### Applications

- **`apps/api` (`@ingexpert/api`)**
  - **Framework:** NestJS 11 + tRPC
  - **Purpose:** Backend logic, tRPC API, Stock management logic.
  - **Auth:** Supabase Auth (Admin API for creation, RS256/JWKS for validation).
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

## 5. Shared Types in `packages/schema`

Each `[domain].schema.ts` file is divided into two explicit sections:

### Section 1 — DTOs (Zod schemas for tRPC input validation)

- **Named:** `[Action][Domain]Schema` (e.g., `CreateItemSchema`, `ItemPaginationSchema`)
- **Used as:** tRPC `.input(SomeSchema)` — Zod parses and coerces the payload at the API boundary.
- **Type exported as:** `type CreateItemDto = z.infer<typeof CreateItemSchema>`
- **Rule:** Only inputs need Zod. Never wrap API _response_ types in Zod — they are never `.parse()`-d.

### Section 2 — Entities (Prisma-derived TypeScript types)

- **Named:** `[Domain]Entity` (e.g., `ItemEntity`, `MovementEntity`)
- **Derived from:** The Prisma-generated model type from `@ingexpert/database`.
- **Pattern:**
  - No overrides needed → `export type ProjectEntity = Project`
  - Decimal fields → `export type ItemEntity = Omit<Item, 'stock'> & { stock: number }`
  - Date fields (JSON serialized) → `export type MovementEntity = Omit<Movement, 'date'> & { date: string }`
- **Safety guarantee:** If a new column is added to the Prisma schema, TypeScript will error in the service's `mapXxx()` method until the mapping is updated. This is intentional — the DB schema is the source of truth.
- **Mapping:** API services map `PrismaModel → Entity` via a private `mapXxx()` method before returning from tRPC procedures.
- **Frontend:** Import entity types from `@ingexpert/schema` — never declare local interfaces that duplicate the shape of API data.
- **tRPC inference:** When a service method returns `Promise<ItemEntity>`, tRPC infers the client-side type automatically.

## 4. Commands Reference

- `pnpm dev` - Start dev servers.
- `pnpm build` - Build production artifacts.
- `pnpm db:migrate` - Apply schema changes.
- `pnpm db:studio` - View database content.
