## Why

The API has already been downscoped significantly, and most remaining online dependencies are concentrated in auth/session and a few non-admin operational paths. Migrating these to frontend-local and Supabase-native flows can further reduce API runtime surface, infrastructure cost, and failure points.

## What Changes

- Migrate auth/session authority from API tRPC procedures to frontend-owned Supabase client flows (`login`, `refresh/session recovery`, `logout`, current user resolution).
- Replace API-backed auth context validation in frontend with direct Supabase session + role resolution strategy that matches existing RBAC outcomes.
- Migrate non-admin operational reads/writes that are already local-computable or PowerSync-covered (including local-only export usage where full local dataset is available).
- Decommission remaining non-admin API endpoints that become unused after migration.
- Preserve admin-management operations in API for now (explicitly out of this phase’s removals).
- Update OpenAPI to reflect retained admin-focused surface only.
- **BREAKING**: Remove API auth procedures and any non-admin endpoints migrated to frontend/Supabase/local-only execution.

## Capabilities

### New Capabilities

- `frontend-auth-authority`: Defines frontend-owned Supabase auth/session authority, token lifecycle handling, and role-context resolution without API auth endpoints.

### Modified Capabilities

- `auth`: Change authority ownership from API-owned auth/session procedures to frontend/Supabase-owned flows with explicit security-equivalence requirements.
- `core-architecture`: Update API ownership matrix to permit auth/session decommissioning and stronger frontend-local responsibility boundaries.
- `api-footprint-audit`: Extend retention/removal matrix to classify remaining non-admin endpoints for retirement after frontend migration.
- `api-responsibility-migration`: Advance from read-path reduction to broader endpoint retirement (including auth and project/non-admin candidates) with finalization gates.
- `projects`: Remove remaining project API dependencies where frontend/local-first behavior can fully replace them without UX regressions.
- `inventory`: Allow local-only export and retire any residual non-admin inventory endpoint dependencies already covered by synchronized local data.
- `movements`: Retire residual non-admin movement endpoints that are fully replaced by local PowerSync data and local compute.

## Impact

- Frontend: significant auth/session and endpoint usage refactor in `apps/frontend/src`, including Supabase-direct auth flow integration.
- API: removal of auth router authority paths and additional non-admin procedures; API concentrates on admin functions.
- Contracts: major OpenAPI reduction and endpoint removals.
- Security/operations: requires explicit equivalence validation for auth/session correctness and RBAC outcomes.
- Data model: no Prisma schema changes expected for baseline migration; role/claims mapping may require config-level updates.
