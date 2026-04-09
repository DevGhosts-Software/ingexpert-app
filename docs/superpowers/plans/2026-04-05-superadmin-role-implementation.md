# SuperAdmin Role — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a SUPERADMIN role that can manage ADMINs and USERs. ADMINs can only manage USERs. No one can touch SUPERADMIN.

**Architecture:** Three-file change — Prisma schema (enum only), admin-control Edge Function (permission logic), frontend (permission helpers + badge). The schema package uses `z.nativeEnum(UserRole)` so it auto-adapts after Prisma generate.

**Tech Stack:** Prisma, TypeScript, Deno Edge Function, React 19

---

## File Map

| File | Change |
|------|--------|
| `packages/database/prisma/schema/user.prisma` | Add `SUPERADMIN` to `UserRole` enum |
| `apps/frontend/src/hooks/use-current-user.ts` | Add `SUPERADMIN` to `LocalCurrentUserRow.role` and `CurrentUser.role` types |
| `packages/database/supabase/functions/admin-control/index.ts` | Role hierarchy, target protection, per-action role restrictions |
| `apps/frontend/src/features/users/components/user-table.columns.tsx` | Update permission helpers, add SUPERADMIN badge |

---

## Task 1: Update Prisma Schema

**File:** `packages/database/prisma/schema/user.prisma:1-4`

- [ ] **Step 1: Add SUPERADMIN to the UserRole enum**

```prisma
enum UserRole {
  USER
  ADMIN
  SUPERADMIN
}
```

---

## Task 2: Run Prisma Generate

- [ ] **Step 1: Regenerate Prisma client**

Run: `pnpm db:generate`
Expected: Success — `UserRole` enum now includes `SUPERADMIN`

---

## Task 3: Update Admin-Control Edge Function

**File:** `packages/database/supabase/functions/admin-control/index.ts`

This is the largest change. Work through each section in order.

#### 3.1 Add role hierarchy constant (after line ~81)

Add above the `json` helper function:

```typescript
const roleHierarchy: Record<string, number> = {
  USER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
};
```

#### 3.2 Update caller authorization check (lines 200–210)

**Old:**
```typescript
if (callerUser?.role !== 'ADMIN') {
  return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Admin role required' });
}
```

**New:**
```typescript
const callerRole = callerUser?.role;
if (!callerRole || roleHierarchy[callerRole] < 1) {
  return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Admin role required' });
}
```

#### 3.3 Update ActionSchema role enums (lines 16, 27, 48)

Change `z.enum(['USER', 'ADMIN'])` to `z.enum(['USER', 'ADMIN', 'SUPERADMIN'])` in all three places:
- `create.input.role`
- `createWithoutAuth.input.role`
- `update.data.role`

#### 3.4 Update UserRow type (line 64)

Change:
```typescript
role: 'ADMIN' | 'USER';
```
To:
```typescript
role: 'ADMIN' | 'USER' | 'SUPERADMIN';
```

#### 3.5 Add helper to check if target is SUPERADMIN

Add this helper after `isAuthUserNotFoundError` (around line 151):

```typescript
const isTargetSuperadmin = async (adminClient: ReturnType<typeof createClient>, id: string): Promise<boolean> => {
  const { data } = await adminClient
    .from('users')
    .select('role')
    .eq('id', id)
    .maybeSingle();
  return data?.role === 'SUPERADMIN';
};
```

#### 3.6 Update `create` action (lines 239–278)

Add after the caller resolution block (after line 260 `if (userError) throw new Error(userError.message);`):

```typescript
const allowedRoles = callerRole === 'SUPERADMIN'
  ? ['USER', 'ADMIN', 'SUPERADMIN']
  : ['USER', 'ADMIN'];

if (!allowedRoles.includes(payload.input.role ?? 'USER')) {
  return json(403, { code: 'ROLE_NOT_ALLOWED', error: 'Cannot create this role' });
}
```

#### 3.7 Update `createWithoutAuth` action (lines 280–308)

Add after line 290 (`if (userError) throw new Error(userError.message);`):

```typescript
const allowedRoles = callerRole === 'SUPERADMIN'
  ? ['USER', 'ADMIN', 'SUPERADMIN']
  : ['USER', 'ADMIN'];

if (!allowedRoles.includes(payload.input.role ?? 'USER')) {
  return json(403, { code: 'ROLE_NOT_ALLOWED', error: 'Cannot create this role' });
}
```

#### 3.8 Update `grantAuth` action (lines 310–341)

Add after line 316 (`if (userError) throw new Error(userError.message);`):

