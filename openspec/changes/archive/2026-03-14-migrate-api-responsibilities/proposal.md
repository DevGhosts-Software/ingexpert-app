## Why

We completed a full frontend tRPC footprint audit and now need to execute the migration plan: reduce always-on API scope while preserving correctness, security, and performance. The goal is to keep only true authority/security responsibilities in the API and move safe read workloads to local-first computation.

## What Changes

- Implement the migration phases from the audit outputs (observe, dual-run, cutover, rollback) for identified read candidates.
- Migrate approved read paths from API-backed tRPC queries to local PowerSync/SQLite-backed reads with parity validation gates.
- Keep `Identity/Auth` and `Server Authority Write` procedures API-owned and explicitly out of migration scope.
- Add/standardize feature flags and telemetry for dual-run comparison, mismatch detection, and fast rollback.
- Resolve API contract governance gaps by documenting intentional non-OpenAPI procedures and ensuring endpoint visibility is explicit.
- **BREAKING**: Remove or deprecate migrated API read procedures from active frontend usage after cutover (with rollback controls).

## Capabilities

### New Capabilities

- `api-responsibility-migration`: Executes the audited procedure-by-procedure migration from API reads to local-first reads with parity, rollout, and rollback controls.

### Modified Capabilities

- `api-footprint-audit`: Move from audit-only outputs to executable migration gates and acceptance criteria.
- `core-architecture`: Enforce operational governance for API responsibility reduction, dual-run observability, and rollback readiness.
- `inventory`: Migrate low-risk inventory read endpoints/hooks to local-first paths where parity is proven.
- `movements`: Migrate eligible movement read/stat flows to local-first computation with role/filter parity.
- `projects`: Migrate eligible project read/stat flows to local-first computation with no UX regression.
- `auth`: Preserve and harden auth authority boundaries while excluding auth/session procedures from migration cutover.

## Impact

- Frontend: updates to dashboard/admin/inventory/projects/movements data-fetch paths and feature flags.
- API: reduced read-path responsibilities; write/auth flows remain centralized.
- Contracts: OpenAPI/tRPC mapping and deprecation notes for migrated reads.
- Operations: additional parity telemetry, rollout gates, and rollback switches.
- Data model: no required Prisma schema change expected for initial migration phases.
