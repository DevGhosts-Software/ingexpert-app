## 1. Harden movement ledger RLS

- [x] 1.1 Update `packages/database/supabase/migrations/04_powersync-rls.sql` to add explicit `SELECT`/`INSERT` RLS policies for `movements` and `movement_details` with insert-only semantics.
- [x] 1.2 Add/adjust verification SQL in `packages/database/supabase/migrations/04_powersync-rls.sql` to confirm allowed inserts and denied updates/deletes for movement ledger tables.

## 2. Remove API runtime leftovers from repo config

- [x] 2.1 Audit and update `pnpm-workspace.yaml` to remove retired API workspace path entries (if still present) and keep only active workspaces.
- [x] 2.2 Audit and update `turbo.json` to remove retired API runtime pipeline dependencies/tasks while preserving active frontend/database/package workflows.
- [x] 2.3 Audit root and package manifests (`package.json` files across workspaces) to remove unused API-only dependencies and scripts introduced before API retirement.

## 3. Validate integrity after cleanup

- [x] 3.1 Run `pnpm check` from repository root and resolve any failures caused by RLS or workspace/dependency cleanup.
- [x] 3.2 Run `pnpm format` from repository root to ensure formatting consistency after SQL/config changes.
