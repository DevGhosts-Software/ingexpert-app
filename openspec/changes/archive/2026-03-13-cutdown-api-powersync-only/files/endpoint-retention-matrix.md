## Endpoint Retention Matrix (Task 1.1 + 1.2)

Source evidence:

- Frontend runtime call-site scan: `apps/frontend/src/**/*.ts*` (`trpc.*.*.useQuery` and related usage)
- API contract: `apps/api/openapi/openapi.json`
- Router/service targets: `apps/api/src/**/*.router.ts`, `apps/api/src/**/services/*.service.ts`

Legend:

- `retain`: endpoint/procedure remains required in current runtime
- `remove-ready`: no active runtime dependency and safe for retirement now
- `remove-after-frontend-cleanup`: intended for removal in this change after fallback branch cleanup

| Procedure                      | Current runtime usage evidence                                            | OpenAPI exposure                | Decision                              | Router target           | Service target           |
| ------------------------------ | ------------------------------------------------------------------------- | ------------------------------- | ------------------------------------- | ----------------------- | ------------------------ |
| `auth.login`                   | `login-form.tsx` mutation                                                 | yes (`/auth/login`)             | retain                                | `auth.router.ts`        | `auth.service.ts`        |
| `auth.refresh`                 | `trpc-provider.tsx` mutation                                              | yes (`/auth/refresh`)           | retain                                | `auth.router.ts`        | `auth.service.ts`        |
| `auth.logout`                  | `app/(dashboard)/layout.tsx` mutation                                     | yes (`/auth/logout`)            | retain                                | `auth.router.ts`        | `auth.service.ts`        |
| `users.me`                     | layout/dashboard/hooks/row-actions query                                  | yes (`/users/me`)               | retain                                | `users.router.ts`       | `users.service.ts`       |
| `users.updateMe`               | `user-profile-sheet.tsx` mutation                                         | yes (`/users/me`)               | retain                                | `users.router.ts`       | `users.service.ts`       |
| `users.updateMyPassword`       | `user-profile-sheet.tsx` mutation                                         | yes (`/users/me/password`)      | retain                                | `users.router.ts`       | `admin-users.service.ts` |
| `adminUsers.list`              | `admin/users/page.tsx` query                                              | yes (`/admin/users`)            | retain                                | `admin-users.router.ts` | `admin-users.service.ts` |
| `adminUsers.create`            | `user-create-sheet.tsx` mutation                                          | yes (`/admin/users`)            | retain                                | `admin-users.router.ts` | `admin-users.service.ts` |
| `adminUsers.createWithoutAuth` | `user-create-sheet.tsx` mutation                                          | yes (`/admin/users/no-auth`)    | retain                                | `admin-users.router.ts` | `admin-users.service.ts` |
| `adminUsers.update`            | `user-edit-sheet.tsx` mutation                                            | yes (`/admin/users`)            | retain                                | `admin-users.router.ts` | `admin-users.service.ts` |
| `adminUsers.updatePassword`    | `user-table.columns.tsx` mutation                                         | yes (`/admin/users/password`)   | retain                                | `admin-users.router.ts` | `admin-users.service.ts` |
| `adminUsers.grantAuth`         | `user-table.columns.tsx` mutation                                         | yes (`/admin/users/grant-auth`) | retain                                | `admin-users.router.ts` | `admin-users.service.ts` |
| `adminUsers.revokeAuth`        | `user-table.columns.tsx` mutation                                         | no (primitive input)            | retain                                | `admin-users.router.ts` | `admin-users.service.ts` |
| `adminUsers.remove`            | `user-table.columns.tsx` mutation                                         | no (primitive input)            | retain                                | `admin-users.router.ts` | `admin-users.service.ts` |
| `items.importMany`             | `import-excel-dialog.tsx` mutation                                        | no (array input)                | retain                                | `items.router.ts`       | `items.service.ts`       |
| `items.remove`                 | `item-delete-dialog.tsx` mutation                                         | no (primitive input)            | retain                                | `items.router.ts`       | `items.service.ts`       |
| `items.list`                   | pagination/filter runtime path (inventory table stack)                    | yes (`/items/list`)             | retain                                | `items.router.ts`       | `items.service.ts`       |
| `items.getAll`                 | admin list consumers in legacy invalidation paths                         | yes (`/items/all`)              | retain                                | `items.router.ts`       | `items.service.ts`       |
| `kits.setComponents`           | `item-form-sheet.tsx` mutation                                            | no                              | retain                                | `kits.router.ts`        | `kits.service.ts`        |
| `kits.clearKit`                | `item-form-sheet.tsx` mutation                                            | no                              | retain                                | `kits.router.ts`        | `kits.service.ts`        |
| `kits.importMany`              | `import-excel-dialog.tsx` mutation                                        | no                              | retain                                | `kits.router.ts`        | `kits.service.ts`        |
| `projects.create`              | `project-form-sheet.tsx` mutation                                         | yes (`/projects`)               | retain                                | `projects.router.ts`    | `projects.service.ts`    |
| `projects.update`              | `project-form-sheet.tsx` mutation                                         | yes (`/projects/{id}`)          | retain                                | `projects.router.ts`    | `projects.service.ts`    |
| `projects.remove`              | `project-delete-sheet.tsx` mutation                                       | no (primitive input)            | retain                                | `projects.router.ts`    | `projects.service.ts`    |
| `movements.getAll`             | project form/delete invalidation dependencies                             | yes (`/movements`)              | retain                                | `movements.router.ts`   | `movements.service.ts`   |
| `users.listNames`              | `project-form-sheet.tsx` fallback query removed; local-only read retained | yes (`/users/names`)            | remove-ready (retired in this change) | `users.router.ts`       | `users.service.ts`       |
| `adminUsers.getWorkAreas`      | users screens fallback query removed; local-only read retained            | yes (`/admin/users/work-areas`) | remove-ready (retired in this change) | `admin-users.router.ts` | `admin-users.service.ts` |
| `kits.getComponents`           | inventory form/details fallback query removed; local-only read retained   | no (primitive input)            | remove-ready (retired in this change) | `kits.router.ts`        | `kits.service.ts`        |
| `items.getStats`               | dashboard fallback query removed; local SQLite stats retained             | yes (`/items/stats`)            | remove-ready (retired in this change) | `items.router.ts`       | `items.service.ts`       |
| `movements.getStats`           | dashboard fallback query removed; local SQLite stats retained             | yes (`/movements/stats`)        | remove-ready (retired in this change) | `movements.router.ts`   | `movements.service.ts`   |
| `projects.getStats`            | dashboard fallback query removed; local SQLite stats retained             | yes (`/projects/stats`)         | remove-ready (retired in this change) | `projects.router.ts`    | `projects.service.ts`    |
| `adminUsers.getStats`          | dashboard/admin fallback query removed; local SQLite stats retained       | yes (`/admin/users/stats`)      | remove-ready (retired in this change) | `admin-users.router.ts` | `admin-users.service.ts` |
| `items.getCounts`              | no runtime query (invalidate-only references)                             | yes (`/items/counts`)           | remove-ready                          | `items.router.ts`       | `items.service.ts`       |
| `items.getLocations`           | no runtime query (invalidate-only references)                             | yes (`/items/locations`)        | remove-ready                          | `items.router.ts`       | `items.service.ts`       |
