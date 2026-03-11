# Projects Spec — Ingexpert

> **Source of Truth for Endpoint Contracts**: Before implementing any project route, data model change, or frontend hook, read **`openapi/openapi.json`** for the exact endpoint shapes, request/response schemas, and authentication requirements for this domain.

Covers: Project management — `Project` model, `managerId` FK requirement, delete restriction when movements exist, project schemas.

---

## Project Model

| Field | Type | Notes |
|---|---|---|
| `id` | `String` | UUID |
| `name` | `String` | Must be unique |
| `contact` | `String` | Contact person name |
| `address` | `String` | Physical address |
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

| Domain | API module | Frontend feature | Notes |
|---|---|---|---|
| Projects | `projects/` | `features/projects/` | Cannot delete if linked movements exist. `managerId` → FK to `User`. |

---

## Schema — Projects Domain Module

| File | DTOs | Entities | Output schemas |
|---|---|---|---|
| `project.schema.ts` | `CreateProjectSchema`, `UpdateProjectSchema`, `ProjectPaginationSchema` | `ProjectEntity` | `ProjectEntitySchema`, `ProjectListSchema`, `ProjectStatsSchema` |

`ProjectEntity` requires no type overrides:
```typescript
export type ProjectEntity = Project;
```
