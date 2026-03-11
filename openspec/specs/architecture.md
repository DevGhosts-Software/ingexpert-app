# Architecture Spec — Ingexpert

## Purpose
This document is the mandatory starting point for any AI agent generating code, routes, or data models for this project. Read it before writing a single line.

---

## API Contract (Source of Truth)

The file **`openapi/openapi.json`** is auto-generated at server startup by `trpc-to-openapi` and served at `GET /openapi.json`. It reflects the **exact, current shape** of every endpoint:
- HTTP method + path
- Request body / query parameter schema
- Response schema (Zod `.output()` schemas)
- Authentication requirements (Bearer JWT, Supabase RS256/JWKS)

**Rule:** Before generating any frontend hook, backend route, or data model — cross-reference `openapi/openapi.json` to avoid schema drift and type mismatches.

---

## Monorepo Layout

```
ingexpert-app/
├── apps/
│   ├── api/          NestJS 11 + tRPC — backend, all DB writes
│   └── frontend/     Next.js + React 19 — UI, reads via tRPC only
│       └── src-tauri/  Tauri 2 desktop configuration (native packaging)
├── packages/
│   ├── schema/       Shared Zod DTOs + Prisma-derived entity types
│   └── database/     Prisma ORM client + generated types
└── openspec/         This workspace (specs live here)
```

---

## Commands Reference

| Command | Purpose |
|---|---|
| `pnpm dev` | Start API + Tauri desktop app (embeds Next.js) |
| `pnpm build` | Build everything (API + Tauri native bundle) |
| `pnpm check` | **Pre-push pipeline**: format check → lint → type-check → Next.js build |
| `pnpm format` | Auto-fix Prettier formatting |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm type-check` | Run `tsc --noEmit` across all packages |
| `pnpm db:generate` | Regenerate Prisma Client after schema changes |
| `pnpm db:migrate` | Apply pending DB migrations |
| `pnpm db:studio` | Open Prisma Studio |

> `pnpm --filter @ingexpert/frontend next:dev` and `next:build` are called automatically by Tauri — do not run them directly.

---

## Feature Implementation Order

When adding a new domain feature, follow this order **strictly**:

1. **Prisma schema** — edit `packages/database/prisma/schema/*.prisma`
2. **`pnpm db:generate`** — regenerate the Prisma client
3. **`packages/schema/src/[domain].schema.ts`** — add Zod DTOs + Prisma-derived entity types + Zod output schemas
4. **`apps/api/src/[domain]/`** — NestJS service + tRPC router (import all schemas from `@ingexpert/schema`)
5. **`apps/frontend/src/features/[domain]/`** — page container + feature components via tRPC hooks
6. **`pnpm check`** — all checks must pass before committing

---

## Domain Inventory

| Domain    | API module         | Frontend feature       | Notes |
|-----------|--------------------|------------------------|-------|
| Auth      | `auth/`            | `features/auth/`       | Login only. No public registration. |
| Items     | `items/`           | `features/inventory/`  | PRODUCT, EQUIPMENT, TOOL, KIT. Stock via Decimal. KITs have no stock or location. |
| Kits      | `kits/`            | (part of inventory UI) | Composition — only PRODUCT and TOOL can be components. |
| Movements | `movements/`       | `features/movements/`  | CREATE-ONLY audit log. PURCHASE/RETURN increment stock; EXIT/WRITEOFF decrement. Role-filtered. |
| Projects  | `projects/`        | `features/projects/`   | Cannot delete if linked movements exist. `managerId` → FK to `User`. |
| Users     | `users/` + `admin-users/` | `features/users/` | Two-router architecture. `hasAuth` flag. |

---

## Key Rules for AI Agents

- **No `any`** — TypeScript strict mode enforced everywhere.
- **DTOs in `packages/schema`** — never define Zod schemas inside routers.
- **Entity types are Prisma-derived** — never create duplicate local interfaces on the frontend.
- **Frontend reads via tRPC only** — no direct DB access, no direct REST calls.
- **Stock mutations** — must use Prisma `$transaction`.
- **Output schemas** — every tRPC procedure with OpenAPI metadata has a `.output()` Zod schema. Match it exactly in any new procedure.
- **No `// TODO` or `// FIXME`** — implement the solution fully or define the interface clearly.

---

## Satellite Specs

| Spec | Covers |
|------|--------|
| [`api.md`](./api.md) | NestJS module structure, auth, movement rules, user permissions, bulk ops |
| [`frontend.md`](./frontend.md) | Container/Presenter pattern, type rules, cache invalidation, debouncing, UI conventions |
| [`schema.md`](./schema.md) | Two-track type system, DTO/Entity patterns, naming conventions |
| [`database.md`](./database.md) | Prisma models, data types, schema update workflow, seed |
| [`openspec-conventions.md`](./openspec-conventions.md) | OpenSpec workspace structure: folder roles, spec naming, ADR lifecycle, what belongs where |
