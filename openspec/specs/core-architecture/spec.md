# Core Architecture Spec — Ingexpert

> **Source of Truth for Endpoint Contracts**: `openapi/openapi.json` is auto-generated at server startup by `trpc-to-openapi` and served at `GET /openapi.json`. It reflects the exact, current shape of every endpoint. **Before generating any frontend hook, backend route, or data model — cross-reference `openapi/openapi.json`** to avoid schema drift and type mismatches.

This is the mandatory starting point for any AI agent generating code, routes, or data models for this project. Read it before writing a single line. For domain-specific rules, read the relevant capability spec alongside this one.

---

## References / Decisions

If you need historical context on why these architectural boundaries exist, refer to our Architecture Decision Records:

- [ADR-001: tRPC over REST](../../decisions/ADR-001-trpc-over-rest.md)
- [ADR-002: Supabase Auth](../../decisions/ADR-002-supabase-auth.md)
- [ADR-003: Tauri Desktop](../../decisions/ADR-003-tauri-desktop.md)
- [ADR-004: Prisma ORM](../../decisions/ADR-004-prisma-orm.md)

## Monorepo Layout

```
ingexpert-app/
├── apps/
│   ├── api/          NestJS 11 + tRPC — backend, all DB writes
│   └── frontend/     Next.js + React 19 — UI, reads via tRPC only
│       └── src-tauri/  Tauri 2 desktop configuration (native packaging)
├── packages/
│   ├── schema/       Shared Zod DTOs + Prisma-derived entity types
│   └── database/     Prisma ORM client + generated types
└── openspec/         This workspace (specs live here)
```

---

## Commands Reference

| Command            | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `pnpm dev`         | Start API + Tauri desktop app (embeds Next.js)                          |
| `pnpm build`       | Build everything (API + Tauri native bundle)                            |
| `pnpm check`       | **Pre-push pipeline**: format check → lint → type-check → Next.js build |
| `pnpm format`      | Auto-fix Prettier formatting                                            |
| `pnpm lint`        | Run ESLint across all packages                                          |
| `pnpm type-check`  | Run `tsc --noEmit` across all packages                                  |
| `pnpm db:generate` | Regenerate Prisma Client after schema changes                           |
| `pnpm db:migrate`  | Apply pending DB migrations                                             |
| `pnpm db:studio`   | Open Prisma Studio                                                      |

> `pnpm --filter @ingexpert/frontend next:dev` and `next:build` are called automatically by Tauri — do not run them directly.

---

## Feature Implementation Order

When adding a new domain feature, follow this order **strictly**:

1. **Prisma schema** — edit `packages/database/prisma/schema/*.prisma`
2. **`pnpm db:generate`** — regenerate the Prisma client
3. **`packages/schema/src/[domain].schema.ts`** — add Zod DTOs + Prisma-derived entity types + Zod output schemas
4. **`apps/api/src/[domain]/`** — NestJS service + tRPC router (import all schemas from `@ingexpert/schema`)
5. **`apps/frontend/src/features/[domain]/`** — page container + feature components via tRPC hooks
6. **`pnpm check`** — all checks must pass before committing

---

## Domain Inventory

| Domain    | API module                | Frontend feature       | Spec                                        |
| --------- | ------------------------- | ---------------------- | ------------------------------------------- |
| Auth      | `auth/`                   | `features/auth/`       | [`auth/spec.md`](../auth/spec.md)           |
| Items     | `items/`                  | `features/inventory/`  | [`inventory/spec.md`](../inventory/spec.md) |
| Kits      | `kits/`                   | (part of inventory UI) | [`inventory/spec.md`](../inventory/spec.md) |
| Movements | `movements/`              | `features/movements/`  | [`movements/spec.md`](../movements/spec.md) |
| Projects  | `projects/`               | `features/projects/`   | [`projects/spec.md`](../projects/spec.md)   |
| Users     | `users/` + `admin-users/` | `features/users/`      | [`auth/spec.md`](../auth/spec.md)           |

---

## Key Rules for AI Agents

