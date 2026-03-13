# ADR-001: tRPC Over Plain REST API

## Status

Accepted

## Context

Ingexpert is a TypeScript monorepo where the API (`apps/api`) and the frontend (`apps/frontend`) share a common `packages/schema` package. The primary concern was keeping request/response types in sync without manual duplication or code generation.

Options considered:

- **Plain REST with Express/NestJS controllers** — requires manually defining types on both client and server, and keeping them in sync through a code generator or by convention.
- **GraphQL** — strong typing but significant operational overhead (schema, resolvers, code generation, client-side fragments).
- **tRPC** — end-to-end type safety without a code generation step; the client infers types directly from the router definition at compile time.

## Decision

Use **tRPC v11** as the API layer, hosted inside NestJS via `@trpc/server` and consumed on the frontend via `@trpc/client` + `@trpc/react-query`.

Additionally, use **`trpc-to-openapi`** to generate an `openapi.json` artifact at server startup (`GET /openapi.json`), giving REST clients and AI agents a machine-readable API contract without maintaining a separate OpenAPI spec file by hand.

## Consequences

- **Easier:** End-to-end type safety — adding a field to a Zod schema in `packages/schema` immediately surfaces type errors on the frontend if the UI does not handle it.
- **Easier:** No manual OpenAPI maintenance — the spec is generated from the router.
- **Easier:** Input validation is co-located with the type definition (Zod schemas serve as both runtime validators and TypeScript types).
- **Harder:** Consumers outside the TypeScript ecosystem (e.g., mobile apps, third-party integrations) must use the generated OpenAPI spec rather than the tRPC client directly.
- **Harder:** tRPC is not a standard; developers unfamiliar with it need to learn its router/procedure model.
