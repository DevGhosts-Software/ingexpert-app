# API Spec — `apps/api`

NestJS 11 + tRPC backend. All database write operations happen here.

---

## Module Structure

```
apps/api/src/
├── main.ts                   # Bootstrap, serves GET /openapi.json
├── app.module.ts             # Root module
├── trpc/
│   ├── trpc.service.ts       # initTRPC, procedure factory, AppMeta type
│   ├── trpc.context.ts       # RS256/JWKS JWT validation + local DB role check
│   ├── app.router.ts         # Root router (merges all domain routers)
│   └── openapi.ts            # createOpenApiDocument()
├── auth/                     # Login / refresh / logout
├── items/                    # Inventory CRUD + stats
├── kits/                     # Kit composition
├── movements/                # Audit log (create-only)
├── projects/                 # Project management
├── users/                    # Self-service + admin CRUD
└── prisma/
    └── prisma.service.ts     # Scoped Prisma client wrapper
```

---

## Procedure Types

| Procedure | Guard | Used for |
|---|---|---|
| `trpc.procedure` | None (public) | Unauthenticated endpoints (login, refresh) |
| `trpc.protectedProcedure` | Valid JWT required | All authenticated users |
| `trpc.adminProcedure` | JWT + `role === ADMIN` | Admin-only operations |

---

## Authentication

- JWT is validated by fetching Supabase public keys from JWKS (RS256). No shared secret.
- `ctx.user` is the decoded JWT payload: `{ id, email, role }`.
- `ctx.user.id` is the source of truth for `createdById` — the client cannot override it.

---

## Users Module — Two-Router Architecture

| Router | Procedure type | Procedures |
|---|---|---|
| `UsersRouter` | `protectedProcedure` | `me`, `updateMe`, `updateMyPassword`, `listNames` |
| `AdminUsersRouter` | `adminProcedure` | `create`, `createWithoutAuth`, `grantAuth`, `revokeAuth`, `list`, `get`, `update`, `remove`, `updatePassword`, `getStats`, `getWorkAreas` |

**Rules:**
- `updateMyPassword` (self) → `protectedProcedure` in `UsersRouter`, delegates to `AdminUsersService.changePassword`.
- `updatePassword` (admin resets any user) → `adminProcedure` in `AdminUsersRouter`.
- Never add a `protectedProcedure` to `AdminUsersRouter`.

### `hasAuth` Flag — Auth-Decoupled Users

Users can exist without a Supabase Auth account (tracked in system but cannot log in):

| Operation | Effect |
|---|---|
| `create` | DB record + Supabase Auth account → `hasAuth: true` |
| `createWithoutAuth` | DB record only, UUID generated locally → `hasAuth: false` |
| `grantAuth` | `supabaseAdmin.auth.admin.createUser({ id, email, password })` → `hasAuth: true` |
| `revokeAuth` | `supabaseAdmin.auth.admin.deleteUser(id)` → `hasAuth: false`, DB preserved |
| `remove` | Deletes DB record. Only calls Supabase `deleteUser` if `hasAuth: true` |

### Permission Rules

| Action | Who |
|---|---|
| Edit user | Self + non-admin users. Admins cannot edit other admins. |
| Delete user | Non-admin users only. Cannot delete self. Cannot delete other admins. |
| Reset password | Self + non-admin users. Cannot reset another admin's password. |
| Change own password | Any authenticated user (`updateMyPassword`). |

---

## Movements — Business Rules

Movements are **create-only** by design. Once created:
- No `update` mutation is exposed on the frontend.
- Stock changes are applied atomically inside `$transaction` on creation.

### Stock Direction

| Type | Stock effect | Validation |
|---|---|---|
| `PURCHASE` | Increment | None |
| `RETURN` | Increment | None |
| `EXIT` | Decrement | Validates sufficient stock before commit |
| `WRITEOFF` | Decrement | Validates sufficient stock before commit |

### Kit Expansion

