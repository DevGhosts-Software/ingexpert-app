# Ingexpert - Agent Context

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
  - **Tech:** Zod + TypeScript.
  - **Purpose:** Two-track shared type system — Zod schemas for DTO input validation, Prisma-derived TypeScript types for API response entities.

- **`packages/database` (`@ingexpert/database`)**
  - **Tech:** Prisma ORM, PostgreSQL.
  - **Purpose:** Centralized database schema and client generation.
  - **Exports:** Prisma Client instance and all generated model types (used as entity bases in `@ingexpert/schema`).

- **`packages/config` (`@ingexpert/config`)**
  - **Purpose:** Shared configuration (ESLint, Prettier).

## 3. Development Mandates & Conventions

### Architectural Rules

1.  **Feature Flow (full cycle for a new domain):**
    - Define/Update Prisma schema in `packages/database/prisma/schema/`.
    - Run `pnpm db:generate` to regenerate the Prisma Client.
    - In `packages/schema/src/[domain].schema.ts`, add DTOs (Zod) and Entity types (Prisma-derived). See Section 5.
    - In `apps/api`, implement the NestJS Service and tRPC Router. Import Zod schemas from `@ingexpert/schema` — never define them inside routers.
    - In `apps/frontend`, the page (Container) fetches data via tRPC hooks. Feature components (Presenters) render and mutate.
2.  **Database Access:** Only `apps/api` performs write operations. `apps/frontend` consumes exclusively via tRPC.
3.  **UI Components:** Use `shadcn/ui` from `apps/frontend/src/components/ui`. Customize via `apps/frontend/src/app/globals.css` (Tailwind v4).

### Coding Style

- **Strict Typing:** `noImplicitAny` is enforced. No `any`.
- **Linting:** Respect existing `.eslintrc.js` and `prettier` configs.
- **Naming:**
  - Files: `kebab-case.ts` (e.g., `user-profile.component.tsx`, `auth.service.ts`).
  - Classes: `PascalCase`.
  - Variables/Functions: `camelCase`.

## 4. Commands Reference

- `pnpm dev` - Start all dev servers (API + Tauri desktop app with embedded Next.js frontend).
- `pnpm build` - Build all apps — compiles the API and produces the full Tauri desktop bundle.
- `pnpm check` - **Pre-push pipeline**: format check → lint → type-check → Next.js compile. Fast; no Rust compilation.
- `pnpm format` - Auto-fix formatting with Prettier across the monorepo.
- `pnpm lint` - Run ESLint across all packages.
- `pnpm type-check` - Run TypeScript compiler checks across all packages.
- `pnpm db:generate` - Regenerate Prisma Client after schema edits (required before `build`).
- `pnpm db:migrate` - Apply schema changes.
- `pnpm db:studio` - View database content.

> **Frontend-specific internals** (called by Tauri automatically — do not run directly):
>
> - `pnpm --filter @ingexpert/frontend next:dev` — starts the Next.js dev server (Tauri's `beforeDevCommand`).
> - `pnpm --filter @ingexpert/frontend next:build` — runs the Next.js static export (Tauri's `beforeBuildCommand`).

## 4b. Domain Inventory

| Domain    | API module   | Frontend feature       | Notes                                                |
| --------- | ------------ | ---------------------- | ---------------------------------------------------- |
| Auth      | `auth/`      | `features/auth/`       | Login only. No public registration.                  |
| Items     | `items/`     | `features/inventory/`  | PRODUCT, EQUIPMENT, TOOL, KIT. Stock via Decimal.    |
| Kits      | `kits/`      | (part of inventory UI) | Kit composition — items inside a kit.                |
| Movements | `movements/` | `features/movements/`  | CREATE-ONLY. EXIT validates stock. Tracks creatorId. |
| Projects  | `projects/`  | `features/projects/`   | Cannot delete if linked movements exist.             |
| Users     | `users/`     | `features/users/`      | Two-router architecture. `hasAuth` flag.             |

## 5. Shared Types in `packages/schema`

Each `[domain].schema.ts` file is divided into two explicit sections.

### Section 1 — DTOs (Zod schemas for tRPC input validation)

- **Named:** `[Action][Domain]Schema` (e.g., `CreateItemSchema`, `ItemPaginationSchema`)
- **Used as:** tRPC `.input(SomeSchema)` — Zod validates and coerces the payload at the API boundary at runtime.
- **Type exported as:** `type CreateItemDto = z.infer<typeof CreateItemSchema>`
- **Rule:** Only inputs need Zod. Never wrap API _response_ types in Zod — response types are never `.parse()`-d.
- **Forms:** The frontend extends the shared schema for UI-specific messages: `const FormSchema = CreateItemSchema.extend({ name: z.string().min(1, 'Required') })`. Type is still `CreateItemDto`.

### Section 2 — Entities (Prisma-derived TypeScript types)

- **Named:** `[Domain]Entity` (e.g., `ItemEntity`, `MovementEntity`)
- **Derived from:** The Prisma-generated model type from `@ingexpert/database` — the DB schema is the source of truth.
- **Patterns:**
  - No serialization overrides → `export type ProjectEntity = Project`
  - `Decimal` fields → `export type ItemEntity = Omit<Item, 'stock'> & { stock: number }`
  - `Date` fields (JSON-serialized) → `export type MovementEntity = Omit<Movement, 'date'> & { date: string }`
  - **Join/relation fields** → `export type UserEntity = User & { workArea: string | null }` (field flattened from the related `WorkArea` table; the service maps `staff?.workArea?.name ?? null`). New scalar columns added to `User` (e.g. `hasAuth`) are automatically included via the `User` base — no explicit override needed.
- **Safety guarantee:** Adding a new column to the Prisma schema causes a TypeScript error in the service's `mapXxx()` method until the mapping is updated. This is intentional — schema drift surfaces at compile time.
- **Mapping:** API services map `PrismaModel → Entity` via a private `mapXxx()` method before returning from tRPC procedures.
  - `null`-able optional fields (e.g. `String?`) are mapped as-is: `observations: item.observations ?? null`.
- **Frontend rule:** Always import entity types from `@ingexpert/schema`. Never declare local interfaces that duplicate the shape of API data.
- **tRPC inference:** When a service method returns `Promise<ItemEntity>`, tRPC infers the client-side call type automatically — no manual type annotation needed on the frontend.