```typescript
if (callerRole !== 'SUPERADMIN' && userData.role !== 'USER') {
  return json(403, { code: 'ROLE_NOT_ALLOWED', error: 'Cannot grant auth to this role' });
}
if (userData.role === 'SUPERADMIN') {
  return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot modify a SuperAdmin' });
}
```

#### 3.9 Update `revokeAuth` action (lines 343–368)

Add after line 350 (`if (!existingUser) throw new Error('User not found');`):

```typescript
if (existingUser?.role === 'SUPERADMIN') {
  return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot modify a SuperAdmin' });
}
if (callerRole !== 'SUPERADMIN' && existingUser?.role === 'ADMIN') {
  return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Cannot revoke auth of an admin' });
}
```

#### 3.10 Update `update` action (lines 370–414)

Add after line 381 (`if (userError) throw new Error(userError.message);`):

```typescript
const { data: targetUser } = await adminClient
  .from('users')
  .select('role')
  .eq('id', payload.id)
  .single();

if (targetUser?.role === 'SUPERADMIN') {
  return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot modify a SuperAdmin' });
}

if (payload.data.role !== undefined && callerRole !== 'SUPERADMIN') {
  return json(403, { code: 'ROLE_NOT_ALLOWED', error: 'Only SuperAdmin can change roles' });
}
```

Also update the auth update block (lines 400–405) to allow SUPERADMIN to update other users' auth names:

```typescript
if (payload.data.name !== undefined && targetUser?.role !== 'SUPERADMIN') {
  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(payload.id, {
    user_metadata: { nombre: payload.data.name ?? '' },
  });
  if (authUpdateError) throw new Error(authUpdateError.message);
}
```

#### 3.11 Update `remove` action (lines 416–445)

Add after line 422 (`if (existingError) throw new Error(existingError.message);`):

```typescript
if (existing?.role === 'SUPERADMIN') {
  return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot delete a SuperAdmin' });
}
if (callerRole !== 'SUPERADMIN' && existing?.role === 'ADMIN') {
  return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Cannot delete an admin' });
}
```

#### 3.12 Update `updatePassword` action (last action block)

Add after the variable declaration and before the auth call:

```typescript
const { data: passwordTarget } = await adminClient
  .from('users')
  .select('role')
  .eq('id', payload.id)
  .single();

if (passwordTarget?.role === 'SUPERADMIN') {
  return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot modify a SuperAdmin' });
}
if (callerRole !== 'SUPERADMIN' && passwordTarget?.role === 'ADMIN') {
  return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Cannot reset password of an admin' });
}
```

#### 3.13 Update error handler

In `mapAdminControlAuthError` (around line 86), add:

```typescript
if (error.message.includes('SUPERADMIN_PROTECTED')) {
  return 'No se puede modificar a un SuperAdministrador.';
}
if (error.message.includes('ROLE_NOT_ALLOWED')) {
  return 'No tienes permiso para asignar este rol.';
}
```

---

## Task 4: Update useCurrentUser Hook

**File:** `apps/frontend/src/hooks/use-current-user.ts`

Update both type definitions to include `SUPERADMIN`:

```typescript
type LocalCurrentUserRow = {
  // ...
  role: 'ADMIN' | 'USER' | 'SUPERADMIN';
  // ...
};

type CurrentUser = {
  // ...
  role: 'ADMIN' | 'USER' | 'SUPERADMIN';
  // ...
};
```

---

## Task 5: Update Frontend Permission Helpers and RoleBadge

**File:** `apps/frontend/src/features/users/components/user-table.columns.tsx`

#### 5.1 Update `canEdit` helper (lines 65–69)

**Old:**
```typescript
function canEdit(currentId: string, target: UserEntity): boolean {
  if (target.id === currentId) return true;
  if (target.role === 'ADMIN') return false;
  return true;
}
```

**New:**
```typescript
function canEdit(currentRole: string, currentId: string, target: UserEntity): boolean {
  if (target.id === currentId) return true;
  if (target.role === 'SUPERADMIN') return false;
  if (target.role === 'ADMIN' && currentRole !== 'SUPERADMIN') return false;
  return true;
}
```

#### 5.2 Update `canDelete` helper (lines 71–75)

**Old:**
```typescript
function canDelete(currentId: string, target: UserEntity): boolean {
  if (target.id === currentId) return false;
  if (target.role === 'ADMIN') return false;
  return true;
}
```

**New:**
```typescript
function canDelete(currentRole: string, currentId: string, target: UserEntity): boolean {
  if (target.id === currentId) return false;
  if (target.role === 'SUPERADMIN') return false;
  if (target.role === 'ADMIN' && currentRole !== 'SUPERADMIN') return false;
  return true;
}
```

#### 5.3 Update RowActions component signature (lines 450–462)

