# Ingexpert API - Agent Context

This document provides a detailed analysis and specific guidelines for the **Ingexpert API** (`apps/api`) workspace.

## 1. Project Overview

**Ingexpert API** is the backend core, built with NestJS 11. It handles business logic, stock management, and acts as the central source of truth for the inventory system.

## 2. Technology Stack

- **Framework:** [NestJS 11](https://docs.nestjs.com/) + tRPC
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL (via `@ingexpert/database`)
- **Auth:** Supabase Auth (Passport Strategy + tRPC Middleware)
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
│   └── app.router.ts         # Root Router
│
├── auth/                     # Authentication Module
│   ├── auth.module.ts
│   └── auth.router.ts        # tRPC Router
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
- **Authorization:** Role-based access control (RBAC) via tRPC middleware (e.g., only `ADMIN` can manage users).

## 4. Conventions & Best Practices

### Database Interaction

- **PrismaService:** Always inject `PrismaService` to access the database.
- **Transactions:** Use Prisma interactive transactions (`$transaction`) when updating stock and creating a transaction record simultaneously to ensure data integrity.

### Authentication & Authorization

- **Supabase:** The API verifies the JWT emitted by Supabase.
- **Procedures:**
  - Use `trpc.protectedProcedure` for authenticated endpoints.
  - Use `trpc.adminProcedure` for admin-only endpoints.

## 5. Development Workflow

1.  **New Feature:**
    - Define Schema in `@ingexpert/schema`.
    - Create/Update `[domain].router.ts` in `apps/api/src/[domain]/`.
    - Implement Logic in Service.
    - Register router in `AppRouter`.
