# tRPC Usage Summary

Generated from `apps/frontend/src/**/*.ts(x)` for change `audit-frontend-trpc-api-usage`.

| Domain     | Procedure                    | Occurrences | Call types        | Classification(s)      | Feature ownership                                             |
| ---------- | ---------------------------- | ----------: | ----------------- | ---------------------- | ------------------------------------------------------------- |
| adminUsers | adminUsers.create            |           1 | useMutation       | Server Authority Write | Users/Admin                                                   |
| adminUsers | adminUsers.createWithoutAuth |           1 | useMutation       | Server Authority Write | Users/Admin                                                   |
| adminUsers | adminUsers.getStats          |           5 | useQuery, utility | Server Compute Read    | Dashboard, Users/Admin                                        |
| adminUsers | adminUsers.getWorkAreas      |           5 | useQuery, utility | Local-Computable Read  | Users/Admin                                                   |
| adminUsers | adminUsers.grantAuth         |           1 | useMutation       | Server Authority Write | Users/Admin                                                   |
| adminUsers | adminUsers.list              |           6 | useQuery, utility | Migration Candidate    | Users/Admin                                                   |
| adminUsers | adminUsers.remove            |           1 | useMutation       | Server Authority Write | Users/Admin                                                   |
| adminUsers | adminUsers.revokeAuth        |           1 | useMutation       | Server Authority Write | Users/Admin                                                   |
| adminUsers | adminUsers.update            |           1 | useMutation       | Server Authority Write | Users/Admin                                                   |
| adminUsers | adminUsers.updatePassword    |           1 | useMutation       | Server Authority Write | Users/Admin                                                   |
| auth       | auth.login                   |           1 | useMutation       | Identity/Auth          | Identity                                                      |
| auth       | auth.logout                  |           1 | useMutation       | Identity/Auth          | Dashboard/AuthShell                                           |
| auth       | auth.refresh                 |           1 | useMutation       | Identity/Auth          | Shared                                                        |
| items      | items.getCounts              |           2 | utility           | Migration Candidate    | Inventory                                                     |
| items      | items.getLocations           |           2 | utility           | Migration Candidate    | Inventory                                                     |
| items      | items.getStats               |           3 | useQuery, utility | Server Compute Read    | Dashboard, Inventory                                          |
| items      | items.importMany             |           1 | useMutation       | Server Authority Write | Inventory                                                     |
| items      | items.list                   |           2 | utility           | Migration Candidate    | Inventory                                                     |
| items      | items.remove                 |           1 | useMutation       | Server Authority Write | Inventory                                                     |
| kits       | kits.clearKit                |           1 | useMutation       | Server Authority Write | Inventory                                                     |
| kits       | kits.getAllWithComponents    |           1 | utility           | Migration Candidate    | Inventory                                                     |
| kits       | kits.getComponents           |           2 | useQuery          | Local-Computable Read  | Inventory                                                     |
| kits       | kits.importMany              |           1 | useMutation       | Server Authority Write | Inventory                                                     |
| kits       | kits.setComponents           |           1 | useMutation       | Server Authority Write | Inventory                                                     |
| movements  | movements.getAll             |           2 | utility           | Migration Candidate    | Projects                                                      |
| movements  | movements.getStats           |           1 | useQuery          | Server Compute Read    | Dashboard                                                     |
| projects   | projects.create              |           1 | useMutation       | Server Authority Write | Projects                                                      |
| projects   | projects.getAll              |           2 | utility           | Migration Candidate    | Projects                                                      |
| projects   | projects.getStats            |           1 | useQuery          | Server Compute Read    | Dashboard                                                     |
| projects   | projects.list                |           2 | utility           | Migration Candidate    | Projects                                                      |
| projects   | projects.remove              |           1 | useMutation       | Server Authority Write | Projects                                                      |
| projects   | projects.update              |           1 | useMutation       | Server Authority Write | Projects                                                      |
| users      | users.listNames              |           1 | useQuery          | Local-Computable Read  | Projects                                                      |
| users      | users.me                     |           8 | useQuery, utility | Identity/Auth          | Dashboard, Dashboard/AuthShell, Identity, Shared, Users/Admin |
| users      | users.updateMe               |           1 | useMutation       | Server Authority Write | Users/Admin                                                   |
| users      | users.updateMyPassword       |           1 | useMutation       | Server Authority Write | Users/Admin                                                   |

## File Coverage

- `adminUsers.create` (adminUsers):
  - `apps/frontend/src/features/users/components/user-create-sheet.tsx`
- `adminUsers.createWithoutAuth` (adminUsers):
  - `apps/frontend/src/features/users/components/user-create-sheet.tsx`
- `adminUsers.getStats` (adminUsers):
  - `apps/frontend/src/app/(dashboard)/admin/users/page.tsx`
  - `apps/frontend/src/app/(dashboard)/page.tsx`
  - `apps/frontend/src/features/users/components/user-create-sheet.tsx`
  - `apps/frontend/src/features/users/components/user-edit-sheet.tsx`
  - `apps/frontend/src/features/users/components/user-table.columns.tsx`
