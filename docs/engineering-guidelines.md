---
trigger: always_on
---

# Engineering Standards for Ingexpert

This document defines the architectural and coding standards for **Ingexpert**, ensuring the system remains scalable, secure, and aligned with SOLID principles. These standards apply across the entire monorepo.

## 1. API Architecture & Routing

### Role-Based Separation

- **Separated Endpoints:** Avoid "hybrid" endpoints. Use distinct controllers for different access levels (e.g., `ProductsController` for public catalog and `AdminProductsController` for inventory management).
- **Context-Aware Retrieval:** User-facing endpoints must implicitly filter by `userId` extracted from the JWT (via `req.user.id`) where applicable.
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

- **TypeScript Strictness:** No `any` types. Leverage interfaces for all database entities and API responses.
- **Error Handling:** Use centralized exception filters in NestJS. Never return raw database errors to the client.
- **Performance:** Optimize database queries for dashboards. Use indexing on `sku` and `userId`.