- **No `any`** — TypeScript strict mode enforced everywhere.
- **DTOs in `packages/schema`** — never define Zod schemas inside routers.
- **Entity types are Prisma-derived** — never create duplicate local interfaces on the frontend.
- **Frontend reads via tRPC only** — no direct DB access, no direct REST calls.
- **Stock mutations** — must use Prisma `$transaction`.
- **Output schemas** — every tRPC procedure with OpenAPI metadata has a `.output()` Zod schema. Match it exactly in any new procedure.
- **No `// TODO` or `// FIXME`** — implement the solution fully or define the interface clearly.

---

## API — Module Structure

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

## API — Layered Architecture

Strictly separate concerns into three layers — never mix them:

| Layer         | Files                     | Responsibility                                                         |
| ------------- | ------------------------- | ---------------------------------------------------------------------- |
| **Transport** | `*.router.ts`             | tRPC procedures, Zod input validation, HTTP status. No business logic. |
| **Logic**     | `*/services/*.service.ts` | Business logic, stock calculations, DB interactions.                   |
| **Data**      | `PrismaService`           | Database queries and data mapping. Inject via constructor.             |

- **RBAC:** Use distinct procedure types (`protectedProcedure`, `adminProcedure`) for different access levels — never hybrid endpoints.
- **SOLID:** SRP — each class has exactly one reason to change. DIP — depend on interfaces/injection, not concrete implementations.

---

## API — Database Interaction

- **PrismaService:** Always inject `PrismaService` — never instantiate `PrismaClient` directly in a module.
- **Transactions:** Use `prisma.$transaction` when updating stock + creating a movement record simultaneously.
- **Supabase trigger:** User profile creation in Prisma (the `User` table row) is handled by a PostgreSQL trigger on `auth.users` in Supabase. The API does not need to manually `INSERT` into `User` on login — the row already exists.
- **Error handling:** Use centralized NestJS exception filters. Never return raw database errors to the client. For `onDelete: Restrict` violations, add a service-level pre-check with a user-friendly error message.

---

## API — Bulk Operations Pattern

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

**Key rules:** Match by `code` (natural identifier), not `name`. Existing items get `stock: { increment: value }` — never replace the whole record on import.

---

## API — OpenAPI Integration

Every tRPC procedure exposed to OpenAPI **must** have:

- `.meta({ openapi: { method, path, tags, summary } })`
- `.output(SomeZodSchema)` — output schema imported from `@ingexpert/schema`

GET endpoints can only have primitive Zod types as query parameters (`ZodString`, `ZodNumber`, `ZodBoolean`). Use POST for complex (nested object) inputs.

The spec is regenerated on every server startup and served at `GET /openapi.json`.

---

## Database — Core Models

| Model            | Key fields                                                                                                                                                              | Notes                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `User`           | `id`, `email`, `role: UserRole`, `name?`, `avatar?`, `hasAuth: Boolean`                                                                                                 | `hasAuth` tracks whether user can log in (has Supabase Auth account) |
| `Staff`          | `userId` (FK→User), `workAreaId?` (FK→WorkArea, `onDelete: SetNull`)                                                                                                    | Extended user profile for movement responsibility tracking           |
| `WorkArea`       | `id`, `name @unique`                                                                                                                                                    | Normalized department/area. One WorkArea → many Staff (1-N)          |
| `Item`           | `id`, `code`, `name`, `location`, `stock: Decimal`, `unit`, `type: ItemType`, `imageUrl`                                                                                | KIT items have no meaningful stock or location                       |
| `Movement`       | `id`, `type: MovementType`, `createdById` (FK→User), `responsibleDeliveryId?`, `responsibleReceiptId?`, `projectId?`, `destination?`, `observations?`, `date: DateTime` | Immutable audit log                                                  |
| `MovementDetail` | `id`, `movementId` (FK→Movement), `itemId` (FK→Item), `quantity: Decimal`                                                                                               | Line items for a movement                                            |
| `Project`        | `id`, `name`, `contact`, `address`, `managerId` (FK→User, required)                                                                                                     | Manager must exist in `users` table; no Supabase Auth required       |

---

## Database — Enums

