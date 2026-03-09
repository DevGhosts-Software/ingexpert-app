# Database Spec — `packages/database`

Prisma ORM + PostgreSQL. The Prisma schema is the **source of truth** for all data models. Changes here propagate to `@ingexpert/schema` entity types and service mappers.

---

## Core Models

| Model | Key fields | Notes |
|---|---|---|
| `User` | `id`, `email`, `role: UserRole`, `name?`, `avatar?`, `hasAuth: Boolean` | `hasAuth` tracks whether user can log in (has Supabase Auth account) |
| `Staff` | `userId` (FK→User), `workAreaId?` (FK→WorkArea, `onDelete: SetNull`) | Extended user profile for movement responsibility tracking |
| `WorkArea` | `id`, `name @unique` | Normalized department/area. One WorkArea → many Staff (1-N) |
| `Item` | `id`, `code`, `name`, `location`, `stock: Decimal`, `unit`, `type: ItemType`, `imageUrl` | KIT items have no meaningful stock or location |
| `Movement` | `id`, `type: MovementType`, `createdById` (FK→User), `responsibleDeliveryId?`, `responsibleReceiptId?`, `projectId?`, `destination?`, `observations?`, `date: DateTime` | Immutable audit log |
| `MovementDetail` | `id`, `movementId` (FK→Movement), `itemId` (FK→Item), `quantity: Decimal` | Line items for a movement |
| `Project` | `id`, `name`, `contact`, `address`, `managerId` (FK→User, required) | Manager must exist in `users` table; no Supabase Auth required |

---

## Enums

| Enum | Values |
|---|---|
| `UserRole` | `ADMIN`, `USER` |
| `ItemType` | `PRODUCT`, `EQUIPMENT`, `TOOL`, `KIT` |
| `MovementType` | `PURCHASE` (entry/buy), `RETURN` (entry/return), `EXIT` (exit to project), `WRITEOFF` (exit/disposal) |

---

## Data Type Serialization

| DB type | Prisma type | Wire type | How to convert |
|---|---|---|---|
| `Decimal` | `Prisma.Decimal` | `number` | `.toNumber()` in service mapper |
| `DateTime` | `Date` | `string` | ISO string over JSON (automatic) |

Always call `.toNumber()` on `stock` (Item) and `quantity` (MovementDetail) before returning from service mappers.

---

## Relation Constraints

| Constraint | Where used | Effect |
|---|---|---|
| `onDelete: Restrict` | `Project → Movement` | Cannot delete a Project while Movements reference it. Add a pre-check in the service with a user-friendly tRPC error. |
| `onDelete: SetNull` | `Staff → WorkArea` | Deleting a WorkArea sets `workAreaId` to null on related Staff records, not deleting the user. |
| `onDelete: Cascade` | `Movement → MovementDetail` | Deleting a Movement removes its line items. |

---

## Schema Update Workflow

1. **Edit** `packages/database/prisma/schema/*.prisma`
2. **Generate** — `pnpm db:generate` (updates Prisma Client + types)
3. **Migrate** — `pnpm db:migrate` (creates and applies SQL migration)
4. **Entity check** — any new DB column causes a TypeScript error in the corresponding `mapXxx()` service method. Update the mapper to resolve it.
5. **Rebuild schema package** — `pnpm --filter @ingexpert/schema build`
6. **`pnpm check`** — must pass before committing

---

## WorkArea Upsert Pattern

When an external API field maps to a normalized FK (e.g. `workArea: string` → `WorkArea` table), use a private `upsertWorkArea(tx, name)` helper in the service:

```typescript
private async upsertWorkArea(tx: PrismaTx, name: string): Promise<WorkArea> {
  return tx.workArea.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}
```

This keeps the external API accepting plain strings while the DB stays normalized.

---

## Seed (`prisma/seed.ts`)

Run with `pnpm db:seed`. The seed is **idempotent** — checks for existing data before inserting.

| Section | Data |
|---|---|
| Users | `admin@ingexpert.com` (ADMIN) + `user@ingexpert.com` (USER) via Supabase Auth + local DB upsert |
| Items | 40 PRODUCT · 15 EQUIPMENT · 25 TOOL · 10 KIT (90 total). KITs get `stock: 0, location: ''`. |
| Kit compositions | Each KIT with no components gets 3–6 random PRODUCT/TOOL components. |
| Projects | 5 sample projects; `managerId` set to seeded admin's ID. |
| SQL policies | Runs `app-data bucket policies.sql` (Supabase storage + `is_admin()` function). |

---

## Best Practices

- **Enums:** Use database-level enums (`UserRole`, `ItemType`, `MovementType`). Re-export from `@ingexpert/database` in `packages/schema`.
- **Decimal fields:** Always `.toNumber()` in mappers — never pass raw `Prisma.Decimal` over tRPC.
- **Transactions:** Use `prisma.$transaction` for any operation that mutates stock + creates a movement atomically.
- **Error surfacing:** For `onDelete: Restrict` violations, add a pre-check in the service and throw a NestJS `BadRequestException` with a user-friendly message — never let the raw DB error reach the client.
