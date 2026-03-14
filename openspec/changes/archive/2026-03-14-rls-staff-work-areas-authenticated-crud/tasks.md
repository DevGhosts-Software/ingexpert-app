## 1. Supabase RLS policy coverage for staff/work_areas

- [x] 1.1 Update `packages/database/supabase/migrations/04_powersync-rls.sql` to add grants and RLS enablement for `public.staff` and `public.work_areas` for authenticated CRUD scope.
- [x] 1.2 In `packages/database/supabase/migrations/04_powersync-rls.sql`, add idempotent `CREATE POLICY` blocks for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `staff` and `work_areas`.
- [x] 1.3 Extend verification query section in `packages/database/supabase/migrations/04_powersync-rls.sql` to include grant/policy inventory and behavior checks for `staff` and `work_areas`.

## 2. Validation

- [x] 2.1 Run `pnpm check` from repository root and resolve any regressions introduced by the SQL/spec updates.
- [x] 2.2 Run `pnpm format` from repository root to keep repository formatting consistent.
