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

## 4. Conventions & Best Practices

### Database Interaction

- **PrismaService:** Always inject `PrismaService` to access the database.
- **Transactions:** Use Prisma interactive transactions (`$transaction`) when updating stock and creating a transaction record simultaneously to ensure data integrity.
- **Sync Trigger:** User profile creation in Prisma is handled by a PostgreSQL trigger on `auth.users` in Supabase.

### Authentication & Authorization

- **JWT Validation:** The API verifies the RS256 JWT emitted by Supabase by fetching public keys from JWKS. No shared secret is used.
- **Procedures:**
  - Use `trpc.protectedProcedure` for authenticated endpoints.
  - Use `trpc.adminProcedure` for admin-only endpoints.
- **User Management:** Public `/register` is disabled. Admins create users via `AdminUsersService`.
## 5. Development Workflow

1.  **New Feature:**
    - Define Schema in `@ingexpert/schema`.
    - Create/Update `[domain].router.ts` in `apps/api/src/[domain]/`.
    - Implement Logic in Service.
    - Register router in `AppRouter`.
