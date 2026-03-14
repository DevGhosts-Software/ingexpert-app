# OpenAPI to tRPC Mapping Notes

Source contracts: `apps/api/openapi/openapi.json`

| Procedure                      | Call type(s)        | Expected operationId           | Endpoint                       | Classification         | Notes                                                                                            |
| ------------------------------ | ------------------- | ------------------------------ | ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `adminUsers.create`            | `useMutation`       | `adminUsers-create`            | POST `/admin/users`            | Server Authority Write | Contract present in OpenAPI.                                                                     |
| `adminUsers.createWithoutAuth` | `useMutation`       | `adminUsers-createWithoutAuth` | POST `/admin/users/no-auth`    | Server Authority Write | Contract present in OpenAPI.                                                                     |
| `adminUsers.getStats`          | `useQuery, utility` | `adminUsers-getStats`          | GET `/admin/users/stats`       | Server Compute Read    | Contract present in OpenAPI.                                                                     |
| `adminUsers.getWorkAreas`      | `useQuery, utility` | `adminUsers-getWorkAreas`      | GET `/admin/users/work-areas`  | Local-Computable Read  | Contract present in OpenAPI.                                                                     |
| `adminUsers.grantAuth`         | `useMutation`       | `adminUsers-grantAuth`         | POST `/admin/users/grant-auth` | Server Authority Write | Contract present in OpenAPI.                                                                     |
| `adminUsers.list`              | `useQuery, utility` | `adminUsers-list`              | GET `/admin/users`             | Migration Candidate    | Contract present in OpenAPI.                                                                     |
| `adminUsers.remove`            | `useMutation`       | `adminUsers-remove`            | —                              | Server Authority Write | Procedure used in frontend but missing from OpenAPI contract; investigate tRPC OpenAPI exposure. |
| `adminUsers.revokeAuth`        | `useMutation`       | `adminUsers-revokeAuth`        | —                              | Server Authority Write | Procedure used in frontend but missing from OpenAPI contract; investigate tRPC OpenAPI exposure. |
| `adminUsers.update`            | `useMutation`       | `adminUsers-update`            | PATCH `/admin/users`           | Server Authority Write | Contract present in OpenAPI.                                                                     |
| `adminUsers.updatePassword`    | `useMutation`       | `adminUsers-updatePassword`    | POST `/admin/users/password`   | Server Authority Write | Contract present in OpenAPI.                                                                     |
| `auth.login`                   | `useMutation`       | `auth-login`                   | POST `/auth/login`             | Identity/Auth          | Contract present in OpenAPI.                                                                     |
| `auth.logout`                  | `useMutation`       | `auth-logout`                  | POST `/auth/logout`            | Identity/Auth          | Contract present in OpenAPI.                                                                     |
| `auth.refresh`                 | `useMutation`       | `auth-refresh`                 | POST `/auth/refresh`           | Identity/Auth          | Contract present in OpenAPI.                                                                     |
| `items.getCounts`              | `utility`           | `items-getCounts`              | GET `/items/counts`            | Migration Candidate    | Contract present in OpenAPI.                                                                     |
| `items.getLocations`           | `utility`           | `items-getLocations`           | GET `/items/locations`         | Migration Candidate    | Contract present in OpenAPI.                                                                     |
| `items.getStats`               | `useQuery, utility` | `items-getStats`               | GET `/items/stats`             | Server Compute Read    | Contract present in OpenAPI.                                                                     |
| `items.importMany`             | `useMutation`       | `items-importMany`             | —                              | Server Authority Write | Procedure used in frontend but missing from OpenAPI contract; investigate tRPC OpenAPI exposure. |
| `items.list`                   | `utility`           | `items-list`                   | POST `/items/list`             | Migration Candidate    | Contract present in OpenAPI.                                                                     |
| `items.remove`                 | `useMutation`       | `items-remove`                 | —                              | Server Authority Write | Procedure used in frontend but missing from OpenAPI contract; investigate tRPC OpenAPI exposure. |
| `kits.clearKit`                | `useMutation`       | `kits-clearKit`                | —                              | Server Authority Write | Procedure used in frontend but missing from OpenAPI contract; investigate tRPC OpenAPI exposure. |
| `kits.getAllWithComponents`    | `utility`           | `kits-getAllWithComponents`    | GET `/kits`                    | Migration Candidate    | Contract present in OpenAPI.                                                                     |
| `kits.getComponents`           | `useQuery`          | `kits-getComponents`           | —                              | Local-Computable Read  | Procedure used in frontend but missing from OpenAPI contract; investigate tRPC OpenAPI exposure. |
| `kits.importMany`              | `useMutation`       | `kits-importMany`              | —                              | Server Authority Write | Procedure used in frontend but missing from OpenAPI contract; investigate tRPC OpenAPI exposure. |
| `kits.setComponents`           | `useMutation`       | `kits-setComponents`           | —                              | Server Authority Write | Procedure used in frontend but missing from OpenAPI contract; investigate tRPC OpenAPI exposure. |
| `movements.getAll`             | `utility`           | `movements-getAll`             | GET `/movements`               | Migration Candidate    | Contract present in OpenAPI.                                                                     |
| `movements.getStats`           | `useQuery`          | `movements-getStats`           | GET `/movements/stats`         | Server Compute Read    | Contract present in OpenAPI.                                                                     |
| `projects.create`              | `useMutation`       | `projects-create`              | POST `/projects`               | Server Authority Write | Contract present in OpenAPI.                                                                     |
| `projects.getAll`              | `utility`           | `projects-getAll`              | GET `/projects/all`            | Migration Candidate    | Contract present in OpenAPI.                                                                     |
| `projects.getStats`            | `useQuery`          | `projects-getStats`            | GET `/projects/stats`          | Server Compute Read    | Contract present in OpenAPI.                                                                     |
| `projects.list`                | `utility`           | `projects-list`                | GET `/projects`                | Migration Candidate    | Contract present in OpenAPI.                                                                     |
| `projects.remove`              | `useMutation`       | `projects-remove`              | —                              | Server Authority Write | Procedure used in frontend but missing from OpenAPI contract; investigate tRPC OpenAPI exposure. |
| `projects.update`              | `useMutation`       | `projects-update`              | PATCH `/projects/{id}`         | Server Authority Write | Contract present in OpenAPI.                                                                     |
| `users.listNames`              | `useQuery`          | `users-listNames`              | GET `/users/names`             | Local-Computable Read  | Contract present in OpenAPI.                                                                     |
| `users.me`                     | `useQuery, utility` | `users-me`                     | GET `/users/me`                | Identity/Auth          | Contract present in OpenAPI.                                                                     |
| `users.updateMe`               | `useMutation`       | `users-updateMe`               | PATCH `/users/me`              | Server Authority Write | Contract present in OpenAPI.                                                                     |
| `users.updateMyPassword`       | `useMutation`       | `users-updateMyPassword`       | POST `/users/me/password`      | Server Authority Write | Contract present in OpenAPI.                                                                     |

## Gaps / Follow-ups

- Frontend-used procedures missing in OpenAPI:
  - `adminUsers.remove`
  - `adminUsers.revokeAuth`
  - `items.importMany`
  - `items.remove`
  - `kits.clearKit`
  - `kits.getComponents`
  - `kits.importMany`
  - `kits.setComponents`
  - `projects.remove`
- Review whether each is intentionally tRPC-only or missing OpenAPI metadata/output schema coverage.