| Enum           | Values                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `UserRole`     | `ADMIN`, `USER`                                                                                       |
| `ItemType`     | `PRODUCT`, `EQUIPMENT`, `TOOL`, `KIT`                                                                 |
| `MovementType` | `PURCHASE` (entry/buy), `RETURN` (entry/return), `EXIT` (exit to project), `WRITEOFF` (exit/disposal) |

---

## Database — Data Type Serialization

| DB type    | Prisma type      | Wire type | How to convert                   |
| ---------- | ---------------- | --------- | -------------------------------- |
| `Decimal`  | `Prisma.Decimal` | `number`  | `.toNumber()` in service mapper  |
| `DateTime` | `Date`           | `string`  | ISO string over JSON (automatic) |

Always call `.toNumber()` on `stock` (Item) and `quantity` (MovementDetail) before returning from service mappers.

---

## Database — Relation Constraints

| Constraint           | Where used                  | Effect                                                                                                                |
| -------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `onDelete: Restrict` | `Project → Movement`        | Cannot delete a Project while Movements reference it. Add a pre-check in the service with a user-friendly tRPC error. |
| `onDelete: SetNull`  | `Staff → WorkArea`          | Deleting a WorkArea sets `workAreaId` to null on related Staff records, not deleting the user.                        |
| `onDelete: Cascade`  | `Movement → MovementDetail` | Deleting a Movement removes its line items.                                                                           |

---

## Database — Schema Update Workflow

1. **Edit** `packages/database/prisma/schema/*.prisma`
2. **Generate** — `pnpm db:generate` (updates Prisma Client + types)
3. **Migrate** — `pnpm db:migrate` (creates and applies SQL migration)
4. **Entity check** — any new DB column causes a TypeScript error in the corresponding `mapXxx()` service method. Update the mapper to resolve it.
5. **Rebuild schema package** — `pnpm --filter @ingexpert/schema build`
6. **`pnpm check`** — must pass before committing

---

## Database — Best Practices

- **Enums:** Use database-level enums (`UserRole`, `ItemType`, `MovementType`). Re-export from `@ingexpert/database` in `packages/schema`.
- **Decimal fields:** Always `.toNumber()` in mappers — never pass raw `Prisma.Decimal` over tRPC.
- **Transactions:** Use `prisma.$transaction` for any operation that mutates stock + creates a movement atomically.
- **Error surfacing:** For `onDelete: Restrict` violations, add a pre-check in the service and throw a NestJS `BadRequestException` with a user-friendly message — never let the raw DB error reach the client.

---

## Schema — Two-Track Type System

### Track 1 — DTOs (Zod schemas for runtime input validation)

Used exclusively for tRPC `.input()` validation at the API boundary.

- **When to use Zod:** Only for data coming _into_ the API (create, update, filter inputs).
- **Never use Zod for:** API response types. Responses are typed at compile time via entities — they are never `.parse()`-d at runtime.
- **Exception:** `.output()` schemas on tRPC procedures for OpenAPI documentation are also Zod, but they do not validate at runtime.

### Track 2 — Entities (Prisma-derived TypeScript types)

Used for all data returned _from_ the API. Structurally derived from Prisma-generated model types so the database schema is the source of truth.

**Safety guarantee:** Adding a column to a Prisma model causes a TypeScript error in the service's `mapXxx()` method until the mapping is updated. Schema drift is caught at compile time.

---

## Schema — File Structure

Each `[domain].schema.ts` follows this layout:

```typescript
import { z } from 'zod';
import { type Item, ItemType } from '@ingexpert/database';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const CreateItemSchema = z.object({ ... });
export type CreateItemDto = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItemDto = z.infer<typeof UpdateItemSchema>;

// ─── Entities (Prisma-derived — changes to the DB schema surface here) ────────

// No serialization overrides:
export type ProjectEntity = Project;

// Decimal → number override:
export type ItemEntity = Omit<Item, 'stock'> & { stock: number };

// Date → string override (ISO serialized over JSON):
export type MovementEntity = Omit<Movement, 'date'> & { date: string };

// Relation field flattened to scalar:
export type UserEntity = User & { workArea: string | null };

// ─── Output schemas (Zod, for OpenAPI .output() only) ─────────────────────────

export const ItemEntitySchema = z.object({ ... });
```

---

## Schema — Naming Conventions

