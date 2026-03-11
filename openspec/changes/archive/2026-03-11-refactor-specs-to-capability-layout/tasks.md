## 1. Pre-Migration Audit

- [x] 1.1 Grep the entire repo for all references to the flat spec paths

## 2. Create Capability Spec Files

- [x] 2.1 Create `openspec/specs/core-architecture/spec.md`

- [x] 2.2 Create `openspec/specs/auth/spec.md`

- [x] 2.3 Create `openspec/specs/inventory/spec.md`

- [x] 2.4 Create `openspec/specs/movements/spec.md`

- [x] 2.5 Create `openspec/specs/projects/spec.md`

## 3. Update openspec-conventions

- [x] 3.1 Create `openspec/specs/openspec-conventions/spec.md`

## 4. Update Agent Entry Points

- [x] 4.1 Update `AGENTS.md` — change the "start with" pointer from `openspec/specs/architecture.md` to `openspec/specs/core-architecture/spec.md`

- [x] 4.2 Update `GEMINI.md` — replace the Context Loading Order section: change entry-point link from `openspec/specs/architecture.md` to `openspec/specs/core-architecture/spec.md`; replace the satellite specs bullet list (api.md, frontend.md, schema.md, database.md) with the five capability paths: `core-architecture/spec.md`, `auth/spec.md`, `inventory/spec.md`, `movements/spec.md`, `projects/spec.md`

- [x] 4.3 Manually update the Copilot CLI system-prompt custom instruction (stored in CLI settings, not in the repo) — replace `openspec/specs/architecture.md` and the flat spec list with the new capability paths after this change is merged

## 5. Update openspec Config

- [x] 5.1 Review `openspec/config.yaml` context block — if it references any flat spec file names or the Satellite Specs concept, update to reflect the new capability-based layout (the context block describes the tech stack and domain inventory, not file paths, so this may be a no-op)

## 6. Delete Old Flat Spec Files

- [x] 6.1 Delete `openspec/specs/api.md`
- [x] 6.2 Delete `openspec/specs/architecture.md`
- [x] 6.3 Delete `openspec/specs/database.md`
- [x] 6.4 Delete `openspec/specs/frontend.md`
- [x] 6.5 Delete `openspec/specs/schema.md`
- [x] 6.6 Delete `openspec/specs/openspec-conventions.md` (content migrated to `openspec/specs/openspec-conventions/spec.md`)

## 7. Remove Obsolete Directories

- [x] 7.1 Delete `openspec/features/` directory and its `README.md` (role superseded by `openspec/changes/` and `openspec/changes/archive/`)

## 8. Verify

- [x] 8.1 Confirm all 5 capability spec directories exist with `spec.md` files: `core-architecture/`, `auth/`, `inventory/`, `movements/`, `projects/`
- [x] 8.2 Confirm `openspec/specs/openspec-conventions/spec.md` exists and references the capability-based layout as canonical
- [x] 8.3 Confirm `AGENTS.md` links to `core-architecture/spec.md`, not `architecture.md`
- [x] 8.4 Confirm `GEMINI.md` lists all 5 capability paths and no flat spec paths
- [x] 8.5 Confirm `openspec/specs/` contains zero flat `.md` files (only subdirectories)
- [x] 8.6 Confirm `openspec/features/` no longer exists
- [x] 8.7 Re-run the grep from task 1.1 and confirm zero remaining references to the old flat spec paths in active files (only expected hits in `openspec/changes/` historical artifacts)
