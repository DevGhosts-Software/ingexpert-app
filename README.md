# Ingexpert

**Ingexpert** is a high-performance Stock Management System designed for managing electronic supplies. It provides a robust, audited environment for tracking inventory levels, managing users, and ensuring accountability through a detailed transaction "blame" system.

## The Core Idea

Ingexpert = **Inventory Management** (tracking) + **Transaction Auditing** (blame) + **Role-Based Access** (security) + **Real-time Updates**.

## Roadmap

The development is organized by Impact vs. Difficulty.

### Phase 1 (MVP - Weeks 1-2)

- **Inventory Core**: Product CRUD, SKU management, and stock level tracking.
- **Database Schema**: Prisma-based PostgreSQL setup for all core entities.
- **Basic Dashboard**: Visualizing current stock and low-stock items.

### Phase 2 (Audit & Accountability - Weeks 3-4)

- **Transaction System**: Implementation of the "blame" management system (logging who did what and when).
- **Transaction Types**: Support for `IN`, `OUT`, and `ADJUSTMENT` operations.
- **Audit Logs**: History view for every product and user.

### Phase 3 (Auth & Roles - Month 2)

- **Supabase Integration**: Secure authentication and identity management.
- **RBAC**: Implementing `ADMIN` and `USER` roles with specific dashboard access.
- **User Management**: Interface for admins to manage system access.

### Phase 4 (Advanced Features - Month 3+)

- **Low Stock Alerts**: Real-time notifications for items below threshold.
- **Analytics**: Usage trends and inventory velocity reporting.
- **Supplier Integration**: Tracking where supplies are coming from.

## Workspace Structure

This monorepo is managed using [Turbo](https://turbo.build/) and [pnpm](https://pnpm.io/).

### Applications

- **`@ingexpert/api`** (`apps/api`): NestJS backend. Handles business logic, tRPC API, and database interactions.
- **`@ingexpert/frontend`** (`apps/frontend`): Next.js frontend. Modern, responsive UI/UX using Tailwind CSS v4 and shadcn/ui.

### Packages

- **`@ingexpert/database`** (`packages/database`): Prisma schema and client. The single source of truth for the inventory data model.
- **`@ingexpert/schema`** (`packages/schema`): Centralized Zod schemas and DTOs shared between API and Frontend.
- **`@ingexpert/config`** (`packages/config`): Shared ESLint and Prettier configurations.

## Quick Start

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Set up the database:**
    Ensure a PostgreSQL instance is running and configured in `.env`.

    ```bash
    pnpm db:generate # Generates Prisma Client and Types
    pnpm db:migrate  # Applies migrations
    ```

3.  **Start development:**
    ```bash
    pnpm dev
    ```

## Scripts

- `pnpm dev`: Start all apps in development mode.
- `pnpm build`: Build all apps and packages.
- `pnpm lint`: Lint code quality.
- `pnpm format`: Applies prettier rules.
- `pnpm type-check`: Runs typescript compiler checks.

## License

UNLICENSED