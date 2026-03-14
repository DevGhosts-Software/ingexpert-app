## 1. Build phase-2 retention matrix and migration baseline

- [x] 1.1 Audit current frontend runtime tRPC usage in `apps/frontend/src/**/*.ts*` and produce a phase-2 retention matrix artifact under `openspec/changes/cutdown-api-auth-frontend-phase2/files/`.
- [x] 1.2 Cross-check matrix decisions against `apps/api/openapi/openapi.json` and enumerate exact removal/retain targets in `apps/api/src/**/*.router.ts` and `apps/api/src/**/services/*.service.ts`.

## 2. Migrate auth authority to frontend Supabase flows

- [x] 2.1 Implement frontend Supabase auth/session authority in `apps/frontend/src/features/auth/**`, `apps/frontend/src/components/providers/**`, and related auth guard hooks to replace API `auth.*` usage.
- [x] 2.2 Add required Supabase CLI/config alignment and environment wiring for frontend auth authority in project config/scripts (`apps/frontend/**`, root scripts/env docs as applicable).
- [x] 2.3 Remove API auth procedure dependencies from frontend call sites (`apps/frontend/src/**`) and update role/session bootstrap behavior to preserve RBAC outcomes.

## 3. Migrate easy non-admin endpoints and local-only export

- [ ] 3.1 Migrate project and other easy non-admin endpoint dependencies to frontend local/Supabase execution in `apps/frontend/src/features/projects/**` and any impacted feature modules.
- [x] 3.2 Implement/confirm local-only export path from synchronized local DB in `apps/frontend/src/features/inventory/**` and remove unnecessary API dependency for export.

## 4. Retire non-admin API endpoints and regenerate contracts

- [x] 4.1 Delete remove-ready non-admin API procedures and coupled service logic in `apps/api/src/auth/*.router.ts`, `apps/api/src/auth/*.service.ts`, and other matrix-marked modules while preserving admin procedures.
- [x] 4.2 Regenerate OpenAPI and verify retained surface in `apps/api/openapi/openapi.json` reflects admin-focused API ownership.
- [x] 4.3 Update affected capability specs in `openspec/specs/auth/spec.md`, `openspec/specs/core-architecture/spec.md`, `openspec/specs/api-footprint-audit/spec.md`, `openspec/specs/api-responsibility-migration/spec.md`, `openspec/specs/projects/spec.md`, `openspec/specs/inventory/spec.md`, and `openspec/specs/movements/spec.md`.
- [x] 4.4 Run `pnpm check` at repository root and resolve any issues introduced by the migration.
