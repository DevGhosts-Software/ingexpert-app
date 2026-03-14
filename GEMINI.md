---
trigger: always_on
---

# Ingexpert — AI Agent Entry Point

> **Read the specs before writing any code.**
> All architecture, conventions, and domain rules live in **`openspec/specs/`**.

## Context Loading Order

1. **[`openspec/specs/core-architecture/spec.md`](./openspec/specs/core-architecture/spec.md)** — monorepo layout, commands, feature flow, layered architecture, schema two-track system, frontend global patterns, key rules.
2. **Capability specs** (read only the ones relevant to your task):
   - [`auth/spec.md`](./openspec/specs/auth/spec.md) — JWT/JWKS, procedure guards, users module, `has_auth`, permission matrix
   - [`inventory/spec.md`](./openspec/specs/inventory/spec.md) — items, kits, stock handling, bulk import, Excel mapping
   - [`movements/spec.md`](./openspec/specs/movements/spec.md) — movement ledger, stock direction, kit expansion, role filters
   - [`projects/spec.md`](./openspec/specs/projects/spec.md) — project management, delete restriction, managerId constraint
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
