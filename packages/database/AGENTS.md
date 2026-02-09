# @ingexpert/database - Gemini Agent Context

This package manages the persistence layer for the Ingexpert application using Prisma ORM and PostgreSQL.

## 1. Project Overview

**@ingexpert/database** is the central hub for database definitions and client generation. It exports the Prisma Client instance used by the API.

## 2. Core Entities

- **User:** System users with roles (`ADMIN`, `USER`).
- **Product:** Inventory items with SKU, stock levels, and minimum stock thresholds.
- **Transaction:** Audit log of stock movements (`IN`, `OUT`, `ADJUSTMENT`), linking Users and Products.

## 3. Technology Stack

- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL
- **Language:** TypeScript

## 4. Workflows

### Schema Updates

1.  **Modify:** Edit `prisma/schema.prisma`.
2.  **Generate:** Run `pnpm db:generate` to update the Prisma Client.
3.  **Migrate:** Run `pnpm db:migrate` to create and apply SQL migrations.

### Best Practices

- **Enums:** Use database-level enums for `Role` and `TransactionType`.
- **Relations:** Ensure proper foreign key constraints (e.g., `Transaction` must belong to `User` and `Product`).
- **Indexes:** SKUs and Emails are unique.

## 5. Exports

- **PrismaClient:** The instantiated client for database connectivity.
- **Enums:** `Role`, `TransactionType` (exported from `@prisma/client`).
