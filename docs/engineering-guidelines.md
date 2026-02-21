---
trigger: always_on
---

# Engineering Standards for Ingexpert

This document defines the architectural and coding standards for **Ingexpert**, ensuring the system remains scalable, secure, and aligned with SOLID principles. These standards apply across the entire monorepo.

## 1. API Architecture & Routing

### Role-Based Separation

- **Separated Endpoints:** Avoid "hybrid" endpoints. Use distinct controllers for different access levels (e.g., `ProductsController` for public catalog and `AdminProductsController` for inventory management).
- **Admin-Only User Creation:** Public registration is prohibited. New users must be created by an Admin using the Supabase Admin API.
- **Context-Aware Retrieval:** User-facing endpoints must implicitly filter by `userId` extracted from the JWT (via `req.user.id`) where applicable.
- **JWT Validation:** Use RS256 with JWKS. Verify tokens against Supabase's public keys.
- **DTOs:** Use specific Data Transfer Objects for each role to prevent sensitive metadata leakage.

## 2. SOLID Implementation

- **Single Responsibility (SRP):**
  - **Controllers:** Handle HTTP concerns, status codes, and routing.
  - **Services:** Handle business logic (Stock calculations, database interaction).
  - **Guards:** Handle authorization.
- **Open/Closed (OCP):** Design logic to be extensible without modification.
- **Dependency Inversion (DIP):** Depend on abstractions (interfaces), not concrete implementations. Inject services via constructors.

## 3. Business Logic

- **Transaction Integrity:** Stock movements must be transactional. Use database transactions to ensure `Product` stock updates and `Transaction` log creation happen atomically.
- **Audit Trails:** Every stock change must be traceable to a specific user and action type (`IN`, `OUT`, `ADJUSTMENT`).

## 4. Code Quality & Performance

- **TypeScript Strictness:** No `any` types. All API response shapes must use Prisma-derived entity types from `@ingexpert/schema` (e.g., `ItemEntity`, `ProjectEntity`). All API inputs must use Zod-validated DTO types (e.g., `CreateItemDto`). Never use raw Prisma types or locally-declared interfaces as tRPC procedure return types.
- **Error Handling:** Use centralized exception filters in NestJS. Never return raw database errors to the client.
- **Performance:** Optimize database queries for dashboards. Use indexing on frequently-filtered fields.
- **Debouncing:** Any frontend input that drives an API query (search, autocomplete, filter) **must** be debounced with `useDebounce` (default 400 ms) before being passed to `useQuery`. The raw state value drives the UI; the debounced value is passed to tRPC. See `apps/frontend/AGENTS.md §10` for the canonical pattern.
