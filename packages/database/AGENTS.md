# @ingexpert/database - Gemini Agent Context

This package manages the persistence layer for the Ingexpert application using Prisma ORM and PostgreSQL.

## 1. Project Overview

**@ingexpert/database** is the central hub for database definitions and client generation. It exports the Prisma Client instance used by the API.

## 2. Core Entities

- **User:** System users with roles (`ADMIN`, `USER`).
- **Staff:** Extended user information for movement responsibility.
- **Item:** Inventory items (PRODUCT, EQUIPMENT, TOOL, KIT) with stock and location.
- **Movement:** Log of stock entries and exits, linked to Staff and Projects.
- **Project:** Projects where materials are destined.
- **Disposal:** Log of items removed from inventory.

## 3. Technology Stack

- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL
- **Language:** TypeScript

## 4. Workflows

### Schema Updates

1.  **Modify:** Edit files in `prisma/schema/*.prisma`.
2.  **Generate:** Run `pnpm db:generate` to update the Prisma Client.
3.  **Migrate:** Run `pnpm db:migrate` to create and apply SQL migrations.

### Best Practices

- **Enums:** Use database-level enums for `UserRole`, `ItemType`, and `MovementType`.
- **Relations:** Ensure proper foreign key constraints (e.g., `Movement` must link to `Staff` and optionally `Project`).
- **Indexes:** Emails are unique.

## 5. Exports

- **PrismaClient:** The instantiated client for database connectivity.
- **Enums:** `UserRole`, `ItemType`, `MovementType` (exported from `@prisma/client`).
