## Why

The openspec folder was bootstrapped but never audited against the actual codebase. Several specs contain inaccurate claims (e.g. "Offline-First" label when no offline-first tech is present), `api.md` has orphaned/leaked content with no section header, and the `architecture.md` monorepo layout omits Tauri entirely. Additionally, zero ADRs have been recorded despite significant architectural decisions having been made, and there is no spec documenting how the openspec workspace itself should be maintained.

## What Changes

- **Fix `api.md`** — remove orphaned entity-type/mapper fragment (lines ~138–165) that has no parent section header; the content duplicates `schema.md` and creates confusion about where serialization rules live
- **Fix `architecture.md`** — add `src-tauri/` to the monorepo layout; remove the aspirational "Offline-First" label from the intro (no PowerSync, service workers, or offline-first dependencies exist in the codebase)
- **Fix `config.yaml`** — remove "Offline-First" from the project description string to keep context truthful for AI agents
- **Add `openspec/specs/openspec-conventions.md`** — new spec defining how the openspec workspace is maintained: file naming, folder roles, lifecycle, and what belongs where
- **Add four foundational ADRs** in `openspec/decisions/`:
  - `ADR-001-trpc-over-rest.md` — why tRPC instead of a plain REST API
  - `ADR-002-supabase-auth.md` — why Supabase Auth (RS256 JWKS) over custom JWT
  - `ADR-003-tauri-desktop.md` — why Tauri for desktop packaging instead of Electron
  - `ADR-004-prisma-orm.md` — why Prisma as the ORM and PostgreSQL as the database

## Capabilities

### New Capabilities

- `openspec-conventions`: Living reference spec for how the openspec workspace itself is structured and maintained — folder roles, artifact lifecycle, naming rules, and guidance for AI agents on where to place new documentation

### Modified Capabilities

- `api`: Orphaned entity-type/serialization section (no parent heading) will be removed; that content belongs entirely in `schema.md` which already covers it
- `architecture`: Monorepo layout diagram is incomplete (Tauri omitted); "Offline-First" label is misleading and will be removed

## Impact

- No code changes — this change is documentation-only
- `config.yaml` context field is consumed by every AI agent via openspec; fixing "Offline-First" removes a misleading signal from all future agent prompts
- Fixes `api.md` confusion that could cause agents to define entity-type mappings in the wrong layer
- ADRs capture rationale for decisions that have already been made; no behavioral changes
- New `openspec-conventions.md` spec gives both humans and AI agents a single place to understand how to maintain the openspec workspace
