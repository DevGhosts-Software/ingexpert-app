## Context

The `openspec/` folder was set up for Ingexpert but never formally audited. During audit, three classes of issues were found:

1. **Stale/inaccurate claims** — `config.yaml` and `architecture.md` describe the project as "Offline-First" but no offline-first dependencies (PowerSync, service workers, workbox) exist anywhere in the codebase. Tauri 2 provides desktop packaging, which is not the same as offline-first data sync.

2. **Orphaned content in `api.md`** — Lines ~138–165 contain entity type and service mapper code examples under `### 1. Entity Type (in \`packages/schema\`)`but there is no parent`##`section heading. This content is structurally adrift and duplicates what is already fully covered in`schema.md`.

3. **Missing documentation** — The `openspec/decisions/` folder is empty (no ADRs despite several significant architectural decisions having been made), and there is no spec explaining how to maintain the openspec workspace itself.

This change is **documentation-only** — no code, no schema migrations, no API changes.

## Goals / Non-Goals

**Goals:**

- Remove false "Offline-First" label from all agent-facing context (config.yaml, architecture.md)
- Add Tauri to the monorepo layout diagram in `architecture.md`
- Remove or properly integrate the orphaned entity-type section in `api.md`
- Record foundational ADRs for decisions already made (tRPC, Supabase Auth, Tauri, Prisma)
- Create `openspec/specs/openspec-conventions.md` as a living reference for workspace maintenance

**Non-Goals:**

- Redesigning the openspec folder structure (flat `specs/*.md` layout stays as-is)
- Adding offline-first capability — that is a separate future feature decision
- Changing any TypeScript code, Prisma schema, or API behavior

## Decisions

### Keep flat spec files (don't migrate to `specs/<name>/spec.md` subdirectories)

The openspec `spec-driven` schema expects new capability specs to live in `specs/<capability>/spec.md` subdirectories. However, the existing satellite specs (`api.md`, `frontend.md`, etc.) are flat files already established in `specs/`. Migrating them would break all existing links, the `AGENTS.md` / `GEMINI.md` references, and agent-context loading order.

**Decision:** Keep existing flat specs as-is. Only new capability specs introduced by this or future changes will use the subdirectory pattern (e.g., `specs/openspec-conventions.md` flat, consistent with existing files).

**Alternative considered:** Migrate all to `specs/api/spec.md` — rejected because it would require updating all cross-references in `AGENTS.md`, `GEMINI.md`, architecture.md, and the custom instruction system prompt without meaningful benefit.

### Remove orphaned `api.md` section entirely (don't move it)

The orphaned entity-type and mapper examples in `api.md` are already fully covered in `schema.md` (Two-Track System, Entity Override Patterns) and `api.md` itself already has a "Database Interaction" section that covers `PrismaService` and `$transaction` usage.

**Decision:** Delete the orphaned fragment. Do not duplicate it elsewhere.

**Alternative considered:** Move it under a `## Serialization` heading in `api.md` — rejected because `schema.md` is the authoritative home for entity/mapper patterns, and duplicating it in `api.md` would create drift.

### Record ADRs for decisions already made

The four most impactful architectural decisions (tRPC, Supabase Auth, Tauri, Prisma) have no written rationale. When AI agents or new contributors encounter the stack, they have no context for why these choices were made.

**Decision:** Write four minimal ADRs now. Each follows the template already in `decisions/README.md` (Status / Context / Decision / Consequences).

## Risks / Trade-offs

- [Removing "Offline-First" from config.yaml] → No risk. The label was simply wrong. No code depends on it. All AI agent prompts will become more accurate.
- [Deleting orphaned api.md content] → Low risk of information loss — content already exists in schema.md. Worth doing to eliminate confusion about where the authoritative source is.
- [ADRs are retroactive] → Some nuance about the original decision-making context may be lost. Mitigation: write what is known with confidence; note unknowns explicitly.
