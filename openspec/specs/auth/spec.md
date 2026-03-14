# Auth Spec — Ingexpert

> **Source of Truth for Endpoint Contracts**: Before implementing any authentication route, JWT handling change, or user management endpoint, read **`openapi/openapi.json`** for the exact endpoint shapes, request/response schemas, and authentication requirements for this domain.

Covers: Supabase Auth integration, JWT validation, tRPC procedure guards, Users module (self-service + admin CRUD), `hasAuth` flag lifecycle, permission matrix, and auth-related frontend patterns.

---

## JWT Authentication

- JWT is validated by fetching Supabase public keys from JWKS (RS256). No shared secret.
- `ctx.user` is the decoded JWT payload: `{ id, email, role }`.
- `ctx.user.id` is the source of truth for `createdById` — the client cannot override it.

---

## Procedure Types

| Procedure                 | Guard                  | Used for                                   |
| ------------------------- | ---------------------- | ------------------------------------------ |
| `trpc.procedure`          | None (public)          | Unauthenticated endpoints (login, refresh) |
| `trpc.protectedProcedure` | Valid JWT required     | All authenticated users                    |
| `trpc.adminProcedure`     | JWT + `role === ADMIN` | Admin-only operations                      |

Use distinct procedure types for different access levels — never add an inline role check inside a `protectedProcedure`.

---

## Users Module — Two-Router Architecture

| Router             | Procedure type       | Procedures                                                                                                                                |
| ------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `UsersRouter`      | `protectedProcedure` | `me`, `updateMe`, `updateMyPassword`, `listNames`                                                                                         |
| `AdminUsersRouter` | `adminProcedure`     | `create`, `createWithoutAuth`, `grantAuth`, `revokeAuth`, `list`, `get`, `update`, `remove`, `updatePassword`, `getStats`, `getWorkAreas` |

**Rules:**

- `updateMyPassword` (self) → `protectedProcedure` in `UsersRouter`, delegates to `AdminUsersService.changePassword`.
- `updatePassword` (admin resets any user) → `adminProcedure` in `AdminUsersRouter`.
- Never add a `protectedProcedure` to `AdminUsersRouter`.

---

## `hasAuth` Flag — Auth-Decoupled Users

Users can exist without a Supabase Auth account (tracked in system but cannot log in):

| Operation           | Effect                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| `create`            | DB record + Supabase Auth account → `hasAuth: true`                              |
| `createWithoutAuth` | DB record only, UUID generated locally → `hasAuth: false`                        |
| `grantAuth`         | `supabaseAdmin.auth.admin.createUser({ id, email, password })` → `hasAuth: true` |
| `revokeAuth`        | `supabaseAdmin.auth.admin.deleteUser(id)` → `hasAuth: false`, DB preserved       |
| `remove`            | Deletes DB record. Only calls Supabase `deleteUser` if `hasAuth: true`           |

---

## Permission Rules

| Action              | Who                                                                   |
| ------------------- | --------------------------------------------------------------------- |
| Edit user           | Self + non-admin users. Admins cannot edit other admins.              |
| Delete user         | Non-admin users only. Cannot delete self. Cannot delete other admins. |
| Reset password      | Self + non-admin users. Cannot reset another admin's password.        |
| Change own password | Any authenticated user (`updateMyPassword`).                          |

---

## Schema — Auth & User Domain Modules

| File                   | DTOs                                                                                     | Entities                  | Output schemas                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `auth.schema.ts`       | `LoginSchema`                                                                            | —                         | `AuthSessionSchema`                                                          |
| `user.schema.ts`       | `CreateUserSchema`, `UpdateUserSchema`, `CreateUserWithoutAuthSchema`, `GrantAuthSchema` | `UserEntity`, `UserStats` | `UserEntitySchema`, `CurrentUserSchema`, `UserStatsSchema`, `UserNameSchema` |
| `pagination.schema.ts` | `BasePaginationSchema`                                                                   | `PaginationMeta`          | `PaginationMetaSchema`, `paginatedSchema<T>()`                               |

`UserEntity` is defined as:

```typescript
export type UserEntity = User & { workArea: string | null };
// Note: hasAuth is a DB column on User — included automatically in User base
```

