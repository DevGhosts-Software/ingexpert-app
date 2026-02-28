# @ingexpert/schema - Agent Context

This package serves as the **shared type contract** between the API and Frontend. It has two distinct tracks — one for validation, one for data shapes.

## 1. Two-Track System

### Track 1 — DTOs (Zod schemas for runtime input validation)

Used exclusively for tRPC `.input()` validation at the API boundary. Zod parses and coerces the payload before it reaches service methods.

- **When to use Zod:** Only for data coming _into_ the API (create, update, filter inputs).
- **Never use Zod for:** API response types. Responses are typed at compile time via entities — they are never `.parse()`-d at runtime.

### Track 2 — Entities (Prisma-derived TypeScript types)

Used for all data returned _from_ the API. Structurally derived from Prisma-generated model types so the database schema is the source of truth.

- **Safety guarantee:** Adding a column to a Prisma model causes a TypeScript error in the service's `mapXxx()` method until the mapping is updated. Schema drift is caught at compile time.

## 2. File Structure

Each `[domain].schema.ts` file follows this two-section layout:

```typescript
// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const CreateItemSchema = z.object({ ... });
export type CreateItemDto = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItemDto = z.infer<typeof UpdateItemSchema>;

// ─── Entities (Prisma-derived — changes to the DB schema surface here) ────────

// No serialization overrides needed:
export type ProjectEntity = Project;

// Decimal → number override:
export type ItemEntity = Omit<Item, 'stock'> & { stock: number };

// Date → string override (ISO serialized over JSON):
export type MovementEntity = Omit<Movement, 'date'> & { date: string };

// Relation field flattened to scalar (service maps staff?.workArea?.name):
// hasAuth is included automatically since User now has it as a DB column.
export type UserEntity = User & { workArea: string | null };
```

## 3. Modules

| File                   | DTOs                                                                                     | Entities                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `auth.schema.ts`       | `LoginSchema` / `LoginDto`                                                               | —                                                                    |
| `user.schema.ts`       | `CreateUserSchema`, `UpdateUserSchema`, `CreateUserWithoutAuthSchema`, `GrantAuthSchema` | `UserEntity`, `UserStats`                                            |
| `item.schema.ts`       | `CreateItemSchema`, `UpdateItemSchema`, `ItemPaginationSchema`                           | `ItemEntity`, `ItemStats`, `ItemCounts`                              |
| `project.schema.ts`    | `CreateProjectSchema`, `UpdateProjectSchema`, `ProjectPaginationSchema`                  | `ProjectEntity`                                                      |
| `movement.schema.ts`   | `CreateMovementSchema`, `UpdateMovementSchema`, `MovementFiltersSchema`                  | `MovementHeaderEntity`, `MovementEntityWithDetails`, `MovementStats` |
| `pagination.schema.ts` | `BasePaginationSchema`                                                                   | —                                                                    |

## 4. Naming Conventions

- **Zod schemas:** `PascalCase` + `Schema` suffix — `CreateItemSchema`
- **DTO types:** `PascalCase` + `Dto` suffix, inferred from schema — `CreateItemDto`
- **Entity types:** `PascalCase` + `Entity` suffix, derived from Prisma — `ItemEntity`
- **Enums:** Re-exported from `@ingexpert/database` via `z.nativeEnum()` in DTOs

## 5. Usage Examples

### API Router (DTO for input validation)

```typescript
import { CreateItemSchema } from '@ingexpert/schema';

.input(CreateItemSchema)
.mutation(({ input }) => itemsService.create(input)) // input is CreateItemDto
```

### React Form (extend shared schema for UI messages, keep type aligned)

```typescript
import { CreateItemSchema, type CreateItemDto } from '@ingexpert/schema';
import { z } from 'zod';

// Extend to add UI-specific error messages — does NOT change the type
const FormSchema = CreateItemSchema.extend({
  name: z.string().min(1, 'Nombre requerido'),
});
type FormValues = CreateItemDto; // type stays as the shared DTO

const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) });
```

### Frontend type import (never redeclare locally)

```typescript
// ✅ correct
import type { ItemEntity } from '@ingexpert/schema';

// ❌ wrong — duplicates the shape and loses the DB-schema link
interface Item { id: string; name: string; stock: number; ... }
```