| Thing         | Convention                                 | Example                                          |
| ------------- | ------------------------------------------ | ------------------------------------------------ |
| Zod schema    | `PascalCase` + `Schema`                    | `CreateItemSchema`                               |
| DTO type      | `PascalCase` + `Dto`, inferred from schema | `CreateItemDto`                                  |
| Entity type   | `PascalCase` + `Entity`, Prisma-derived    | `ItemEntity`                                     |
| Output schema | `[Entity]Schema`                           | `ItemEntitySchema`                               |
| Enums         | Re-exported from `@ingexpert/database`     | `export { ItemType } from '@ingexpert/database'` |

---

## Schema — Entity Override Patterns

```typescript
// No overrides needed
export type ProjectEntity = Project;

// Decimal field (stock, quantity) → number
export type ItemEntity = Omit<Item, 'stock'> & { stock: number };

// Date field → string (ISO over JSON)
export type MovementHeaderEntity = Omit<Movement, 'date'> & { date: string /* + joined fields */ };

// Relation flattened to scalar
export type UserEntity = User & { workArea: string | null };
// Note: hasAuth is a DB column on User — it's included automatically in User base
```

---

## Schema — Build Note

`packages/schema` must be **built** (`pnpm --filter @ingexpert/schema build`) before `apps/api` or `apps/frontend` type-check if you've added new exports. The API and frontend import from the compiled `dist/`, not from source.

---

## Frontend — Project Structure

```
apps/frontend/src/
├── app/                      # Next.js App Router (CONTAINERS)
│   ├── (auth)/               # Login page
│   ├── (dashboard)/          # Protected routes
│   │   ├── admin/            # Admin-only pages
│   │   ├── inventory/
│   │   ├── movements/
│   │   └── projects/
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # shadcn/ui base components
│   └── providers/            # TRPCProvider
├── features/                 # Feature modules
│   └── [feature]/
│       ├── components/       # Presenters
│       └── hooks/            # Logic hooks
└── lib/
    └── trpc.ts               # tRPC client
```

---

## Frontend — Container / Presenter Pattern

This pattern is **mandatory** — no exceptions.

### Container (`src/app/**/page.tsx`)

The Page is the **Manager**. It owns all data fetching and filter state.

- Calls `trpc.[domain].[procedure].useQuery()` for all data.
- Owns `useState` for pagination, search, sorting, filter values.
- Wraps callbacks in `useCallback`, derived data in `useMemo`.
- Uses module-level `DEFAULT_*` constants for loading states.
- Passes data down to Presenters as props.

```typescript
// ✅ correct — stable reference for loading state
const DEFAULT_STATS: ItemStats = { total: 0, products: 0, equipment: 0, tools: 0, kits: 0 };
<InventoryStats stats={statsData ?? DEFAULT_STATS} />

// ❌ wrong — reconstructs object every render, misses new fields silently
const stats = { total: statsData?.total ?? 0, products: statsData?.products ?? 0 };
```

### Presenter (`src/features/**/components/*.tsx`)

The Component is the **Visualizer** and **Actor**.

- Renders data received from the Container via props.
- May call `trpc.[domain].[procedure].useMutation()` — mutations are user-triggered writes.
- **Never** calls `useQuery` directly (exception: see §Row-Level Actions).
- Always uses `shadcn/ui` components.

---

## Frontend — File Naming Map

| Resource  | File name                     | Export                                  |
| --------- | ----------------------------- | --------------------------------------- |
| Container | `page.tsx`                    | `export default function Page()`        |
| Presenter | `[feature]-table.tsx`         | `export function FeatureTable()`        |
| Columns   | `[feature]-table.columns.tsx` | `export function getColumns()`          |
| Types     | `[feature]-table.types.ts`    | Re-exports from `@ingexpert/schema`     |
| Toolbar   | `[feature]-table-toolbar.tsx` | `export function FeatureTableToolbar()` |

---

## Frontend — Type Rules

- **Import entity types from `@ingexpert/schema`** — never declare local interfaces that duplicate API shapes.
- **Import DTO types from `@ingexpert/schema`** for form `type FormValues`. Use `.extend()` only to add UI error messages.
- Feature types files may re-export schema types under local aliases for ergonomics.

