# OpenSpec Conventions — Ingexpert

This is the single source of truth for how the `openspec/` workspace is maintained. Read this before reorganising, renaming, or adding documentation to the openspec directory.

---

## Folder Roles

| Folder | Role |
|--------|------|
| `specs/` | Capability-based spec directories. One subdirectory per domain capability (`specs/<capability>/spec.md`). These are the living reference docs read by AI agents at the start of every task. |
| `changes/` | Active feature work managed by the openspec CLI. Each change lives in its own subdirectory (`changes/<name>/`) and contains `proposal.md`, `design.md`, `specs/`, and `tasks.md`. Do not manually edit these — use the CLI. |
| `decisions/` | Architecture Decision Records (ADRs). One file per significant architectural decision. Follow the template in `decisions/README.md`. |
| `changes/archive/` | Completed changes moved here after all tasks are done. Read-only historical record. |

---

## Spec File Naming and Structure

### Canonical capability specs (`specs/<capability>/spec.md`)

All specs live in `openspec/specs/<capability>/spec.md` using a kebab-case directory name. This layout is canonical — do not create flat `.md` files directly under `openspec/specs/`.

**Current capability specs:**

| Capability | Path | Covers |
|---|---|---|
| `core-architecture` | [`core-architecture/spec.md`](../core-architecture/spec.md) | Monorepo layout, commands, layered architecture, schema two-track system, frontend global patterns |
| `auth` | [`auth/spec.md`](../auth/spec.md) | JWT/JWKS, procedure guards, users module, `hasAuth`, permissions |
| `inventory` | [`inventory/spec.md`](../inventory/spec.md) | Items, kits, stock handling, bulk import, Excel mapping |
| `movements` | [`movements/spec.md`](../movements/spec.md) | Movement ledger, stock direction, kit expansion, role filters |
| `projects` | [`projects/spec.md`](../projects/spec.md) | Project management, delete restriction, managerId constraint |
| `openspec-conventions` | [`openspec-conventions/spec.md`](../openspec-conventions/spec.md) | This file — workspace maintenance rules |

**Rules:**
- Directory names are kebab-case.
- Every new capability MUST be linked in `core-architecture/spec.md`'s Domain Inventory table and in the table above.
- Modifying an existing spec is always preferred over creating a new one for the same concern.

### Delta specs (via openspec CLI changes)

When the openspec `spec-driven` schema generates capability specs for a change, they land in `changes/<name>/specs/<capability>/spec.md`. These are **change-scoped** — they document the delta (ADDED/MODIFIED/REMOVED requirements) for a feature, not the global truth. After the change is archived, the relevant rules are merged into the appropriate capability spec at `openspec/specs/<capability>/spec.md`.

---

## ADR Lifecycle

1. **Create** — Add a new file in `openspec/decisions/` following the `ADR-[NNN]-[short-title].md` naming pattern and the template in `decisions/README.md`.
2. **Register** — Add the ADR to the "Current decisions recorded here" section in `decisions/README.md`.
3. **Supersede** — If a decision is reversed, set the old ADR's Status to `Superseded by ADR-XXX` and create a new ADR for the new decision. Do not delete old ADRs.

**Required sections in every ADR:** Status, Context, Decision, Consequences.

---

## What Belongs Where

| I need to… | Where it goes |
|------------|---------------|
| Document a new architectural rule for a specific domain | Add to `openspec/specs/<capability>/spec.md` |
| Document a global/cross-cutting rule | Add to `openspec/specs/core-architecture/spec.md` |
| Record why a significant tech choice was made | Create a new ADR in `decisions/` |
| Track a new feature being built | Use `openspec propose` to start a change in `changes/` |
| Reference how the openspec workspace itself works | Here — `openspec/specs/openspec-conventions/spec.md` |
| Access historical feature specs | `openspec/changes/archive/` |

---

## AI Agent Guidance

- Always read `openspec/specs/core-architecture/spec.md` first — it is the mandatory entry point.
- Then read the capability spec(s) relevant to your task (e.g., `auth/spec.md` for user/auth work).
- When making an architectural decision, create an ADR in `decisions/` and update `decisions/README.md`.
- When restructuring documentation, read this file first to understand the intended structure before making changes.
- Do not place new spec files at the repo root or inside `apps/` — all documentation belongs under `openspec/`.
- Do not create flat `.md` files directly under `openspec/specs/` — always use the `<capability>/spec.md` pattern.
