# Projects Spec — Ingexpert

> **Source of Truth for Endpoint Contracts**: Before implementing any project route, data model change, or frontend hook, read **`openapi/openapi.json`** for the exact endpoint shapes, request/response schemas, and authentication requirements for this domain.

Covers: Project management — `Project` model, `managerId` FK requirement, delete restriction when movements exist, project schemas.

---

## Project Model

| Field       | Type                         | Notes                                                      |
| ----------- | ---------------------------- | ---------------------------------------------------------- |
| `id`        | `String`                     | UUID                                                       |
| `name`      | `String`                     | Must be unique                                             |
| `contact`   | `String`                     | Contact person name                                        |
| `address`   | `String`                     | Physical address                                           |
| `managerId` | `String` (FK→User, required) | Manager must exist in `User` table; `hasAuth` not required |

---

## Delete Restriction

`Project` has an `onDelete: Restrict` constraint via its FK on `Movement.projectId`.

**Rule:** Before any delete operation, the service **must** pre-check for existing movements:

```typescript
const movementCount = await this.prisma.movement.count({ where: { projectId: id } });
if (movementCount > 0) {
  throw new BadRequestException('Cannot delete a project with associated movements.');
}
```

Never allow Prisma to surface the raw FK constraint error to the client.

---

## managerId Constraint

Every project requires a `managerId` referencing an existing `User` row. The referenced user does **not** need `hasAuth: true` — they may be a system-tracked user without login capability.

---

## Domain Inventory

| Domain   | API module  | Frontend feature     | Notes                                                                |
| -------- | ----------- | -------------------- | -------------------------------------------------------------------- |
| Projects | `projects/` | `features/projects/` | Cannot delete if linked movements exist. `managerId` → FK to `User`. |

---

## Schema — Projects Domain Module

| File                | DTOs                                                                    | Entities        | Output schemas                                                   |
| ------------------- | ----------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `project.schema.ts` | `CreateProjectSchema`, `UpdateProjectSchema`, `ProjectPaginationSchema` | `ProjectEntity` | `ProjectEntitySchema`, `ProjectListSchema`, `ProjectStatsSchema` |

`ProjectEntity` requires no type overrides:

```typescript
export type ProjectEntity = Project;
```

---

## Requirement: Projects list SHALL be readable from local PowerSync state

Project-facing screens used in dashboard workflows MUST support loading from local PowerSync SQLite data so project information remains available without internet access.

#### Scenario: Projects page loads while offline

- **WHEN** the user opens the projects dashboard page without network connectivity
- **THEN** the page MUST read project rows from local `projects` table via PowerSync query
- **THEN** previously synchronized projects MUST render without requiring a live tRPC request

#### Scenario: Local project list supports UI filtering/sorting

- **WHEN** the user applies search, sorting, or pagination controls on projects page
- **THEN** the UI MUST apply those controls against local query results consistently while offline

## Requirement: Project form dependencies SHALL use local-only synchronized reads after cutover

Project create/edit forms MUST resolve manager selection from synchronized local user rows once migration is finalized, without runtime API fallback branches.

#### Scenario: Project form opens in finalized migration mode

- **WHEN** a user opens project create/edit form
- **THEN** manager options MUST be populated from synchronized local user rows
- **THEN** no runtime `users.listNames` API fallback branch may execute

## Requirement: Project migrated read paths SHALL be local-only at runtime

Project list and stats reads that have passed migration acceptance MUST run from local data only.

#### Scenario: Projects dashboard cards and lists render

- **WHEN** projects list or stats data is requested in migrated flows
- **THEN** values MUST come from local synchronized data with parity-preserved semantics
- **THEN** retired project read/stats API endpoints MUST not be called

## Requirement: Project stats cutover SHALL retain deterministic totals

Project stats migration MUST retain deterministic total-project semantics under local-first execution.

#### Scenario: Project stats are sourced locally

- **WHEN** local compute is enabled for project stats
- **THEN** the `total` project count MUST meet parity acceptance criteria versus API output
- **THEN** any sustained mismatch MUST trigger rollback

## Requirement: Project write authority SHALL preserve API admin controls

Project create/update/delete operations MUST remain API-owned while admin RBAC and delete-linked-movement restrictions are enforced server-side.

#### Scenario: Project mutation is invoked from frontend

- **WHEN** a project create, update, or delete action is submitted
- **THEN** the action MUST be enforced through API admin-protected procedures
- **THEN** local-only reads MUST remain compatible with the resulting synchronized state
