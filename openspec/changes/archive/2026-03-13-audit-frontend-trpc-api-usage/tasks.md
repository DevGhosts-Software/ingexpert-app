## 1. Build the frontend tRPC usage inventory

- [x] 1.1 Scan `apps/frontend/src/**/*.ts` and `apps/frontend/src/**/*.tsx` for `trpc.*` calls and generate a normalized procedure inventory artifact at `openspec/changes/audit-frontend-trpc-api-usage/files/trpc-usage-matrix.json`.
- [x] 1.2 Include per-entry metadata in `openspec/changes/audit-frontend-trpc-api-usage/files/trpc-usage-matrix.json`: file path, procedure name, call type (`useQuery`/`useMutation`/utility), and feature/domain ownership.
- [x] 1.3 Add a human-readable summary table at `openspec/changes/audit-frontend-trpc-api-usage/files/trpc-usage-summary.md` grouped by domain and procedure.

## 2. Classify backend necessity and migration feasibility

- [x] 2.1 Classify each matrix entry in `openspec/changes/audit-frontend-trpc-api-usage/files/trpc-usage-matrix.json` into `Identity/Auth`, `Server Authority Write`, `Server Compute Read`, `Local-Computable Read`, or `Migration Candidate`.
- [x] 2.2 For stats procedures referenced in `apps/frontend/src/app/(dashboard)/page.tsx` and `apps/frontend/src/app/(dashboard)/admin/users/page.tsx`, document local-SQL parity formulas and validation criteria in `openspec/changes/audit-frontend-trpc-api-usage/files/stats-parity-plan.md`.
- [x] 2.3 Cross-reference current endpoint contracts in `apps/api/openapi/openapi.json` and capture endpoint-to-procedure mapping notes in `openspec/changes/audit-frontend-trpc-api-usage/files/openapi-mapping.md`.

## 3. Define migration and governance outputs

- [x] 3.1 Add phased migration recommendations (observe, dual-run, cutover, rollback) to `openspec/changes/audit-frontend-trpc-api-usage/files/migration-recommendation.md`.
- [x] 3.2 Update architecture governance docs in `openspec/specs/core-architecture/spec.md` to include API responsibility-matrix maintenance requirements introduced by this change.
- [x] 3.3 Record security-equivalence gates for any auth relocation candidate in `openspec/changes/audit-frontend-trpc-api-usage/files/auth-equivalence-checklist.md`.

## 4. Validate and finalize

- [x] 4.1 Validate that all artifacts required by this change exist under `openspec/changes/audit-frontend-trpc-api-usage/` and align with `proposal.md`, `design.md`, and `specs/**`.
- [x] 4.2 Run `pnpm check` from repository root and resolve any issues introduced by implementation work.
- [x] 4.3 Run `pnpm format` from repository root and confirm formatting is clean.
