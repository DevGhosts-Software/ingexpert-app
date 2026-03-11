# OpenSpec Conventions — Ingexpert

This is the single source of truth for how the `openspec/` workspace is maintained. Read this before reorganising, renaming, or adding documentation to the openspec directory.

---

## Folder Roles

| Folder | Role |
|--------|------|
| `specs/` | Flat architectural spec files. One file per cross-cutting concern (`api.md`, `frontend.md`, `schema.md`, etc.). These are the living reference docs read by AI agents at the start of every task. |
| `changes/` | Active feature work managed by the openspec CLI. Each change lives in its own subdirectory (`changes/<name>/`) and contains `proposal.md`, `design.md`, `specs/`, and `tasks.md`. Do not manually edit these — use the CLI. |
| `decisions/` | Architecture Decision Records (ADRs). One file per significant architectural decision. Follow the template in `decisions/README.md`. |
| `features/` | Reserved for feature-level documentation that doesn't fit a single change or a cross-cutting spec. |
| `archive/` | Completed changes moved here by the openspec CLI after all tasks are done. Read-only historical record. |

---

## Spec File Naming and Structure

### Existing flat specs (`specs/*.md`)

The canonical satellite specs (`api.md`, `frontend.md`, `schema.md`, `database.md`, `architecture.md`) are flat files at `openspec/specs/<name>.md`. This layout is intentional and stable — do not migrate to subdirectories.

**Rules:**
- File names are kebab-case (e.g., `openspec-conventions.md`).
- Every new cross-cutting spec MUST be linked in the Satellite Specs table in `architecture.md`.
- Modifying an existing spec is always preferred over creating a new one for the same concern.

### New capability specs (via openspec CLI)

When the openspec `spec-driven` schema generates capability specs for a change, they land in `changes/<name>/specs/<capability>/spec.md`. These are **change-scoped** — they document the delta for a feature, not the global truth. After the change is archived, the relevant rules are merged into the appropriate flat spec.

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
| Document a new architectural rule that affects all agents | Add to the relevant flat spec in `specs/` |
| Record why a significant tech choice was made | Create a new ADR in `decisions/` |
| Track a new feature being built | Use `openspec propose` to start a change in `changes/` |
| Reference how the openspec workspace itself works | Here — `openspec/specs/openspec-conventions.md` |
| Access historical feature specs | `openspec/archive/` |

---

## AI Agent Guidance

- Always read `openspec/specs/architecture.md` first — it links to all satellite specs.
- When making an architectural decision, create an ADR in `decisions/` and update `decisions/README.md`.
- When restructuring documentation, read this file first to understand the intended structure before making changes.
- Do not place new spec files at the repo root or inside `apps/` — all documentation belongs under `openspec/`.
