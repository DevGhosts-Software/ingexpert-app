# Ingexpert API - Agent Context

This document provides a detailed analysis and specific guidelines for the **Ingexpert API** (`apps/api`) workspace.

## 1. Project Overview

**Ingexpert API** is the backend core, built with NestJS 11. It handles business logic, stock management, and acts as the central source of truth for the inventory system.

## 2. Technology Stack

- **Framework:** [NestJS 11](https://docs.nestjs.com/) + tRPC
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL (via `@ingexpert/database`)
- **Auth:** Supabase Auth (RS256/JWKS validation + Admin Service Role for user management)
- **Validation:** Zod (via `@ingexpert/schema`)

## 3. Project Architecture

The API follows a modular NestJS architecture integrated with tRPC.

```
apps/api/src/
├── app.module.ts             # Root Module
├── main.ts                   # Entry point
│
├── trpc/                     # tRPC Core
│   ├── trpc.module.ts
│   ├── trpc.service.ts       # initTRPC, procedures
│   ├── trpc.context.ts       # RS256/JWKS JWT Validation & Local DB Role check
│   └── app.router.ts         # Root Router
│
├── auth/                     # Authentication Module
│   ├── auth.module.ts
│   └── auth.router.ts        # tRPC Router (Login/Logout only)
│
├── prisma/                   # Database Module
│   └── prisma.service.ts     # Scoped Prisma Client Wrapper
│
├── [domain]/                 # Domain Modules (e.g., products, transactions)
│   ├── [domain].module.ts
│   ├── [domain].router.ts    # tRPC Router (Zod Schemas used here)
│   └── services/             # Business Logic
│       └── [domain].service.ts
```

### Key Architectural Principles

- **Router-Service-Repository:**
  - **Routers (`*.router.ts`):** Define tRPC procedures, validate inputs with Zod, and delegate to Services.
  - **Services (`/services`):** Contain business logic (e.g., stock calculations, transaction logging).
  - **Prisma:** Used directly in services.
- **Validation:** Zod schemas are imported from `@ingexpert/schema`.
- **Authorization:** Role-based access control (RBAC) via tRPC middleware. Only `ADMIN` can manage users via `AdminUsersService` (using Supabase Admin API).

## 5. Shared Entity Pattern

All data returned by tRPC procedures must be typed as a shared entity from `@ingexpert/schema`. The pattern has two parts:

### 5.1 Entity Type Definition (in `packages/schema`)

Entity types are **Prisma-derived TypeScript types**, not Zod schemas. The DB schema is the source of truth.

```typescript
// packages/schema/src/item.schema.ts

// ─── Entities (Prisma-derived) ────────────────────────────────────────────────
import { type Item } from '@ingexpert/database';

// No serialization issues → direct alias
export type ProjectEntity = Project;

// Decimal field → override to number
export type ItemEntity = Omit<Item, 'stock'> & { stock: number };

// Date field → override to string (ISO serialized over JSON)
export type MovementEntity = Omit<Movement, 'date'> & { date: string };
```

**Safety guarantee:** Adding a new column to the Prisma schema causes a TypeScript error in the service's `mapXxx()` method until the mapping is updated. Schema drift is caught at compile time.

### 5.2 Service Mapper (in `apps/api`)

```typescript
// apps/api — service mapper bridges Prisma model → wire Entity
private mapItem(item: Item): ItemEntity {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    location: item.location,
    stock: item.stock.toNumber(), // Decimal → number
    unit: item.unit,
    type: item.type,
    imageUrl: item.imageUrl,
  };
}

async findPaginated(input: ItemPaginationDto): Promise<{ data: ItemEntity[]; meta: PaginationMeta }> {
  const result = await paginatePrisma(this.prisma.item, input, ['name', 'code', 'location']);
  return { data: result.data.map((item) => this.mapItem(item)), meta: result.meta };
}
```

### 5.3 Frontend Usage

```typescript
// apps/frontend — import types from @ingexpert/schema, never redeclare locally
export type { ItemEntity as InventoryItem } from '@ingexpert/schema';
```

## 4. Conventions & Best Practices

### Database Interaction

- **PrismaService:** Always inject `PrismaService` to access the database.
- **Transactions:** Use Prisma interactive transactions (`$transaction`) when updating stock and creating a transaction record simultaneously to ensure data integrity.
- **Sync Trigger:** User profile creation in Prisma is handled by a PostgreSQL trigger on `auth.users` in Supabase.

### Movement Immutability

Movements are **create-only** by design. Once a movement is created:

- No `update` mutation is exposed on the frontend (the `update()` method exists in the service but is not reachable via the UI).
- Stock changes are applied atomically in a `$transaction` on creation.
- **Stock direction:**
  - `PURCHASE` and `RETURN` → **increment** stock.
  - `EXIT` and `WRITEOFF` → **decrement** stock.
- `EXIT` and `WRITEOFF` validate that item stock is sufficient **before** committing — throws `BadRequestException` with the item name and available/requested quantities.
- **Kit expansion:** When a movement detail references a `KIT` item, the service expands it into its components and checks/adjusts stock for each component individually. All-or-nothing: if any component is short on stock, the entire transaction is rejected.
- The `createdById` is set from `ctx.user.id` at the router level — it cannot be overridden by the client.
- The optional `observations` field accepts free text for notes, reasons, or references on any movement type. It is especially important for `WRITEOFF` movements to document the reason.

### Movement Filters & Role-Based Access

The `getAll` and `getStats` procedures accept an optional `MovementFiltersDto` (`createdById`, `dateFrom`, `dateTo`). Role enforcement is **server-side**:

- **Admins:** May filter by any `createdById`, date range, and project.
- **Non-admins:** The router **forces** `createdById = ctx.user.id` regardless of what the client sends. Users can only ever see their own movements.

The frontend respects this by hiding the creator filter UI for non-admins, but the server constraint is the security boundary.

### Authentication & Authorization

- **JWT Validation:** The API verifies the RS256 JWT emitted by Supabase by fetching public keys from JWKS. No shared secret is used.
- **Procedures:**
  - Use `trpc.protectedProcedure` for authenticated endpoints.
  - Use `trpc.adminProcedure` for admin-only endpoints.
- **User Management:** Public `/register` is disabled. Admins create users via `AdminUsersService`.

### Users Module — Two-Router Architecture

The users domain has **two separate routers** in `apps/api/src/users/`:

| Router             | Procedure            | Purpose                                                                                                                                               |
| ------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UsersRouter`      | `protectedProcedure` | Self-service: `me`, `updateMe`, `updateMyPassword`, `listNames`                                                                                       |
| `AdminUsersRouter` | `adminProcedure`     | Admin CRUD: `create`, `createWithoutAuth`, `grantAuth`, `revokeAuth`, `list`, `get`, `update`, `remove`, `updatePassword`, `getStats`, `getWorkAreas` |

Key rules:

- `updateMyPassword` (self-service) → `protectedProcedure` in `UsersRouter`, delegates to `AdminUsersService.changePassword(ctx.user.id, ...)`. `AdminUsersService` is injected into `UsersRouter` to reuse its Supabase Admin client.
- `updatePassword` (admin reset any user) → `adminProcedure` in `AdminUsersRouter`.
- **Never add a `protectedProcedure` to `AdminUsersRouter`** — the procedure type must match the router's intent.

### Auth-Access User Management

Users can exist in the system without a Supabase Auth account (`hasAuth: false`). This supports employees who are tracked (appear in dropdowns, can be assigned to movements) but cannot log in.

| Procedure           | Effect                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `create`            | Creates DB record + Supabase Auth account (`hasAuth: true`)                                                            |
| `createWithoutAuth` | Creates DB record only, generates UUID, sets `hasAuth: false`. No Supabase call.                                       |
| `grantAuth`         | Calls `supabaseAdmin.auth.admin.createUser({ id, email, password })` using the existing DB UUID, sets `hasAuth: true`. |
| `revokeAuth`        | Calls `supabaseAdmin.auth.admin.deleteUser(id)`, sets `hasAuth: false`. DB record is preserved.                        |
| `remove`            | Deletes DB record. Only calls Supabase `deleteUser` if `hasAuth: true`.                                                |

### Permission Rules (Users domain)

These rules are enforced both in the API (procedure type) and the frontend (disabled UI):

- **Edit user**: allowed on yourself and on non-admin users. Admins cannot edit other admins.
- **Delete user**: allowed on non-admin users only. Cannot delete yourself. Cannot delete other admins.
- **Reset password**: allowed on yourself and on non-admin users. Cannot reset another admin's password.
- **Change own password**: always allowed (any authenticated user via `updateMyPassword`).

## 5. Development Workflow

1.  **New Feature:**
    - Define Schema in `@ingexpert/schema`.
    - Create/Update `[domain].router.ts` in `apps/api/src/[domain]/`.
    - Implement Logic in Service.
    - Register router in `AppRouter`.

## 6. Bulk Operations Pattern

When implementing batch write operations (e.g. Excel import via `importMany`), **do not use a single interactive `$transaction` wrapping many sequential queries** — Prisma's default timeout is 5 s and it will expire on large datasets.

Instead use the pre-fetch + bulk pattern:

```typescript
async importMany(items: CreateItemDto[]): Promise<void> {
  // 1 query — find all existing items by code (natural identifier)
  const existing = await this.prisma.item.findMany({
    where: { code: { in: items.map((i) => i.code) } },
    select: { id: true, code: true },
  });
  const existingMap = new Map(existing.map((e) => [e.code, e.id]));

  const toCreate = items.filter((i) => !existingMap.has(i.code));
  const toUpdate = items.filter((i) => existingMap.has(i.code));

  // 1 query — batch insert all new rows
  if (toCreate.length > 0) {
    await this.prisma.item.createMany({ data: toCreate.map(mapData) });
  }
  // N parallel updates — stock is incremented, not replaced
  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map((item) =>
        this.prisma.item.update({
          where: { id: existingMap.get(item.code)! },
          data: { stock: { increment: item.stock } },
        }),
      ),
    );
  }
}
```

Total DB round-trips: **1 findMany + 1 createMany + N parallel updates** (vs. N×2 sequential before).

**Key rules:**

- Match by `code` (natural product identifier), not `name`.
- Existing items get `stock: { increment: value }` — never replace the entire record on import.
