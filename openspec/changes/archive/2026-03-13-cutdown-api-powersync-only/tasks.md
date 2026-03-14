## 1. Build endpoint retention and deletion plan

- [x] 1.1 Audit active frontend runtime call sites in `apps/frontend/src/**/*.ts*` and update retention matrix artifacts under `openspec/changes/cutdown-api-powersync-only/files/` with `retain` vs `remove-ready` per procedure.
- [x] 1.2 Cross-check retained/removal-ready procedures against `apps/api/openapi/openapi.json` and enumerate router/service targets in `apps/api/src/**/*.router.ts` and `apps/api/src/**/services/*.service.ts`.

## 2. Remove frontend runtime fallback branches and finalize local reads

- [x] 2.1 Remove runtime fallback flags/branches for finalized migrated reads in `apps/frontend/src/lib/**` and domain read modules in `apps/frontend/src/features/inventory/**`, `apps/frontend/src/features/movements/**`, and `apps/frontend/src/features/projects/**`.
- [x] 2.2 Ensure lightweight dashboard card stats in `apps/frontend/src/app/(dashboard)/page.tsx` and related local stats helpers in `apps/frontend/src/features/**` compute from PowerSync/local SQLite only for approved migrated procedures.

## 3. Retire remove-ready API read endpoints and dead code

- [x] 3.1 Delete remove-ready read procedures from routers in `apps/api/src/items/*.router.ts`, `apps/api/src/movements/*.router.ts`, `apps/api/src/projects/*.router.ts`, and any other matrix-marked modules while preserving auth/admin/authority endpoints.
- [x] 3.2 Delete tightly-coupled dead service methods/helpers and stale deletion/fallback comments in `apps/api/src/**/services/*.service.ts` and `apps/frontend/src/**` that reference retired procedures.

## 4. Regenerate contracts and verify

- [x] 4.1 Regenerate and validate OpenAPI in `apps/api/openapi/openapi.json` to confirm retired operations are removed and retained authority endpoints remain.
- [x] 4.2 Update affected capability specs in `openspec/specs/core-architecture/spec.md`, `openspec/specs/api-footprint-audit/spec.md`, `openspec/specs/api-responsibility-migration/spec.md`, `openspec/specs/inventory/spec.md`, `openspec/specs/movements/spec.md`, `openspec/specs/projects/spec.md`, and `openspec/specs/auth/spec.md`.
- [x] 4.3 Run `pnpm check` at repository root and fix any issues introduced by endpoint/fallback cleanup.
