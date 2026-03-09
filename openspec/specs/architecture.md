# Architecture Spec — Ingexpert

## Purpose
This document is the mandatory starting point for any AI agent generating code, routes, or data models for this project. Read it before writing a single line.

## API Contract (Source of Truth)

The file **`openapi/openapi.json`** is auto-generated at server startup by `trpc-to-openapi` and served at `GET /openapi.json`. It reflects the **exact, current shape** of every endpoint including:
- HTTP method + path
- Request body / query parameter schema
- Response schema (typed Zod output schemas)
- Authentication requirements (Bearer JWT via Supabase RS256/JWKS)

**Rule:** When generating frontend data-fetching hooks, new backend routes, or new data models, always cross-reference `openapi/openapi.json` to avoid schema drift and type mismatches.

## Monorepo Layout

```
ingexpert-app/
├── apps/
│   ├── api/          NestJS 11 + tRPC — backend, all DB writes
│   └── frontend/     Next.js + React 19 — UI, reads via tRPC only
├── packages/
│   ├── schema/       Shared Zod DTOs + Prisma-derived entity types
│   └── database/     Prisma ORM client + generated types
└── openspec/         This workspace
```

## Feature Implementation Order

When adding a new domain feature, always follow this order:

1. **Prisma schema** (`packages/database/prisma/schema/`) — define the new model
2. **`pnpm db:generate`** — regenerate the Prisma client
3. **`packages/schema/src/[domain].schema.ts`** — add Zod DTOs + Prisma-derived entity types + Zod output schemas
4. **`apps/api/src/[domain]/`** — NestJS service + tRPC router (import schemas from `@ingexpert/schema`)
5. **`apps/frontend/src/features/[domain]/`** — page container + feature components using tRPC hooks
6. **`pnpm check`** — format, lint, type-check, Next.js build must all pass

## Domain Inventory

| Domain       | API Router         | Frontend Feature      | Notes                                              |
|--------------|--------------------|-----------------------|----------------------------------------------------|
| auth         | `auth/`            | `features/auth/`      | Login only. No public registration.                |
| items        | `items/`           | `features/inventory/` | PRODUCT, EQUIPMENT, TOOL, KIT. Stock via Decimal.  |
| kits         | `kits/`            | (part of inventory)   | Kit composition. Only PRODUCT and TOOL as components. |
| movements    | `movements/`       | `features/movements/` | CREATE-ONLY audit log. Stock-validating.           |
| projects     | `projects/`        | `features/projects/`  | Linked to movements via FK.                        |
| users        | `users/` + `admin-users/` | `features/users/` | Two-router arch. `hasAuth` flag.              |

## Key Rules for AI Agents

- **No `any`** — TypeScript strict mode is enforced.
- **DTOs in `packages/schema`** — never define Zod schemas inside routers.
- **Entity types are Prisma-derived** — never create duplicate local interfaces on the frontend.
- **Frontend reads via tRPC only** — no direct DB access or REST calls.
- **Stock mutations** — must use Prisma `$transaction`.
- **Output schemas** — every tRPC procedure with OpenAPI metadata has a `.output()` Zod schema. Match it exactly in any new procedure.
