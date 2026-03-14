## Why

Admins can currently trigger a `401` when using **Revocar acceso** in the users table because the `admin-control` function is not reliably resolving authenticated caller context in production requests. This blocks a critical admin-only flow and leaves user access state inconsistent with expected dashboard behavior.

## What Changes

- Harden Supabase `admin-control` authentication context resolution so authenticated admin calls are accepted consistently across Supabase Edge runtime header/token variants.
- Keep deny-by-default behavior for unauthenticated and non-admin callers.
- Add explicit diagnostics and error mapping for caller-context failures to reduce ambiguous `401` responses during admin actions.
- Verify `revokeAuth` (Revocar acceso) path end-to-end from frontend invoke payload to function response contract.
- Ensure frontend error surfacing for auth-context failures remains actionable for admins.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `supabase-admin-control-function`: Clarify and enforce accepted authenticated-caller derivation paths for admin operations, especially `revokeAuth`.
- `auth`: Ensure admin runtime management flow requirements include stable auth propagation from frontend Supabase sessions to cloud-function authorization checks.

## Impact

- Affected code: `packages/database/supabase/functions/admin-control/index.ts`, `apps/frontend/src/lib/admin-control-function.ts`, and users feature UI error handling around revoke access.
- Runtime systems: Supabase Edge Function auth validation and admin-role lookup on `public.users`.
- API contract: No new external endpoint; existing function action contract remains and is clarified for auth handling.
- Data model: No Prisma schema change expected.