---

## Frontend — Role-Based UI

Use `useIsAdmin()` (`src/hooks/use-is-admin.ts`) to gate admin-only UI. It reads `trpc.users.me` with `staleTime: Infinity` — no extra network request.

```typescript
// ✅ correct — isAdmin flows from Container to Presenter as prop
const isAdmin = useIsAdmin(); // in page container
<InventoryTable isAdmin={isAdmin} ... />

// In presenter — receives as prop, never calls useIsAdmin() directly
{isAdmin && <Button>Agregar item</Button>}
```

Exception: layout-level components (e.g. `AppSidebar`) may call `useIsAdmin()` directly.

---

## Frontend — Navbar & User Profile

`DashboardNavbar` (`src/components/dashboard-navbar.tsx`) accepts `user` and `onLogout` props. It renders a clickable `Avatar` (shadcn `Avatar` + `AvatarFallback` with initials) that opens `UserProfileSheet`.

`UserProfileSheet` (`src/features/users/components/user-profile-sheet.tsx`) is the **only** place any user edits their own name, avatar URL, and password:

- `trpc.users.updateMe` — name and avatar
- `trpc.users.updateMyPassword` — password change (self only, always allowed)

The logout button lives inside `UserProfileSheet`, passed as `onLogout` from layout → navbar → sheet.

---

## Frontend — Sidebar Active State

```typescript
isActive={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
```

---

## Frontend — tRPC Transport URL Contract

Frontend authentication calls (`auth.login`, `auth.refresh`, `auth.logout`) MUST be sent through the API tRPC middleware path (`/trpc`).

`NEXT_PUBLIC_API_URL` MAY be configured as either:

- API origin only (e.g. `http://localhost:3001`)
- Full tRPC URL (e.g. `http://localhost:3001/trpc`)

When origin-only is provided, frontend transport MUST normalize to the `/trpc` endpoint before dispatching requests, and MUST NOT call root-level procedure paths such as `/auth.login`.

---

## Requirement: Auth guard SHALL tolerate offline local sessions

Frontend auth guarding MUST allow users with a previously validated local session to access local-first screens when internet connectivity is unavailable, without forcing immediate online revalidation.

#### Scenario: Offline startup with valid local session

- **WHEN** the application starts offline and a non-expired locally persisted session exists that was previously validated online
- **THEN** the auth guard MUST allow navigation to authenticated local-first screens
- **THEN** the guard MUST defer remote token/JWKS validation until connectivity is restored

#### Scenario: Offline startup with invalid or missing local session

- **WHEN** the application starts offline and no valid local session is available
- **THEN** the auth guard MUST deny authenticated access
- **THEN** the UI MUST show explicit authentication-required feedback instead of a bounce loop

## Requirement: Auth recovery SHALL revalidate once online

When connectivity returns, the client MUST revalidate the active session against normal online auth flow and handle failure explicitly.

#### Scenario: Connectivity restored after offline continuation

- **WHEN** a user is operating under offline-continued session and network connectivity returns
- **THEN** the client MUST attempt normal session/token revalidation
- **THEN** invalid sessions MUST be revoked with clear user feedback and local cleanup

## Requirement: Auth authority SHALL remain API-owned during read migration

API-scope reduction initiatives MUST NOT relocate `auth.login`, `auth.refresh`, `auth.logout`, or `users.me` authority without an approved security-equivalence change.

#### Scenario: Read-migration rollout plan includes auth procedure

- **WHEN** a migration plan attempts to include an auth/session procedure
- **THEN** the procedure MUST be marked blocked from cutover by default
- **THEN** migration MAY proceed only after explicit security-equivalence approval

## Requirement: Read migration SHALL not weaken RBAC checks

Any local-first cutover in adjacent domains MUST preserve existing RBAC-protected behavior and continue relying on API authority for protected write/auth decisions.

#### Scenario: Local-first read cutover reaches production

- **WHEN** migrated read paths are active in production
- **THEN** role-based access behavior MUST remain unchanged from approved auth policy
- **THEN** any RBAC regression MUST trigger immediate rollback