When a movement detail references a `KIT` item, the service expands it into its components and validates/adjusts stock for each component individually. All-or-nothing: if any component has insufficient stock, the entire transaction is rejected.

### Role-Based Filters

`getAll` and `getStats` accept optional `MovementFiltersDto` (`createdById`, `dateFrom`, `dateTo`).

- **Admins:** May filter by any `createdById`.
- **Non-admins:** Server **forces** `createdById = ctx.user.id` regardless of client payload. This is the security boundary — not the UI.

---

## Layered Architecture

Strictly separate concerns into three layers — never mix them:

| Layer | Files | Responsibility |
|---|---|---|
| **Transport** | `*.router.ts` | tRPC procedures, Zod input validation, HTTP status. No business logic. |
| **Logic** | `*/services/*.service.ts` | Business logic, stock calculations, DB interactions. |
| **Data** | `PrismaService` | Database queries and data mapping. Inject via constructor. |

- **RBAC:** Use distinct procedure types (`protectedProcedure`, `adminProcedure`) for different access levels — never hybrid endpoints.
- **SOLID:**
  - SRP: each class has exactly one reason to change.
  - OCP/DIP: depend on interfaces/injection, not concrete implementations.

---

## Database Interaction

- **PrismaService:** Always inject `PrismaService` — never instantiate `PrismaClient` directly in a module.
- **Transactions:** Use `prisma.$transaction` when updating stock + creating a movement record simultaneously.
- **Supabase trigger:** User profile creation in Prisma (the `User` table row) is handled by a PostgreSQL trigger on `auth.users` in Supabase. The API does not need to manually `INSERT` into `User` on login — the row already exists.
- **Error handling:** Use centralized NestJS exception filters. Never return raw database errors to the client. For `onDelete: Restrict` violations, add a service-level pre-check with a user-friendly error message.

---



### 1. Entity Type (in `packages/schema`)

```typescript
// Decimal field → override to number
export type ItemEntity = Omit<Item, 'stock'> & { stock: number };

// Date field → override to string (ISO serialized over JSON)
export type MovementEntity = Omit<Movement, 'date'> & { date: string };
```

### 2. Service Mapper (in `apps/api`)

```typescript
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
```

**Safety guarantee:** Adding a new DB column causes a TypeScript error in `mapXxx()` until the mapping is updated. Schema drift is caught at compile time.

---

## Bulk Operations Pattern

For batch writes (e.g. Excel import), do **not** use a single interactive `$transaction` wrapping many sequential queries — Prisma's default timeout (5 s) will expire on large datasets.

Use the **pre-fetch + bulk** pattern instead:

```typescript
async importMany(items: CreateItemDto[]): Promise<void> {
  // 1 query — find all existing by natural key
  const existing = await this.prisma.item.findMany({
    where: { code: { in: items.map((i) => i.code) } },
    select: { id: true, code: true },
  });
  const existingMap = new Map(existing.map((e) => [e.code, e.id]));

  const toCreate = items.filter((i) => !existingMap.has(i.code));
  const toUpdate = items.filter((i) =>  existingMap.has(i.code));

  if (toCreate.length > 0) await this.prisma.item.createMany({ data: toCreate.map(mapData) });
  if (toUpdate.length > 0) await Promise.all(toUpdate.map((item) =>
    this.prisma.item.update({
      where: { id: existingMap.get(item.code)! },
      data: { stock: { increment: item.stock } }, // increment, never replace
    })
  ));
}
```

**Key rules:**
- Match by `code` (natural identifier), not `name`.
- Existing items get `stock: { increment: value }` — never replace the whole record on import.

---

## OpenAPI Integration

Every tRPC procedure exposed to OpenAPI **must** have:
- `.meta({ openapi: { method, path, tags, summary } })`
- `.output(SomeZodSchema)` — output schema imported from `@ingexpert/schema`

GET endpoints can only have primitive Zod types as query parameters (`ZodString`, `ZodNumber`, `ZodBoolean`). Use POST for complex (nested object) inputs.

The spec is regenerated on every server startup and served at `GET /openapi.json`.
