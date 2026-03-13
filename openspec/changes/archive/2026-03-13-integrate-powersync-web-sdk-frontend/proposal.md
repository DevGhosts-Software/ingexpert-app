## Why

Ingexpert already defines local PowerSync infrastructure, but the frontend has no client-side PowerSync runtime to persist data offline or react to local SQLite changes. We need a canonical frontend integration so Tauri users can continue working with inventory and movement data during connectivity gaps while preserving backend contract integrity.

## What Changes

- Add frontend dependencies required for PowerSync Web SDK runtime, React bindings, local SQL querying, and WASM SQLite persistence.
- Introduce a typed PowerSync client schema for `Item`, `Movement`, `MovementDetail`, and `Project` aligned to Prisma-backed entities.
- Add a Supabase-authenticated PowerSync backend connector that provides credentials and prepares a structured mutation upload path to existing NestJS tRPC/OpenAPI-backed endpoints.
- Initialize a shared PowerSync database instance using the WASM/OPFS storage adapter for local-first persistence in `apps/frontend`.
- Add a `PowerSyncProvider` and integrate it at the Next.js app boundary so feature modules can consume offline-reactive data safely.
- Update the PowerSync capability spec with frontend architecture requirements and constraints.
- No Prisma schema, API route, or transport contract changes are introduced in this change.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `powersync`: expand requirements from infrastructure-only setup to include frontend SDK integration, local database bootstrapping, auth-backed connector behavior, and provider wiring expectations.

## Impact

- **Frontend app (`apps/frontend`)**: new PowerSync library modules, provider integration, and dependency additions.
- **PowerSync capability docs (`openspec/specs/powersync/spec.md`)**: requirement updates for client runtime architecture.
- **Backend contracts**: existing endpoints are reused; upload interception must align with `openapi/openapi.json` and current tRPC procedures without introducing new API surface.
