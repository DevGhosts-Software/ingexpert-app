# @ingexpert/schema - Gemini Agent Context

This package serves as the **shared contract** for data validation and transfer objects (DTOs) across the Ingexpert ecosystem.

## 1. Purpose

- **Single Source of Truth:** Defines Zod schemas used by both API (validation) and Frontend clients (forms).
- **Type Safety:** Exports inferred TypeScript types (`*Dto`) to ensure end-to-end type safety.
- **Standardization:** Enforces consistent validation rules (e.g., UUID formats, SKU patterns).

## 2. Exports

All schemas and types are exported from `src/index.ts`.

### Modules (To be Implemented)

- **Auth:** `LoginSchema`, `RegisterSchema`
- **Users:** `CreateUserSchema`, `UpdateUserSchema`
- **Products:** `CreateProductSchema`, `UpdateProductSchema`, `ProductStockAdjustmentSchema`
- **Transactions:** `CreateTransactionSchema`

## 3. Conventions

- **Schemas:** PascalCase with `Schema` suffix (e.g., `CreateProductSchema`).
- **DTOs:** PascalCase with `Dto` suffix, inferred from schema (e.g., `CreateProductDto`).
- **Zod Usage:**
  - Use modern Zod methods: `z.uuid()`, `z.email()`, `z.min()`.
  - Enums: Use `z.nativeEnum` for TypeScript enums shared from `@ingexpert/database` (e.g., `Role`, `TransactionType`).

## 4. Usage Example

### API Router

```typescript
import { CreateProductSchema } from '@ingexpert/schema';

// ...
.input(CreateProductSchema)
.mutation(...)
```

### React Form

```typescript
import { CreateProductSchema, CreateProductDto } from '@ingexpert/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<CreateProductDto>({
  resolver: zodResolver(CreateProductSchema),
});
```
