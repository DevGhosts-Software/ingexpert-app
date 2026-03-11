## 1. Fix config.yaml — Remove "Offline-First" Label

- [x] 1.1 In `openspec/config.yaml`, change `"Ingexpert — Corporate Stock Management System (Offline-First, Admin-Only registration)"` to `"Ingexpert — Desktop-First Corporate Stock Management System (Admin-Only registration)"`

## 2. Fix architecture.md — Layout + "Offline-First" Claim

- [x] 2.1 In `openspec/specs/architecture.md`, update the project description (intro sentence or Purpose section) to remove "Offline-First" — use "Desktop-First" instead
- [x] 2.2 In `openspec/specs/architecture.md`, add `src-tauri/` to the monorepo layout diagram under `apps/frontend/`, with a note that it contains the Tauri 2 desktop configuration

## 3. Fix api.md — Remove Orphaned Content

- [x] 3.1 In `openspec/specs/api.md`, delete the orphaned fragment that starts at `### 1. Entity Type (in \`packages/schema\`)` (approximately lines 138–165) — this includes the entity type example, the service mapper example, and the "Safety guarantee" note. The `---` separator line before it should also be removed.

## 4. Create openspec Conventions Spec

- [x] 4.1 Create `openspec/specs/openspec-conventions.md` documenting the workspace structure: folder roles (`specs/`, `changes/`, `decisions/`, `features/`, `archive/`), flat vs subdirectory spec naming, ADR lifecycle, and what belongs where
- [x] 4.2 Add `openspec-conventions.md` to the Satellite Specs table in `openspec/specs/architecture.md`

## 5. Create Foundational ADRs

- [x] 5.1 Create `openspec/decisions/ADR-001-trpc-over-rest.md` — document why tRPC was chosen over a plain REST API (end-to-end type safety, OpenAPI generation via trpc-to-openapi, single source of truth for input/output schemas)
- [x] 5.2 Create `openspec/decisions/ADR-002-supabase-auth.md` — document why Supabase Auth with RS256 JWKS was chosen (managed auth, no shared secret, Admin API for user lifecycle, PostgreSQL triggers for user profile sync)
- [x] 5.3 Create `openspec/decisions/ADR-003-tauri-desktop.md` — document why Tauri 2 was chosen for desktop packaging over Electron (smaller binary size, Rust-based webview, no bundled Chromium, native OS APIs)
- [x] 5.4 Create `openspec/decisions/ADR-004-prisma-orm.md` — document why Prisma was chosen as the ORM (type-safe client generation, migrations, PostgreSQL support, Decimal type handling)
- [x] 5.5 Update `openspec/decisions/README.md` — add the four new ADRs to the "Current decisions recorded here" section

## 6. Verify

- [x] 6.1 Confirm all cross-references in `architecture.md` satellite specs table are valid (all linked `.md` files exist)
- [x] 6.2 Confirm `api.md` no longer contains the orphaned entity-type fragment
- [x] 6.3 Confirm `config.yaml` no longer says "Offline-First"
