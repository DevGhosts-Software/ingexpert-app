# Schema Spec — `packages/schema`

The shared type contract between API and Frontend. **Both packages depend on this one — changes here affect both.**

---

## Two-Track System

### Track 1 — DTOs (Zod schemas for runtime input validation)

Used exclusively for tRPC `.input()` validation at the API boundary. Zod parses and coerces the payload before it reaches service methods.

- **When to use Zod:** Only for data coming *into* the API (create, update, filter inputs).
- **Never use Zod for:** API response types. Responses are typed at compile time via entities — they are never `.parse()`-d at runtime.
- **Exception:** `.output()` schemas on tRPC procedures for OpenAPI documentation are also Zod, but they do not validate at runtime.

### Track 2 — Entities (Prisma-derived TypeScript types)

Used for all data returned *from* the API. Structurally derived from Prisma-generated model types so the database schema is the source of truth.

- **Safety guarantee:** Adding a column to a Prisma model causes a TypeScript error in the service's `mapXxx()` method until the mapping is updated. Schema drift is caught at compile time.

---

## File Structure

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

## Domain Modules

| File | DTOs | Entities | Output schemas |
|---|---|---|---|
| `auth.schema.ts` | `LoginSchema` | — | `AuthSessionSchema` |
| `user.schema.ts` | `CreateUserSchema`, `UpdateUserSchema`, `CreateUserWithoutAuthSchema`, `GrantAuthSchema` | `UserEntity`, `UserStats` | `UserEntitySchema`, `CurrentUserSchema`, `UserStatsSchema`, `UserNameSchema` |
| `item.schema.ts` | `CreateItemSchema`, `UpdateItemSchema`, `ItemPaginationSchema` | `ItemEntity`, `ItemStats`, `ItemCounts` | `ItemEntitySchema`, `ItemListSchema`, `ItemStatsSchema`, `ItemCountsSchema` |
| `kit.schema.ts` | `SetKitComponentsSchema`, `KitComponentSchema`, `KitImportRowSchema` | `KitComponentEntity` | `KitSummarySchema` |
| `project.schema.ts` | `CreateProjectSchema`, `UpdateProjectSchema`, `ProjectPaginationSchema` | `ProjectEntity` | `ProjectEntitySchema`, `ProjectListSchema`, `ProjectStatsSchema` |
| `movement.schema.ts` | `CreateMovementSchema`, `UpdateMovementSchema`, `MovementFiltersSchema` | `MovementHeaderEntity`, `MovementEntityWithDetails`, `MovementStats` | `MovementHeaderEntitySchema`, `MovementEntityWithDetailsSchema`, `MovementStatsSchema`, `MovementProjectSchema` |
| `pagination.schema.ts` | `BasePaginationSchema` | `PaginationMeta` | `PaginationMetaSchema`, `paginatedSchema<T>()` |

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Zod schema | `PascalCase` + `Schema` | `CreateItemSchema` |
| DTO type | `PascalCase` + `Dto`, inferred from schema | `CreateItemDto` |
| Entity type | `PascalCase` + `Entity`, Prisma-derived | `ItemEntity` |
| Output schema | `[Entity]Schema` | `ItemEntitySchema` |
| Enums | Re-exported from `@ingexpert/database` | `export { ItemType } from '@ingexpert/database'` |

---

## Entity Override Patterns

```typescript
// No overrides needed
export type ProjectEntity = Project;

// Decimal field (stock, quantity) → number
export type ItemEntity = Omit<Item, 'stock'> & { stock: number };

// Date field → string (ISO over JSON)
export type MovementHeaderEntity = Omit<Movement, 'date'> & { date: string; /* + joined fields */ };

// Relation flattened to scalar
export type UserEntity = User & { workArea: string | null };
// Note: hasAuth is a DB column on User — it's included automatically in User base
```

---

## Usage Examples

### API router — DTO for input validation

```typescript
import { CreateItemSchema } from '@ingexpert/schema';

.input(CreateItemSchema)
.output(ItemEntitySchema)
.mutation(({ input }) => itemsService.create(input)) // input is CreateItemDto
```

### React form — extend for UI messages, keep type aligned

```typescript
import { CreateItemSchema, type CreateItemDto } from '@ingexpert/schema';

const FormSchema = CreateItemSchema.extend({
  name: z.string().min(1, 'Nombre requerido'),
});
type FormValues = CreateItemDto; // type stays as the shared DTO

const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) });
```

### Frontend — import entity types, never redeclare

```typescript
// ✅ correct
import type { ItemEntity } from '@ingexpert/schema';

// ❌ wrong — duplicates the shape, loses the DB-schema link
interface Item { id: string; name: string; stock: number; }
```

---

## Build Note

`packages/schema` must be **built** (`pnpm --filter @ingexpert/schema build`) before `apps/api` or `apps/frontend` type-check if you've added new exports. The API and frontend import from the compiled `dist/`, not from source.
