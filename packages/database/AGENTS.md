# @ingexpert/database - Agent Context

This package manages the persistence layer for the Ingexpert application using Prisma ORM and PostgreSQL.

## 1. Project Overview

**@ingexpert/database** is the central hub for database definitions and client generation. It exports the Prisma Client instance used by the API, and exports all Prisma-generated model types used as the basis for entity types in `@ingexpert/schema`.

## 2. Core Models

- **User:** System users with roles (`ADMIN`, `USER`). Has `hasAuth: Boolean` — tracks whether the user has a corresponding Supabase Auth account (can log in).
- **Staff:** Extended user information. Relates to `WorkArea` via `workAreaId` FK (`onDelete: SetNull`). Used for movement responsibility tracking.
- **WorkArea:** Normalized area/department model (`id`, `name @unique`). One WorkArea → many Staff records (1-N). Was previously a denormalized `String?` on Staff.
- **Item:** Inventory items (`PRODUCT`, `EQUIPMENT`, `TOOL`, `KIT`) with stock (`Decimal`) and optional location. `KIT` items have no meaningful stock or location — they are logical groupings only.
- **Movement:** Log of stock operations. `MovementType` enum: `PURCHASE` (entry/purchase), `RETURN` (entry/return from project), `EXIT` (exit to project/destination), `WRITEOFF` (exit/write-off — loss, damage, or disposal). Has `creatorId` (FK to `User`), `responsibleDeliveryId` and `responsibleReceiptId` (FK to `Staff`), optional `projectId` (FK to `Project`), `destination: String?`, `observations: String?`, and `date: DateTime`. PURCHASE and RETURN **increment** stock; EXIT and WRITEOFF **decrement** stock. EXIT and WRITEOFF validate sufficient stock before committing.
- **MovementDetail:** Line items of a Movement. Has a `quantity: Decimal` field.
- **Project:** Projects where materials are destined. Has `name`, `contact`, `address`. `managerId` is a required (non-nullable) FK to `User` — the manager must be a registered user in the system (does not need Supabase Auth / `hasAuth`).

## 3. Technology Stack

- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL
- **Language:** TypeScript

## 4. Workflows

### Schema Updates

1.  **Modify:** Edit files in `prisma/schema/*.prisma`.
2.  **Generate:** Run `pnpm db:generate` to update the Prisma Client types.
3.  **Migrate:** Run `pnpm db:migrate` to create and apply SQL migrations.
4.  **Entity check:** After generating, any new column on a model will cause a TypeScript error in the corresponding `mapXxx()` service method — this is intentional. Update the mapper to resolve it.

### Best Practices

- **Enums:** Use database-level enums for `UserRole`, `ItemType`, and `MovementType`.
- **Decimal fields:** `stock` (Item) and `quantity` (MovementDetail) are `Decimal` — always call `.toNumber()` in service mappers before serializing.
- **Date fields:** `date` (Movement) is a `DateTime` — serializes as ISO string over JSON. Entity type overrides `Date → string`.
- **Relations:** Ensure proper foreign key constraints (e.g., `Movement` must link to `User` as creator and optionally to `Project`). `responsibleDeliveryId`/`responsibleReceiptId` on `Movement` are also FKs to `User`.
- **`onDelete: Restrict`:** Use when a parent record must not be deleted while child records exist (e.g., `Project` → `Movement`). Add a pre-check in the service with a user-friendly error message so tRPC surfaces it cleanly instead of a DB-level crash.
- **`onDelete: SetNull`:** Use when the child record should survive but lose the relation (e.g., `Staff` → `WorkArea` — deleting a WorkArea nullifies `workAreaId` on Staff, not deleting the user).
- **WorkArea upsert pattern:** When a string field (e.g. `workArea: string`) maps to a normalized FK, use a private `upsertWorkArea(tx, name)` helper in the service — `findFirst` by `name`, create if missing. This keeps the external API accepting plain strings while the DB stays normalized.

## 6. Seed (`prisma/seed.ts`)

Run with `pnpm db:seed`. The seed is **idempotent** — each section checks for existing data before inserting.

### What gets seeded

| Section              | Data                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Users**            | `admin@ingexpert.com` (ADMIN) + `user@ingexpert.com` (USER) via Supabase Auth + local DB upsert                                  |
| **Items**            | 40 PRODUCT · 15 EQUIPMENT · 25 TOOL · 10 KIT (= 90 items). KITs always get `stock: 0, location: ''`.                             |
| **Kit compositions** | Each KIT with no `KitDetail` rows gets 3–6 random PRODUCT/TOOL components assigned. Only PRODUCT and TOOL may be kit components. |
| **Projects**         | 5 sample projects; `managerId` is set to the seeded admin's user ID.                                                             |
| **SQL policies**     | Runs `app-data bucket policies.sql` (Supabase storage bucket policies + `is_admin()` function).                                  |

### SQL policy resilience

The seed splits the `.sql` file into individual statements using a dollar-quote–aware parser (`splitSqlStatements`), then executes each statement independently. Errors containing `already exists` or `duplicate` are logged as **skipped** (not fatal). All other errors are logged as warnings — execution continues to the next statement regardless.

- **`prisma`:** Singleton `PrismaClient` instance.
- **Prisma model types:** `User`, `Staff`, `WorkArea`, `Item`, `Movement`, `MovementDetail`, `Project` — used as bases for entity types in `@ingexpert/schema`.
- **Enums:** `UserRole`, `ItemType`, `MovementType` (re-exported from `@prisma/client`). `MovementType` values: `PURCHASE`, `RETURN`, `EXIT`, `WRITEOFF`.
