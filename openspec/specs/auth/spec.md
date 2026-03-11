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

| Procedure | Guard | Used for |
|---|---|---|
| `trpc.procedure` | None (public) | Unauthenticated endpoints (login, refresh) |
| `trpc.protectedProcedure` | Valid JWT required | All authenticated users |
| `trpc.adminProcedure` | JWT + `role === ADMIN` | Admin-only operations |

Use distinct procedure types for different access levels — never add an inline role check inside a `protectedProcedure`.

---

## Users Module — Two-Router Architecture

| Router | Procedure type | Procedures |
|---|---|---|
| `UsersRouter` | `protectedProcedure` | `me`, `updateMe`, `updateMyPassword`, `listNames` |
| `AdminUsersRouter` | `adminProcedure` | `create`, `createWithoutAuth`, `grantAuth`, `revokeAuth`, `list`, `get`, `update`, `remove`, `updatePassword`, `getStats`, `getWorkAreas` |

**Rules:**
- `updateMyPassword` (self) → `protectedProcedure` in `UsersRouter`, delegates to `AdminUsersService.changePassword`.
- `updatePassword` (admin resets any user) → `adminProcedure` in `AdminUsersRouter`.
- Never add a `protectedProcedure` to `AdminUsersRouter`.

---

## `hasAuth` Flag — Auth-Decoupled Users

Users can exist without a Supabase Auth account (tracked in system but cannot log in):

| Operation | Effect |
|---|---|
| `create` | DB record + Supabase Auth account → `hasAuth: true` |
| `createWithoutAuth` | DB record only, UUID generated locally → `hasAuth: false` |
| `grantAuth` | `supabaseAdmin.auth.admin.createUser({ id, email, password })` → `hasAuth: true` |
| `revokeAuth` | `supabaseAdmin.auth.admin.deleteUser(id)` → `hasAuth: false`, DB preserved |
| `remove` | Deletes DB record. Only calls Supabase `deleteUser` if `hasAuth: true` |

---

## Permission Rules

| Action | Who |
|---|---|
| Edit user | Self + non-admin users. Admins cannot edit other admins. |
| Delete user | Non-admin users only. Cannot delete self. Cannot delete other admins. |
| Reset password | Self + non-admin users. Cannot reset another admin's password. |
| Change own password | Any authenticated user (`updateMyPassword`). |

---

## Schema — Auth & User Domain Modules

| File | DTOs | Entities | Output schemas |
|---|---|---|---|
| `auth.schema.ts` | `LoginSchema` | — | `AuthSessionSchema` |
| `user.schema.ts` | `CreateUserSchema`, `UpdateUserSchema`, `CreateUserWithoutAuthSchema`, `GrantAuthSchema` | `UserEntity`, `UserStats` | `UserEntitySchema`, `CurrentUserSchema`, `UserStatsSchema`, `UserNameSchema` |
| `pagination.schema.ts` | `BasePaginationSchema` | `PaginationMeta` | `PaginationMetaSchema`, `paginatedSchema<T>()` |

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
