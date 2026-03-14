## Why

The remaining API dependency is concentrated in batch import procedures and admin user management. Replacing batch API calls with local SQLite writes and moving admin operations to a Supabase cloud function removes the last runtime API bottlenecks and simplifies the final API disappearance path.

## What Changes

- **BREAKING** Retire API batch mutations (`items.createBatch`, `items.importMany`, `kits.importMany`) and replace frontend flows with local SQLite insert/update transactions replayed by PowerSync.
- **BREAKING** Retire `adminUsers.*` tRPC/API endpoints and replace them with a single Supabase cloud function that handles all admin-user actions (create, create-without-auth, grant/revoke auth, update, remove, reset password, list/get).
- Add a monorepo Supabase cloud function workspace/folder and shared request contract for admin actions.
- Update frontend admin and batch callers to target local-write + PowerSync paths (batch) and cloud-function invocation path (admin).
- Regenerate/remove OpenAPI contract entries for retired API operations.

## Capabilities

### New Capabilities

- `supabase-admin-control-function`: Single cloud function authority surface for admin user operations previously exposed by `adminUsers.*`.

### Modified Capabilities

- `api-responsibility-migration`: Retention matrix changes from “admin+batch kept in API” to “no runtime batch/admin ownership in API”.
- `core-architecture`: Runtime write flow updates to include Supabase cloud function authority for admin-user management and local-first batch import writes.
- `auth`: Admin management behavior shifts from API router/service ownership to cloud-function ownership with equivalent role enforcement.
- `inventory`: Batch import behavior shifts from API import mutations to local SQLite writes synchronized via PowerSync.

## Impact

- Affected code: `apps/frontend` batch import/admin screens/hooks, `apps/api` routers/services (`items`, `kits`, `users/admin-users`, app router wiring), and new Supabase cloud function folder (proposed under repository-level `supabase/functions/admin-control/`).
- API/OpenAPI: remove `/admin/users*` operations and any residual batch mutation exposure from generated contract.
- Data model: no Prisma schema changes expected; cloud function and local-write migration reuse existing tables/contracts.