- `adminUsers.getWorkAreas` (adminUsers):
  - `apps/frontend/src/app/(dashboard)/admin/users/page.tsx`
  - `apps/frontend/src/features/users/components/user-create-sheet.tsx`
  - `apps/frontend/src/features/users/components/user-edit-sheet.tsx`
- `adminUsers.grantAuth` (adminUsers):
  - `apps/frontend/src/features/users/components/user-table.columns.tsx`
- `adminUsers.list` (adminUsers):
  - `apps/frontend/src/app/(dashboard)/admin/users/page.tsx`
  - `apps/frontend/src/features/users/components/user-create-sheet.tsx`
  - `apps/frontend/src/features/users/components/user-edit-sheet.tsx`
  - `apps/frontend/src/features/users/components/user-table.columns.tsx`
- `adminUsers.remove` (adminUsers):
  - `apps/frontend/src/features/users/components/user-table.columns.tsx`
- `adminUsers.revokeAuth` (adminUsers):
  - `apps/frontend/src/features/users/components/user-table.columns.tsx`
- `adminUsers.update` (adminUsers):
  - `apps/frontend/src/features/users/components/user-edit-sheet.tsx`
- `adminUsers.updatePassword` (adminUsers):
  - `apps/frontend/src/features/users/components/user-table.columns.tsx`
- `auth.login` (auth):
  - `apps/frontend/src/features/auth/components/login-form.tsx`
- `auth.logout` (auth):
  - `apps/frontend/src/app/(dashboard)/layout.tsx`
- `auth.refresh` (auth):
  - `apps/frontend/src/components/providers/trpc-provider.tsx`
- `items.getCounts` (items):
  - `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`
  - `apps/frontend/src/features/inventory/components/item-delete-dialog.tsx`
- `items.getLocations` (items):
  - `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`
  - `apps/frontend/src/features/inventory/components/item-delete-dialog.tsx`
- `items.getStats` (items):
  - `apps/frontend/src/app/(dashboard)/page.tsx`
  - `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`
  - `apps/frontend/src/features/inventory/components/item-delete-dialog.tsx`
- `items.importMany` (items):
  - `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`
- `items.list` (items):
  - `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`
  - `apps/frontend/src/features/inventory/components/item-delete-dialog.tsx`
- `items.remove` (items):
  - `apps/frontend/src/features/inventory/components/item-delete-dialog.tsx`
- `kits.clearKit` (kits):
  - `apps/frontend/src/features/inventory/components/item-form-sheet.tsx`
- `kits.getAllWithComponents` (kits):
  - `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`
- `kits.getComponents` (kits):
  - `apps/frontend/src/features/inventory/components/item-details-sheet.tsx`
  - `apps/frontend/src/features/inventory/components/item-form-sheet.tsx`
- `kits.importMany` (kits):
  - `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`
- `kits.setComponents` (kits):
  - `apps/frontend/src/features/inventory/components/item-form-sheet.tsx`
- `movements.getAll` (movements):
  - `apps/frontend/src/features/projects/components/project-delete-sheet.tsx`
  - `apps/frontend/src/features/projects/components/project-form-sheet.tsx`
- `movements.getStats` (movements):
  - `apps/frontend/src/app/(dashboard)/page.tsx`
- `projects.create` (projects):
  - `apps/frontend/src/features/projects/components/project-form-sheet.tsx`
- `projects.getAll` (projects):
  - `apps/frontend/src/features/projects/components/project-delete-sheet.tsx`
  - `apps/frontend/src/features/projects/components/project-form-sheet.tsx`
- `projects.getStats` (projects):
  - `apps/frontend/src/app/(dashboard)/page.tsx`
- `projects.list` (projects):
  - `apps/frontend/src/features/projects/components/project-delete-sheet.tsx`
  - `apps/frontend/src/features/projects/components/project-form-sheet.tsx`
- `projects.remove` (projects):
  - `apps/frontend/src/features/projects/components/project-delete-sheet.tsx`
- `projects.update` (projects):
  - `apps/frontend/src/features/projects/components/project-form-sheet.tsx`
- `users.listNames` (users):
  - `apps/frontend/src/features/projects/components/project-form-sheet.tsx`
- `users.me` (users):
  - `apps/frontend/src/app/(dashboard)/layout.tsx`
  - `apps/frontend/src/app/(dashboard)/page.tsx`
  - `apps/frontend/src/features/auth/components/login-form.tsx`
  - `apps/frontend/src/features/users/components/user-profile-sheet.tsx`
  - `apps/frontend/src/features/users/components/user-table.columns.tsx`
  - `apps/frontend/src/hooks/use-is-admin.ts`
- `users.updateMe` (users):
  - `apps/frontend/src/features/users/components/user-profile-sheet.tsx`
- `users.updateMyPassword` (users):
  - `apps/frontend/src/features/users/components/user-profile-sheet.tsx`
