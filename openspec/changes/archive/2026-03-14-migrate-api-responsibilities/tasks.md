## 1. Build migration control surface

- [x] 1.1 Add a migration registry and per-procedure rollout metadata in `apps/frontend/src/lib/` (new module) using the audited procedure set from `openspec/changes/archive/2026-03-13-audit-frontend-trpc-api-usage/files/trpc-usage-matrix.json`.
- [x] 1.2 Add runtime feature flags for `observe`, `dual-run`, `cutover`, and `rollback` phases in `apps/frontend/src/lib/` and wire them into dashboard/admin/inventory/project read containers.
- [x] 1.3 Add parity telemetry event helpers in `apps/frontend/src/lib/` and integrate emission points in migrated read hooks/components.

## 2. Migrate low-risk read procedures first

- [x] 2.1 Replace `trpc.users.listNames.useQuery` usage in `apps/frontend/src/features/projects/components/project-form-sheet.tsx` with local-first PowerSync/SQLite read logic that preserves existing UI behavior.
- [x] 2.2 Replace `trpc.adminUsers.getWorkAreas.useQuery` usages in `apps/frontend/src/app/(dashboard)/admin/users/page.tsx`, `apps/frontend/src/features/users/components/user-create-sheet.tsx`, and `apps/frontend/src/features/users/components/user-edit-sheet.tsx` with local-first reads plus API fallback flags.
- [x] 2.3 Replace `trpc.kits.getComponents.useQuery` usages in `apps/frontend/src/features/inventory/components/item-details-sheet.tsx` and `apps/frontend/src/features/inventory/components/item-form-sheet.tsx` with local-first reads and rollback switch support.

## 3. Implement stats dual-run parity gates

- [x] 3.1 Introduce shared stats parity comparator utilities in `apps/frontend/src/features/**/` (or shared `lib/`) for `items.getStats`, `movements.getStats`, `projects.getStats`, and `adminUsers.getStats`.
- [x] 3.2 Update `apps/frontend/src/app/(dashboard)/page.tsx` to run dual-read comparison (local + API) for stats procedures and log field-level parity results without changing visible output during observe/dual-run.
- [x] 3.3 Update `apps/frontend/src/app/(dashboard)/admin/users/page.tsx` to dual-run `adminUsers.getStats` parity with admin-role guard and rollback behavior.

## 4. Execute cutover and API simplification

- [x] 4.1 Switch approved stats reads in `apps/frontend/src/app/(dashboard)/page.tsx` and `apps/frontend/src/app/(dashboard)/admin/users/page.tsx` to local-primary mode once parity acceptance criteria are met.
- [x] 4.2 Keep and verify API ownership for auth/session and authority writes in `apps/api/src/auth/*`, `apps/api/src/users/*`, `apps/api/src/items/*`, `apps/api/src/kits/*`, `apps/api/src/projects/*`, and `apps/api/src/movements/*` (no authority-boundary regression).
- [x] 4.3 Resolve contract governance for retained or intentionally private procedures by updating OpenAPI metadata/router outputs in `apps/api/src/**/*.router.ts` and regenerating `apps/api/openapi/openapi.json`.

## 5. Update specs and validate

- [x] 5.1 Update `openspec/specs/api-footprint-audit/spec.md`, `openspec/specs/core-architecture/spec.md`, `openspec/specs/inventory/spec.md`, `openspec/specs/movements/spec.md`, `openspec/specs/projects/spec.md`, and `openspec/specs/auth/spec.md` to reflect completed migration behavior and boundaries.
- [x] 5.2 Run `pnpm check` at repository root and resolve any issues introduced by migration changes.
