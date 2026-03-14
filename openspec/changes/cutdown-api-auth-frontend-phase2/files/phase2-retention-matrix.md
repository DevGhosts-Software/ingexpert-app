# Phase 2 Retention Matrix (Auth Frontend Authority)

## Runtime tRPC usage observed in frontend

- `auth.login` → used in `features/auth/components/login-form.tsx`
- `auth.refresh` → used in `components/providers/trpc-provider.tsx`
- `auth.logout` → used in `app/(dashboard)/layout.tsx`
- `users.me` → used in layout/dashboard/admin-role helpers
- Admin operations (`adminUsers.*`) → used in admin user management
- Operational mutations (`items.*`, `kits.*`, `movements.*`, `projects.*`) → still used

## OpenAPI cross-check

Current contract included:

- `/auth/login` (`auth-login`)
- `/auth/refresh` (`auth-refresh`)
- `/auth/logout` (`auth-logout`)
- `/users/me` and `/users/me/password`
- Admin and operational endpoints above

## Phase-2 decisions

- **Remove now (Class B complete):**
  - `auth.login`, `auth.refresh`, `auth.logout`
  - API files:
    - `apps/api/src/auth/auth.router.ts`
    - `apps/api/src/auth/auth.module.ts`
    - `apps/api/src/auth/services/auth.service.ts`
  - App wiring:
    - `apps/api/src/app.module.ts` (`AuthModule` import)
    - `apps/api/src/trpc/app.router.ts` (`auth` namespace)

- **Retain for now (Class C):**
  - `users.me`, `users.updateMe`, `users.updateMyPassword`
  - `adminUsers.*`
  - `items.*`, `kits.*`, `movements.*`, `projects.*`

## Frontend migration mapping

- `trpc.auth.login` → `supabase.auth.signInWithPassword`
- `trpc.auth.refresh` → removed (Supabase SDK handles token lifecycle)
- `trpc.auth.logout` → `supabase.auth.signOut`

No runtime fallback branches were introduced; rollback is release-level revert only.
