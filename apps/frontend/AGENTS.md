# Ingexpert Frontend - Agent Context

This document provides a detailed analysis and specific guidelines for the **Ingexpert Frontend** (`apps/frontend`) workspace.

## 1. Project Overview

**Ingexpert Frontend** is the user interface for the Stock Management System. It is a strictly typed client that consumes the `@ingexpert/api` via tRPC.

## 2. Documentation & Guidelines

Before generating code, verify alignment with these documents:

- **[Shadcn AI Guide](docs/shadcn-ai-guide.md)**: Specific patterns for using and generating shadcn/ui components.

## 3. Technology Stack

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/docs)
- **Language:** TypeScript 5.x
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind)
- **Data Fetching:** [tRPC](https://trpc.io/) + [TanStack Query](https://tanstack.com/query/latest)
- **Form Management:** `react-hook-form` + `zod`

## 4. Project Architecture

The project follows a **Feature-Sliced Design**.

```
apps/frontend/src/
├── app/                      # Next.js App Router (CONTAINERS)
│   ├── (auth)/               # Login page (Admin-only registration)
│   ├── (dashboard)/          # Protected routes
│   │   ├── admin/            # Admin-only pages (User management)
│   │   ├── inventory/        # Stock management
│   │   └── page.tsx          # Dashboard Home
│   └── layout.tsx            # Root layout
│
├── components/               # Shared UI components (PRESENTERS)
│   ├── ui/                   # Base shadcn/ui components
│   └── providers/            # Providers (TRPCProvider)
│
├── features/                 # Feature-based Modules
│   ├── [feature]/
│   │   ├── components/       # Feature-specific PRESENTERS
│   │   └── hooks/            # Logic & State Hooks
│
├── lib/
│   └── trpc.ts               # tRPC Client Instance
```

## 5. The Container/Presenter Pattern

To ensure separation of concerns, adherence to the **Container/Presenter** pattern is mandated.

### 5.1 The Container (`src/app/**/page.tsx`)

The **Page** is the "Manager". It owns all data fetching and filter state.

- **Role:**
  - **Data Fetching:** Uses `trpc.[domain].[procedure].useQuery()`.
  - **Filter State:** Owns `useState` for pagination, search, sorting, and filter values.
  - **Stable handlers:** All callbacks passed to Presenters must be wrapped in `useCallback`. Derived data arrays (e.g., mapped items) must be wrapped in `useMemo`.
  - **Loading defaults:** Declare module-level `DEFAULT_*` constants for the empty/loading state of each query result. Use `data ?? DEFAULT_VALUE` when passing to Presenters — never reconstruct objects field-by-field inline.
  - **Passes Data:** Props down to Presenters.

```typescript
// ✅ correct
const DEFAULT_STATS: ItemStats = { total: 0, products: 0, ... };
<InventoryStats stats={statsData ?? DEFAULT_STATS} />

// ❌ wrong — fragile, misses new fields silently
const stats = { total: statsData?.total ?? 0, products: statsData?.products ?? 0, ... };
```

### 5.2 The Presenter (`src/features/**/components/*.tsx`)

The **Component** is the "Visualizer" and "Actor".

- **Role:**
  - Renders data provided by the Container.
  - Handles user interactions — including mutations (`trpc.[domain].[procedure].useMutation()`).
- **Rules:**
  - **NEVER** call `useQuery` directly — all data comes via props.
  - Mutations are allowed — they are user-triggered write actions, not passive data fetches.
  - **ALWAYS** use `shadcn/ui` components.

## 6. Type Rules

- **Import entity types from `@ingexpert/schema`**, never declare local interfaces that duplicate API data shapes.
- **Import DTO types from `@ingexpert/schema`** for form `type FormValues`. Use `.extend()` on the shared schema only to add UI-specific error messages — the type itself stays as the shared `CreateXxxDto`.
- **Import `ItemType`, `ItemCounts`, `ItemStats`, etc. from `@ingexpert/schema`** in page files — do not import them from feature components.
- Feature type files (`[feature].types.ts`) may re-export schema types under local aliases for ergonomics, but the originals are always `@ingexpert/schema`.

```typescript
// ✅ page imports types from schema directly
import type { ItemCounts, ItemStats, ItemType } from '@ingexpert/schema';

// ✅ feature types re-export for local ergonomics
export type { ItemEntity as InventoryItem } from '@ingexpert/schema';

// ❌ local interface duplicating the API shape
interface InventoryItem { id: string; name: string; stock: number; ... }
```

## 7. Cache Invalidation Pattern

After every successful mutation (`onSuccess`), invalidate **all related queries** using `trpc.useUtils()`:

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

- **Invalidate broadly** — a single mutation can affect the list, stats, counts, and dropdowns simultaneously. Surgical `setQueryData` updates are error-prone; broad invalidation is safer.
- No optimistic updates — the system waits for server confirmation before refreshing. This is intentional for a stock system where accuracy matters.

## 8. Implementation Mapping for AI Agents

| Resource Type     | File Name (Kebab-Case)     | Code Identifier                     |
| :---------------- | :------------------------- | :---------------------------------- |
| **Container**     | `page.tsx`                 | `export default function Page()`    |
| **Presenter**     | `[feature]-table.tsx`      | `export function FeatureTable()`    |
| **Types file**    | `[feature]-table.types.ts` | Re-exports from `@ingexpert/schema` |
| **tRPC Query**    | `page.tsx`                 | `trpc.items.list.useQuery()`        |
| **tRPC Mutation** | `[component].tsx`          | `trpc.items.create.useMutation()`   |

## 9. Conventions & Best Practices

- **Styling:** Use Tailwind Utility classes.
- **Forms:** Use `react-hook-form`. Resolver: `zodResolver(CreateXxxSchema.extend({ ... }))`. Type: `CreateXxxDto` from `@ingexpert/schema`.
- **Components:** Import from `@/components/ui`.
