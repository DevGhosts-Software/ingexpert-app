---
trigger: always_on
---

# Ingexpert — AI Agent Entry Point

> **Read the specs before writing any code.**
> All architecture, conventions, and domain rules live in **`openspec/specs/`**.

## Context Loading Order

1. **[`openspec/specs/architecture.md`](./openspec/specs/architecture.md)** — monorepo layout, commands, feature flow, domain inventory, key rules.
2. **Satellite specs** (read only the ones relevant to your task):
   - [`api.md`](./openspec/specs/api.md) — NestJS module structure, auth, movements, users, bulk ops
   - [`frontend.md`](./openspec/specs/frontend.md) — Container/Presenter, type rules, cache, UI conventions
   - [`schema.md`](./openspec/specs/schema.md) — Two-track type system, naming, entity patterns
   - [`database.md`](./openspec/specs/database.md) — Prisma models, serialization, constraints, seed
3. **[`openapi/openapi.json`](./openapi/openapi.json)** — exact endpoint shapes (generated at API startup).

## Operational Standards

### Think-Code-Verify Loop

1. **Context:** State which architectural patterns apply before coding.
2. **Implement:** Follow the layered architecture in the specs.
3. **Verify:** Run `pnpm check` (format + lint + type-check + Next.js build).
4. **Format:** Run `pnpm format`.

## Hard Rules

- No `any`. TypeScript strict mode is enforced everywhere.
- Never define Zod schemas inside routers — import from `@ingexpert/schema`.
- Never create local interfaces that duplicate API entity shapes — import from `@ingexpert/schema`.
- Frontend reads via tRPC only — no direct DB access.
- Stock mutations must use `prisma.\`.
- No `// TODO` or `// FIXME` — implement fully or define the interface clearly.
- **Living docs:** After any major architectural decision, update the relevant `openspec/specs/` file.