**Old:**
```typescript
function RowActions({ user }: { user: UserEntity }) {
  // ...
  const { user: me } = useCurrentUser();
  const currentId = me?.id ?? '';
  const isEditAllowed = canEdit(currentId, user);
  const isDeleteAllowed = canDelete(currentId, user);
  const isResetPasswordAllowed = user.has_auth && (user.id === currentId || user.role !== 'ADMIN');
  const canChangeRole = user.id !== currentId && user.role !== 'ADMIN';
```

**New:**
```typescript
function RowActions({ user, currentRole }: { user: UserEntity; currentRole: string }) {
  // ...
  const currentId = me?.id ?? '';
  const isEditAllowed = canEdit(currentRole, currentId, user);
  const isDeleteAllowed = canDelete(currentRole, currentId, user);
  const isResetPasswordAllowed = user.has_auth && (user.id === currentId || (user.role === 'USER' || (user.role === 'ADMIN' && currentRole === 'SUPERADMIN')));
  const canChangeRole = user.id !== currentId && user.role !== 'SUPERADMIN' && (user.role !== 'ADMIN' || currentRole === 'SUPERADMIN');
```

#### 5.4 Update `user.id === currentId || user.role === 'ADMIN'` condition (line 461)

The `isResetPasswordAllowed` line in the old code uses:
```typescript
user.has_auth && (user.id === currentId || user.role !== 'ADMIN')
```
This allows anyone to reset password for non-ADMINS. We need to also allow SUPERADMIN to reset ADMIN passwords:
```typescript
user.has_auth && (
  user.id === currentId ||
  user.role === 'USER' ||
  (user.role === 'ADMIN' && currentRole === 'SUPERADMIN')
)
```

#### 5.5 Update revoke auth disabled check (line 486)

**Old:**
```typescript
disabled={user.id === currentId || user.role === 'ADMIN'}
```

**New:**
```typescript
disabled={user.id === currentId || user.role === 'SUPERADMIN' || (user.role === 'ADMIN' && currentRole !== 'SUPERADMIN')}
```

#### 5.6 Update RoleBadge (lines 528–543)

**Old:**
```typescript
export function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'ADMIN') {
    return (
      <Badge className="gap-1.5 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
        <ShieldCheck className="h-3 w-3" />
        Administrador
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1.5">
      <User className="h-3 w-3" />
      Usuario
    </Badge>
  );
}
```

**New:**
```typescript
export function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'SUPERADMIN') {
    return (
      <Badge className="gap-1.5 bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
        <ShieldCheck className="h-3 w-3" />
        SuperAdmin
      </Badge>
    );
  }
  if (role === 'ADMIN') {
    return (
      <Badge className="gap-1.5 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
        <ShieldCheck className="h-3 w-3" />
        Administrador
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1.5">
      <User className="h-3 w-3" />
      Usuario
    </Badge>
  );
}
```

#### 5.7 Update actions cell to pass currentRole (lines 661–670)

Find the actions column cell and update the `<RowActions>` call to pass `currentRole`:

```typescript
cell: ({ row }) => {
  const { user: me } = useCurrentUser();
  const currentRole = me?.role ?? 'USER';
  return (
    <div className="flex justify-center">
      <RowActions user={row.original} currentRole={currentRole} />
    </div>
  );
},
```

Note: `getColumns()` is called at module level (line 22) with no props. The `useCurrentUser` hook must be called inside the cell renderer (inside `cell: ({ row }) => ...`) since it's a React hook. This is valid because the cell function is a React component render function.

#### 5.8 Update getColumns return type to include SUPERADMIN

The `UserEntity` type used by `getColumns()` comes from `user-table.types.ts`. Verify that `UserRole` in that file includes `SUPERADMIN` — it should automatically pick it up from Prisma client after Task 2. If not, check `user-table.types.ts`.

---

## Task 6: Verify TypeScript Compilation

- [ ] **Step 1: Run type check**

Run: `pnpm tsc --noEmit`
Expected: No errors related to SUPERADMIN role changes

---

## Self-Review Checklist

- [ ] SUPERADMIN added to Prisma `UserRole` enum
- [ ] Prisma client regenerated
- [ ] All `z.enum(['USER', 'ADMIN'])` in admin-control updated to include `SUPERADMIN`
- [ ] `UserRow` type updated with `SUPERADMIN`
- [ ] `canEdit`/`canDelete` updated to handle SUPERADMIN
- [ ] Every action (create, grantAuth, revokeAuth, update, remove, updatePassword) protects SUPERADMIN and restricts ADMIN targeting
- [ ] `useCurrentUser` types updated
- [ ] `RoleBadge` renders SUPERADMIN
- [ ] `getColumns` cell passes `currentRole` to `RowActions`
- [ ] TypeScript passes with no errors
