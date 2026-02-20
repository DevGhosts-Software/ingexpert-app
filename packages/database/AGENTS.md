# @ingexpert/database - Agent Context

This package manages the persistence layer for the Ingexpert application using Prisma ORM and PostgreSQL.

## 1. Project Overview

**@ingexpert/database** is the central hub for database definitions and client generation. It exports the Prisma Client instance used by the API, and exports all Prisma-generated model types used as the basis for entity types in `@ingexpert/schema`.

## 2. Core Models

- **User:** System users with roles (`ADMIN`, `USER`).
- **Staff:** Extended user information for movement responsibility.
- **Item:** Inventory items (`PRODUCT`, `EQUIPMENT`, `TOOL`, `KIT`) with stock (`Decimal`) and location.
- **Movement:** Log of stock entries and exits, linked to Staff and Projects. Has a `date: DateTime` field.
- **MovementDetail:** Line items of a Movement. Has a `quantity: Decimal` field.
- **Project:** Projects where materials are destined.
- **Disposal:** Log of items permanently removed from inventory.

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
- **Relations:** Ensure proper foreign key constraints (e.g., `Movement` must link to `Staff` and optionally `Project`).

## 5. Exports

- **`prisma`:** Singleton `PrismaClient` instance.
- **Prisma model types:** `User`, `Staff`, `Item`, `Movement`, `MovementDetail`, `Project`, `Disposal` — used as bases for entity types in `@ingexpert/schema`.
- **Enums:** `UserRole`, `ItemType`, `MovementType` (re-exported from `@prisma/client`).

