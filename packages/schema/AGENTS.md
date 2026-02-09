# @rikal/schema - Gemini Agent Context

This package serves as the **shared contract** for data validation and transfer objects (DTOs) across the Rikal ecosystem.

## 1. Purpose

- **Single Source of Truth:** Defines Zod schemas used by both API (validation) and Web/Mobile clients (forms, sync).
- **Type Safety:** Exports inferred TypeScript types (`*Dto`) to ensure end-to-end type safety.
- **Standardization:** Enforces consistent validation rules (e.g., UUID formats, date strings).

## 2. Exports

All schemas and types are exported from `src/index.ts`.

### Modules

- **Auth:** `RegisterSchema`, `LoginSchema`
- **Cards:** `CreateCardSchema`, `UpdateCardSchema`, `SyncReviewSchema`
- **Decks:** `CreateDeckSchema`, `UpdateDeckSchema`
- **Users:** `UpdateUserSchema`
- **Sync:** `SyncOperationSchema`, `SyncBatchSchema`

## 3. Conventions

- **Schemas:** PascalCase with `Schema` suffix (e.g., `CreateCardSchema`).
- **DTOs:** PascalCase with `Dto` suffix, inferred from schema (e.g., `CreateCardDto`).
- **Zod Usage:**
  - Use modern Zod methods: `z.uuid()`, `z.email()`, `z.url()`.
  - Dates: Use `z.iso.datetime()` for string inputs, transformed to `Date` objects where appropriate.
  - Enums: Use `z.nativeEnum` for TypeScript enums shared from `@rikal/database`.

## 4. Usage Example

### API Router

```typescript
import { CreateCardSchema } from '@rikal/schema';

// ...
.input(CreateCardSchema)
.mutation(...)
```

### React Form

```typescript
import { CreateCardSchema, CreateCardDto } from '@rikal/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<CreateCardDto>({
  resolver: zodResolver(CreateCardSchema),
});
```
