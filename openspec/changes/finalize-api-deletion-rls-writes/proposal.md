## Why

The API has already been reduced, but key non-admin mutations still keep frontend workflows tied to backend procedures. We now want to finalize this cutdown by moving those remaining user/project/item/kit runtime mutations to Supabase + PowerSync local writes, enforced by explicit RLS policies.

## What Changes

- Remove frontend runtime dependency on:
  - `users.me`, `users.updateMe`, `users.updateMyPassword`
  - `projects.create`, `projects.update`, `projects.remove`
  - `items.remove`
  - `kits.setComponents`, `kits.clearKit`
- Keep API ownership only for:
  - `adminUsers.*` (admin user management)
  - batch import procedures (`items.importMany`, `kits.importMany`)
- Introduce a repository SQL policy file that defines Supabase RLS for direct frontend/PowerSync write paths.
- Implement direct local DB writes (PowerSync SQLite) and Supabase-backed auth/profile behaviors so synchronization handles remote persistence.
- Retire now-unused API router/service procedures and regenerate OpenAPI to reflect the final reduced surface.
- **BREAKING**: remove the listed non-admin API procedures from active backend contract.

## Capabilities

### New Capabilities

- `supabase-rls-write-governance`: Defines RLS rules and SQL policy artifacts required for frontend/PowerSync direct mutation safety.

### Modified Capabilities

- `auth`: Replace remaining API-owned self-service user procedures with frontend/Supabase-owned session and profile flows.
- `projects`: Move create/update/remove runtime behavior off API procedures and preserve delete constraints via policy/data rules.
- `inventory`: Move item delete and kit component mutation flows to local-write + sync path under RLS.
- `core-architecture`: Finalize API ownership matrix to admin management + batch imports only.
- `api-footprint-audit`: Update retention matrix and zero-usage proof for final endpoint retirement set.
- `api-responsibility-migration`: Advance migration plan to full non-admin mutation retirement with no runtime fallbacks.

## Impact

- Frontend code in `apps/frontend/src/features/users`, `features/projects`, and `features/inventory` will replace targeted tRPC mutations with PowerSync/local + Supabase flows.
- API routers/services in `apps/api/src/users`, `projects`, `items`, and `kits` will delete retired procedures and coupled logic.
- OpenAPI contract `apps/api/openapi/openapi.json` will shrink to admin user management + batch imports + retained admin/operational endpoints.
- New SQL artifact(s) will be added (e.g., under `packages/database/prisma/`) for Supabase RLS policy setup and verification.
- No Prisma schema model changes are expected; this is ownership and policy migration over existing tables.
