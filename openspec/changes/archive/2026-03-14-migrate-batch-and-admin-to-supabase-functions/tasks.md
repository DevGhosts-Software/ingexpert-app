## 1. Shared contracts and Supabase function scaffold

- [x] 1.1 Add admin cloud-function action request/response schemas in `packages/schema` (new admin-control schemas) and export them for frontend/function reuse.
- [x] 1.2 Create Supabase cloud function folder at `packages/database/supabase/functions/admin-control/` with action-dispatch handler and strict admin authorization guard.
- [x] 1.3 Wire function config/docs for local and deployed invocation (including required env vars/secrets) in repository Supabase configuration files.

## 2. Frontend migration for batch and admin flows

- [x] 2.1 Replace item batch import calls in `apps/frontend` import features/hooks to use local SQLite write transactions (no `trpc.items.createBatch/importMany` calls).
- [x] 2.2 Replace kit batch import calls in `apps/frontend` import features/hooks to use local SQLite + `kit_details` writes compatible with current PowerSync sync behavior.
- [x] 2.3 Replace admin user management callers in `apps/frontend` to invoke `admin-control` cloud function for create/list/get/update/remove/grant/revoke/password-reset actions.

## 3. API retirement and contract cleanup

- [x] 3.1 Remove retired batch procedures from `apps/api/src/items/items.router.ts` and `apps/api/src/kits/kits.router.ts`, plus any now-unused service methods/wiring.
- [x] 3.2 Remove `adminUsers.*` router/service runtime exposure from `apps/api/src/users/admin-users.router.ts`, related services/modules, and `apps/api/src/trpc/app.router.ts` wiring.
- [x] 3.3 Regenerate and verify `apps/api/openapi/openapi.json` no longer exposes `/admin/users*` operations tied to retired API ownership.

## 4. Verification

- [x] 4.1 Validate batch imports and admin management manually in frontend against local-write + cloud-function flows.
- [x] 4.2 Run `pnpm check` at repository root and confirm format, lint, type-check, and build pass.