```typescript
// ✅ correct
import type { ItemCounts, ItemStats, ItemType } from '@ingexpert/schema';
export type { ItemEntity as InventoryItem } from '@ingexpert/schema';

// ❌ wrong — duplicates the API shape and breaks DB-schema link
interface InventoryItem {
  id: string;
  name: string;
  stock: number;
}
```

---

## Frontend — Cache Invalidation Pattern

After every mutation `onSuccess`, invalidate **all related queries**:

```typescript
const utils = trpc.useUtils();

const createMutation = trpc.items.create.useMutation({
  onSuccess: () => {
    void Promise.all([
      utils.items.list.invalidate(),
      utils.items.getStats.invalidate(),
      utils.items.getCounts.invalidate(),
      utils.items.getLocations.invalidate(),
    ]);
    onClose();
  },
});
```

- Invalidate broadly — a single mutation can affect lists, stats, counts, and dropdowns.
- No optimistic updates — the system waits for server confirmation. This is intentional for a stock system.

---

## Frontend — Debouncing User Input

Any input that triggers a tRPC query **must** be debounced:

```typescript
import { useDebounce } from '@/hooks/use-debounce';

// ✅ correct — raw state drives UI, debounced value drives API
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search); // default 400 ms

const { data } = trpc.items.list.useQuery({ search: debouncedSearch || undefined });

// ❌ wrong — fires network request on every keystroke
const { data } = trpc.items.list.useQuery({ search: search || undefined });
```

**Rules:** Container owns both raw state (UI) and debounced value (API). Pass **raw** value to Presenter input. Pass **debounced** value to `useQuery`. Default delay is **400 ms**.

---

## Frontend — On-Demand Fetch (one-shot)

For actions triggered by user interaction (e.g. "Export to Excel"), use `utils.fetch()` instead of `useQuery`:

```typescript
const utils = trpc.useUtils();

const handleExport = async () => {
  const items = await utils.items.getAll.fetch(); // no persistent subscription
  // generate Excel file...
};
```

---

## Frontend — Row-Level Actions Exception

Row action menus may call `trpc.users.me.useQuery()` **directly** — it is cached by the dashboard layout, so no extra network request is made. Only `trpc.users.me` (or equivalent `staleTime: Infinity` queries) may be used this way.

---

## Frontend — Forms

- Use `react-hook-form` with `zodResolver`.
- Import the shared schema from `@ingexpert/schema`, extend only for UI-specific error messages.
- Type stays as the shared DTO — never redefine locally.

```typescript
import { CreateItemSchema, type CreateItemDto } from '@ingexpert/schema';

const FormSchema = CreateItemSchema.extend({
  name: z.string().min(1, 'Nombre requerido'),
});
type FormValues = CreateItemDto; // type is still the shared DTO

const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) });
```

---

## Frontend — Table Visual Conventions

Use `style={{ boxShadow: 'inset 2px 0 0 <hex>' }}` on `<TableRow>` for the colored left border. **Do not use `border-l-*` Tailwind classes** — they disappear on the last row due to `border-collapse: collapse`.

---

## Frontend — Single Form Rule (Radix Sheets / Dialogs)

**Never** conditionally swap two different `<Form>` trees inside a Radix `Sheet` or `Dialog`. Radix's `FocusScope` re-initializes when large DOM subtrees unmount/remount, temporarily blocking all pointer events.

```tsx
// ❌ wrong — swapping Form providers unmounts the subtree
{noAuth ? <Form {...noAuthForm}>...</Form> : <Form {...form}>...</Form>}

// ✅ correct — single Form, conditional sections via {condition && <>...</>}
const form = useForm({ resolver: zodResolver(schema) });
const noAuth = form.watch('noAuth');
{!noAuth && <FormField name="password" ... />}
```

---

## Frontend — shadcn/ui Rules

- Import all components from `@/components/ui` (never relative paths).
- Use `"use client"` for interactive components.
- Never use raw HTML form elements — always use shadcn `Form`, `Input`, `Select`, etc.
- Install new components via: `npx shadcn-ui@latest add <component>` from `apps/frontend`.
