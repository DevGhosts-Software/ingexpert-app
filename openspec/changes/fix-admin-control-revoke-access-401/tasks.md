## 1. Auth context hardening in Supabase admin-control function

- [x] 1.1 Refactor caller resolution in `packages/database/supabase/functions/admin-control/index.ts` into a single ordered resolver that supports Supabase Edge forwarded auth headers and bearer-token validation fallback.
- [x] 1.2 Update auth failure responses in `packages/database/supabase/functions/admin-control/index.ts` so missing caller context, invalid caller token, and non-admin role checks remain deny-by-default but are distinguishable for debugging.
- [x] 1.3 Validate `revokeAuth` action path in `packages/database/supabase/functions/admin-control/index.ts` to ensure no side effects occur when caller auth resolution fails.

## 2. Frontend invocation and revoke-access UX validation

- [x] 2.1 Verify `apps/frontend/src/lib/admin-control-function.ts` consistently invokes `admin-control` with authenticated session context for dashboard admin operations.
- [x] 2.2 Adjust revoke-access error handling in `apps/frontend/src/features/users/components/user-table.columns.tsx` so auth-context failures surface actionable admin feedback without false-success UI states.

## 3. Verification

- [ ] 3.1 Run focused runtime validation for revoke flow (`revokeAuth`) against deployed/local `admin-control` function and confirm successful admin invocation plus denied non-admin/missing-auth cases.
- [x] 3.2 Run `pnpm check` at repository root and confirm format, lint, type-check, and build pass.
