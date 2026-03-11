## Context

The `openspec/specs/` folder currently holds six flat files: `api.md`, `architecture.md`, `database.md`, `frontend.md`, `schema.md`, and `openspec-conventions.md`. Each file slices the system horizontally by technical layer — API conventions, DB models, frontend patterns, etc. When an agent works on a domain feature (e.g., adding a movement type), it must read fragments from multiple files to collect all relevant rules.

The `spec-driven` schema already supports capability-based subdirectories (`specs/<capability>/spec.md`). This change fully adopts that layout, replacing the flat files with five vertical capability specs — one per business domain.

## Goals / Non-Goals

**Goals:**
- Migrate all content from the six flat spec files into five capability-based `spec.md` files
- Add an explicit `openapi.json` source-of-truth clause to every domain capability spec
- Update all agent entry points (`AGENTS.md`, `GEMINI.md`, system-prompt) to reference the new paths
- Update `openspec-conventions.md` (moved to `specs/openspec-conventions/spec.md`) to document the new canonical structure
- Delete the empty `openspec/features/` directory (README-only, no value)

**Non-Goals:**
- Changing any TypeScript code, Prisma schema, or API behavior
- Redesigning the domain boundaries (same 5 capabilities as proposed)
- Adding new rules or changing existing requirements — content migrates verbatim, except for the `openapi.json` clause and structural edits

## Decisions

### Content assignment to capabilities

| Source section | Target capability |
|---|---|
| `architecture.md` — monorepo layout, commands, feature order, domain inventory, key rules | `core-architecture` |
| `api.md` — module structure, procedure types, layered architecture, DB interaction, bulk ops, OpenAPI integration | `core-architecture` |
| `database.md` — schema update workflow, serialization, relation constraints, seed, best practices | `core-architecture` |
| `schema.md` — two-track system, file structure, naming conventions, entity override patterns, build note | `core-architecture` |
| `frontend.md` — Container/Presenter pattern, file naming, type rules, cache invalidation, debouncing, forms, shadcn rules, sidebar active state | `core-architecture` |
| `api.md` — authentication (JWT, JWKS, guards), users module (two-router, hasAuth, permission matrix) | `auth` |
| `schema.md` — auth and user schemas/entities | `auth` |
| `frontend.md` — role-based UI (`useIsAdmin`), `UserProfileSheet`, navbar | `auth` |
| `api.md` — items and kits modules | `inventory` |
| `database.md` — `Item` model, `ItemType` enum, Kit composition | `inventory` |
| `schema.md` — item and kit schemas | `inventory` |
| `frontend.md` — inventory table conventions, KIT placeholders, Excel type mapping, WorkAreaCombobox | `inventory` |
| `api.md` — movements module (business rules, stock direction, kit expansion, role filters) | `movements` |
| `database.md` — `Movement`, `MovementDetail` models, `MovementType` enum | `movements` |
| `schema.md` — movement schemas | `movements` |
| `frontend.md` — movement form card picker, movement detail sheet | `movements` |
| `database.md` — `Project` model | `projects` |
| `schema.md` — project schemas | `projects` |
| `frontend.md` — project UI (implied from domain inventory) | `projects` |

**Alternative considered:** Keep `users` as a separate capability — rejected because Users is entirely auth-infrastructure in this system (Supabase Auth coupling, `hasAuth` lifecycle, permission matrix). Separating it creates a thin spec with content that cannot be understood without the auth context.

**Alternative considered:** Keep `core-architecture` as a single `architecture.md` entry point that links to other specs — rejected because it recreates the horizontal slicing problem. A single `spec.md` per capability makes context retrieval O(1) for an agent: "I'm working on movements → read `movements/spec.md`."

### openapi.json clause placement

Each capability spec SHALL open with a boxed "Source of Truth" section:

```
> **Source of Truth**: Before implementing any route, hook, or data model for this domain,
> read `openapi/openapi.json` for the exact endpoint shapes, request/response schemas, and auth requirements.
```

This is a normative requirement, not a suggestion, and must appear in every domain spec (`auth`, `inventory`, `movements`, `projects`). `core-architecture` carries the global definition of this rule.

**Alternative considered:** One global rule in `core-architecture` only — rejected because agents read the domain spec in isolation; the reminder must be local to have effect.

### Entry point after migration

`AGENTS.md` and `GEMINI.md` must update their "start here" pointer from `openspec/specs/architecture.md` to `openspec/specs/core-architecture/spec.md`. The satellite specs table in `architecture.md` is deleted with the file; `core-architecture/spec.md` becomes self-contained.

`GEMINI.md`'s explicit file list (api.md, frontend.md, schema.md, database.md) must be replaced with the five capability paths.

### openspec-conventions migration

`openspec/specs/openspec-conventions.md` must move to `openspec/specs/openspec-conventions/spec.md` (consistent with new layout). Its content about flat specs being "stable" is superseded. The new version documents capability subdirectories as the canonical structure.

## Risks / Trade-offs

- [System-prompt custom instruction still references `architecture.md`] → The system prompt is managed outside the repo (in Copilot CLI settings). The implementer must manually update it after this change lands, or agent context loading will break silently.
- [All existing change archives reference flat spec paths] → Archived changes reference the old flat file paths in their delta specs. These are historical records and do not need updating — they are read-only.
- [Stale IDE/editor bookmarks and cross-references] → Any links in markdown files outside `openspec/` pointing to the old flat spec paths will 404. Mitigation: the task list includes a grep step to find all references before deleting.
