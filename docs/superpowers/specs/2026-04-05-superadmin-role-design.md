# SuperAdmin Role — Design Specification

## Overview

Add a `SUPERADMIN` role to the existing role-based access control system. SUPERADMIN can manage ADMINs and USERs. ADMINs can only manage USERs. No one — including SUPERADMIN — can modify or delete the hardcoded SUPERADMIN account. The initial SUPERADMIN is created manually in Supabase after deployment.

---

## 1. Database Schema

### 1.1 `packages/database/prisma/schema/user.prisma`

Add `SUPERADMIN` to the `UserRole` enum:

```prisma
enum UserRole {
  USER
  ADMIN
  SUPERADMIN
}
```

No other changes to the data model.

### 1.2 Seed file

No changes — SUPERADMIN is created manually in Supabase, not via seed.

---

## 2. Schema Package

### 2.1 Role Enum and Zod Schemas

Update any Zod schemas in `packages/schema/` that reference `UserRole` to include `SUPERADMIN`.

---

## 3. Admin-Control Edge Function

**File**: `packages/database/supabase/functions/admin-control/index.ts`

### 3.1 Role Hierarchy

| Caller role | Can target |
|-------------|-----------|
| ADMIN       | USER only |
| SUPERADMIN  | ADMIN + USER |

### 3.2 Authorization Logic

**Current check** (single-level):
```typescript
if (callerUser?.role !== 'ADMIN') {
  return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Admin role required' });
}
```

**New check** (two-level):
```typescript
const roleHierarchy: Record<string, number> = {
  USER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
};

const callerRole = callerUser?.role;
if (!callerRole || roleHierarchy[callerRole] < 1) {
  return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Admin role required' });
}
```

### 3.3 Protection of SUPERADMIN

No action may target a SUPERADMIN user. This must be enforced per-action:

```typescript
const isTargetSuperadmin = targetUser?.role === 'SUPERADMIN';
if (isTargetSuperadmin) {
  return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot modify a SuperAdmin' });
}
```

### 3.4 Per-Action Role Restrictions

#### `create` — role field validation

| Caller role | Allowed role values for new user |
|-------------|----------------------------------|
| ADMIN       | `USER`, `ADMIN`                  |
| SUPERADMIN  | `USER`, `ADMIN`, `SUPERADMIN`    |

```typescript
const allowedRoles = callerRole === 'SUPERADMIN'
  ? ['USER', 'ADMIN', 'SUPERADMIN']
  : ['USER', 'ADMIN'];

if (!allowedRoles.includes(payload.input.role ?? 'USER')) {
  return json(403, { code: 'ROLE_NOT_ALLOWED', error: 'Cannot create this role' });
}
```

#### `update`, `remove`, `revokeAuth`, `grantAuth`

Block ADMIN from targeting ADMIN or SUPERADMIN. SUPERADMIN blocked from targeting SUPERADMIN.

#### `updatePassword`

Same restrictions as above.

### 3.5 Action Schema Updates

Update `ActionSchema` Zod definitions to include `SUPERADMIN` in all role enums:

- `create.input.role`
- `createWithoutAuth.input.role`
- `update.data.role`

### 3.6 `UserRow` Type

Update the discriminated union type:

```typescript
type UserRow = {
  // ...
  role: 'ADMIN' | 'USER' | 'SUPERADMIN';
  // ...
};
```

---

## 4. Frontend

**File**: `apps/frontend/src/app/(dashboard)/admin/users/page.tsx`

### 4.1 Permission Gate

The current user role is determined from the session. When rendering action buttons (edit, delete, revoke auth) for each row:

- If **caller is ADMIN**: hide all actions on ADMIN and SUPERADMIN rows
- If **caller is SUPERADMIN**: show actions on ADMIN and USER rows, hide on SUPERADMIN row

The `useLocalUsers()` hook returns the current user's role via the session. Pass this as a prop to `UserTable` to conditionally render action buttons.

### 4.2 Role Counts

The `roleCounts` in the table data should include `superadmin` for completeness in the stats display, even if the UI never filters to only superadmins.

---

## 5. Summary of File Changes

| File | Change |
|------|--------|
| `packages/database/prisma/schema/user.prisma` | Add `SUPERADMIN` to enum |
| `packages/schema/**/*` | Add `SUPERADMIN` to role enums |
| `packages/database/supabase/functions/admin-control/index.ts` | Role hierarchy, target protection, role restrictions per action |
| `apps/frontend/src/app/(dashboard)/admin/users/page.tsx` | Conditional action buttons based on caller role |

---

## 6. Out of Scope

- Any changes to stock operations or inventory
- NestJS API changes (deprecated/phase-out)
- PowerSync local-write migration
- Multi-SUPERADMIN management (single hardcoded SUPERADMIN only)
