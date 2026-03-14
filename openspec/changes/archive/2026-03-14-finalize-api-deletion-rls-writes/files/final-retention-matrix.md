# Final API Retirement Matrix — `finalize-api-deletion-rls-writes`

## 1) Frontend runtime usage evidence

| Procedure                | Frontend call-site(s)                                                                                                                 | Replacement target                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `users.me`               | `app/(dashboard)/layout.tsx`, `app/(dashboard)/page.tsx`, `hooks/use-is-admin.ts`, `features/users/components/user-table.columns.tsx` | Supabase session + local `users` PowerSync row resolution           |
| `users.updateMe`         | `features/users/components/user-profile-sheet.tsx`                                                                                    | Local write to `users` row (`id = auth.uid()`) under RLS            |
| `users.updateMyPassword` | `features/users/components/user-profile-sheet.tsx`                                                                                    | Supabase `auth.updateUser({ password })`                            |
| `projects.create`        | `features/projects/components/project-form-sheet.tsx`                                                                                 | Local `INSERT INTO projects ...` (PowerSync write transaction)      |
| `projects.update`        | `features/projects/components/project-form-sheet.tsx`                                                                                 | Local `UPDATE projects ...` (PowerSync write transaction)           |
| `projects.remove`        | `features/projects/components/project-delete-sheet.tsx`                                                                               | Local guarded delete path under DB/RLS constraints                  |
| `items.remove`           | `features/inventory/components/item-delete-dialog.tsx`                                                                                | Local delete transaction for `items` + linked `kit_details` cleanup |
| `kits.setComponents`     | `features/inventory/components/item-form-sheet.tsx`                                                                                   | Local `kit_details` replace transaction                             |
| `kits.clearKit`          | `features/inventory/components/item-form-sheet.tsx`                                                                                   | Local `DELETE FROM kit_details WHERE kit_id = ?`                    |

## 2) OpenAPI cross-check

From `apps/api/openapi/openapi.json`:

- Present and must be retired:
  - `users-me`
  - `users-updateMe`
  - `users-updateMyPassword`
  - `projects-create`
  - `projects-update`
- Retire but not directly exposed in OpenAPI due primitive inputs:
  - `projects.remove`
  - `items.remove`
  - `kits.setComponents`
  - `kits.clearKit`

## 3) Router/service deletion map

### Users

- Router: `apps/api/src/users/users.router.ts`
  - remove procedures: `me`, `updateMe`, `updateMyPassword`
- Service(s):
  - `apps/api/src/users/services/users.service.ts`
    - remove now-unused methods if no remaining callers: `findOrCreate`, and possibly `update` if only self-update path used
  - `apps/api/src/users/services/admin-users.service.ts`
    - preserve admin methods; remove only self-password coupling if it becomes unused by non-admin paths

### Projects

- Router: `apps/api/src/projects/projects.router.ts`
  - remove procedures: `create`, `update`, `remove`
- Service: `apps/api/src/projects/projects.service.ts`
  - remove methods: `create`, `update`, `remove`
  - preserve read methods used by retained paths: `findPaginated`, `findAll`

### Items

- Router: `apps/api/src/items/items.router.ts`
  - remove procedure: `remove`
- Service: `apps/api/src/items/items.service.ts`
  - remove method: `remove`
  - preserve: list/create/update/import/getAll and related helpers

### Kits

- Router: `apps/api/src/kits/kits.router.ts`
  - remove procedures: `setComponents`, `clearKit`
- Service: `apps/api/src/kits/kits.service.ts`
  - remove methods: `setComponents`, `clearKit`
  - preserve: `getAllWithComponents`, `importMany`

## 4) Retained API surface intent after this change

- Keep:
  - `adminUsers.*`
  - batch imports: `items.importMany`, `kits.importMany`
  - plus other retained read/operational procedures not in final retirement set
- Remove:
  - full target set listed in section (1)
