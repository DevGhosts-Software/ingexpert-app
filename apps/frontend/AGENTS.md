# Ingexpert Frontend - Agent Context

This document provides a detailed analysis and specific guidelines for the **Ingexpert Frontend** (`apps/frontend`) workspace.

## 1. Project Overview

**Ingexpert Frontend** is the user interface for the Stock Management System. It is a strictly typed client that consumes the `@ingexpert/api` via tRPC.

## 2. Documentation & Guidelines

Before generating code, verify alignment with these documents:

- **[Shadcn AI Guide](docs/shadcn-ai-guide.md)**: Specific patterns for using and generating shadcn/ui components.

## 3. Technology Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/docs)
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
│   ├── (auth)/               # Login/Register pages
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

The **Page** is the "Manager". It fetches data using tRPC hooks.

- **Role:**
  - **Data Fetching:** Uses `trpc.[domain].[procedure].useQuery()`.
  - **Logic:** Handles loading states and errors.
  - **Passes Data:** Props down to Presenters.

### 5.2 The Presenter (`src/features/**/components/*.tsx`)

The **Component** is the "Visualizer".

- **Role:**
  - Renders data provided by the Container.
  - Handles user interactions (clicks, form submits).
- **Rules:**
  - **NEVER** fetch data directly.
  - **ALWAYS** use `shadcn/ui` components.

## 6. Implementation Mapping for AI Agents

| Resource Type  | File Name (Kebab-Case) | Code Identifier                  |
| :------------- | :--------------------- | :------------------------------- |
| **Container**  | `page.tsx`             | `export default function Page()` |
| **Presenter**  | `product-list.tsx`     | `export function ProductList()`  |
| **tRPC Query** | `page.tsx`             | `trpc.products.list.useQuery()`  |

## 7. Conventions & Best Practices

- **Styling:** Use Tailwind Utility classes.
- **Forms:** Use `react-hook-form` with Zod resolvers from `@ingexpert/schema`.
- **Components:** Import from `@/components/ui`.
