## Why

Recent audit work confirmed the frontend can operate with a much smaller API surface: auth/session, admin/user authority operations, and authoritative writes. Keeping broad read and fallback API paths now adds maintenance and drift risk, especially where PowerSync + local SQLite already provides equivalent behavior.

## What Changes

- Aggressively reduce API responsibilities to core authority endpoints only: auth/session, user/admin management, and authoritative write flows.
- Remove residual fallback behavior in migrated frontend reads so PowerSync/local SQLite becomes the single runtime read path for approved local-computable features.
- Migrate lightweight dashboard/UI card aggregates (for approved domains) to local computation where parity has already been demonstrated.
- Delete stale/deprecated API read procedures, router handlers, and service methods that are no longer used after migration.
- Remove commented-out deletion/fallback code paths and dead helper functions tied to retired endpoints.
- Tighten contract governance: retained endpoints remain explicit in OpenAPI, and removed endpoints are reflected by contract regeneration.
- **BREAKING**: Retired API read endpoints/procedures will no longer be available to clients; PowerSync-local reads are the supported path for those capabilities.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `api-footprint-audit`: finalize audit outcomes into an endpoint-retention/removal contract and enforce evidence-based API cutdown.
- `api-responsibility-migration`: move from migration-with-fallback posture to migrated-read finalization (PowerSync-local primary with no runtime fallback on approved reads).
- `core-architecture`: codify minimal API ownership boundaries and endpoint removal governance for downscoped runtime.
- `inventory`: retire approved redundant API read endpoints and ensure inventory lightweight aggregates are locally computed.
- `movements`: retire approved redundant movement read/stats endpoints and remove fallback behavior where parity gates already passed.
- `projects`: retire approved redundant project read/stats endpoints and remove fallback behavior where parity gates already passed.
- `auth`: reaffirm non-migratable authority boundary for `auth.*`, `users.me`, and admin/user management operations.

## Impact

- API (`apps/api`): router/service endpoint reductions, removal of dead procedures/functions/comments, regenerated OpenAPI contract with reduced read surface.
- Frontend (`apps/frontend`): fallback removal in migrated read hooks/selectors; local PowerSync/local SQL as sole path for approved card/list stats reads.
- Contracts (`apps/api/openapi/openapi.json`): endpoint deletions and retained-core contract clarity.
- Operations: smaller always-on API footprint, fewer redundant code paths, and reduced maintenance cost.
- Data model: no Prisma schema changes expected.
