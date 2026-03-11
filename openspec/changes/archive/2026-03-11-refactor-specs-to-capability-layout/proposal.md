## Why

The current `openspec/specs/` folder uses a flat, concern-oriented layout (`api.md`, `frontend.md`, `schema.md`, etc.) that cuts horizontally across all domains — making it hard for an AI agent working on a single domain to know which sections of which files are relevant to it. Migrating to vertical, capability-based subdirectories (`specs/<capability>/spec.md`) co-locates all rules for a domain in one file, directly aligning the spec workspace with how the code is organised and how agents are tasked.

## What Changes

- **BREAKING — Delete flat specs** — `openspec/specs/api.md`, `architecture.md`, `database.md`, `frontend.md`, `schema.md` are removed and their content redistributed into capability spec files
- **BREAKING — Update agent entry points** — `AGENTS.md`, `GEMINI.md`, and the system-prompt custom instruction all hard-link to the old flat files; all references must be updated to point to the new capability paths
- **Create 5 capability spec directories** — each containing a `spec.md` with all rules relevant to that domain, sourced from the old flat files:
  - `openspec/specs/core-architecture/spec.md` — global monorepo layout, commands, feature implementation order, layered architecture, tRPC/Prisma/Tauri rules, schema two-track system, frontend global patterns (Container/Presenter, type rules, forms, shadcn), openapi.json as source of truth
  - `openspec/specs/auth/spec.md` — JWT validation, Supabase JWKS, procedure guards (`protectedProcedure`, `adminProcedure`), Users two-router architecture, `hasAuth` flag, permission matrix, user schemas
  - `openspec/specs/inventory/spec.md` — Items and Kits domain: CRUD rules, `ItemType` enum, stock Decimal handling, Kit expansion logic, Excel import, item table UI conventions, KIT row placeholders, Excel type mapping
  - `openspec/specs/movements/spec.md` — Movement ledger: create-only immutability, stock direction rules, Kit expansion in transactions, role-based filters security boundary, Movement schemas, movement form card picker, detail sheet UI
  - `openspec/specs/projects/spec.md` — Project management: `onDelete: Restrict` guard, `managerId` FK constraint, project schemas, project UI
- **Add `openapi.json` clause to every capability spec** — each domain spec explicitly states that `openapi/openapi.json` is the strict source of truth for all endpoint shapes, request/response contracts, and authentication requirements for that domain
- **Update `openspec-conventions.md`** — replace the "flat specs are stable, do not migrate" rule with the new capability-based structure convention
- **Delete `openspec/features/` directory** — currently empty (README only); its intended role is superseded by the capability-based spec structure
- **Update `config.yaml` context block** — remove stale references to flat spec file names; the context should describe capabilities, not files

## Capabilities

### New Capabilities

- `core-architecture`: Global monorepo structure, dev commands, feature implementation order, tRPC layered architecture, Prisma DB interaction patterns, schema two-track system (DTOs + Entities), frontend Container/Presenter pattern, type rules, forms, shadcn/ui conventions, and the `openapi.json`-as-source-of-truth rule
- `auth`: Authentication and user management — Supabase RS256/JWKS JWT validation, tRPC procedure guards, Users two-router architecture, `hasAuth` flag lifecycle, permission matrix, user and auth Zod schemas/entities
- `inventory`: Items and Kits domain — `ItemType` enum rules, Decimal stock handling, Kit composition logic, bulk import pattern, item entity/DTO schemas, frontend inventory table conventions, Excel type mapping
- `movements`: Movement ledger — create-only immutability contract, stock direction by `MovementType`, Kit expansion in transactions, role-based filter security boundary, movement schemas, frontend movement form and detail sheet
- `projects`: Project management — `managerId` FK requirement, `onDelete: Restrict` pre-check pattern, project schemas, frontend project UI

### Modified Capabilities

- `openspec-conventions`: The "flat specs are intentional and stable — do not migrate to subdirectories" rule is **superseded** by this change; the spec must be updated to document the new capability-based layout as the canonical structure

## Impact

- **No code changes** — this is a documentation-only migration
- `AGENTS.md`, `GEMINI.md`, and the system-prompt custom instruction all contain hard-coded paths to the old flat files; all must be updated
- `openspec/specs/architecture.md` Satellite Specs table becomes obsolete — `core-architecture/spec.md` becomes the new entry-point anchor
- `openspec-conventions.md` contradicts this change explicitly and must be updated in the same task list
- After migration, AI agents get targeted, domain-scoped context instead of needing to scan 5+ files for rules relevant to one feature
