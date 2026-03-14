## Context

The current PowerSync capability in Ingexpert specifies backend publication and local PowerSync service infrastructure, but `apps/frontend` does not yet host a PowerSync client runtime. The frontend currently reads and writes through tRPC with online assumptions, so there is no local SQLite persistence layer for offline-first reactivity.

This change introduces frontend-only architecture in `apps/frontend` to:

- define a typed client schema for `Item`, `Movement`, `MovementDetail`, and `Project`,
- bootstrap a WebAssembly/OPFS-backed local database,
- authenticate PowerSync credentials through Supabase session tokens,
- prepare a structured upload interception boundary that forwards local mutations to existing backend endpoints in the current OpenAPI contract (`/items`, `/movements`, `/projects`),
- and expose runtime access via a provider at app root.

No Prisma schema or backend endpoint expansion is required.

## Goals / Non-Goals

**Goals:**

- Establish a canonical PowerSync frontend integration boundary under `src/lib/powersync/`.
- Keep entity shape alignment with Prisma-backed domains used in the backend publication.
- Ensure connector authentication uses Supabase Auth session token retrieval and explicit credential refresh.
- Define a safe upload interception path for future local-first mutation replay to existing NestJS/tRPC procedures.
- Document the architecture in `openspec/specs/powersync/spec.md`.

**Non-Goals:**

- Implementing full production conflict resolution or mutation reconciliation strategy.
- Replacing existing TanStack Query/tRPC reads across all pages in this change.
- Adding new backend routes or changing OpenAPI transport contracts.
- Introducing non-PowerSync storage engines.

## Decisions

### Decision 1: Introduce a dedicated frontend PowerSync module boundary

**Choice:** Create `src/lib/powersync/schema.ts`, `connector.ts`, and `db.ts`, plus a `PowerSyncProvider` component.

**Rationale:** Keeps initialization, auth, and schema responsibilities isolated from feature UIs and aligned with existing `lib/` and provider patterns.

**Alternatives considered:**

- Inline initialization in `app/layout.tsx`: rejected due to coupling and poor testability.
- Feature-level setup in each page: rejected due to duplication and inconsistent lifecycle control.

### Decision 2: Model client schema explicitly for Item/Movement/MovementDetail/Project

**Choice:** Define a single `AppSchema` in `schema.ts` for PowerSync tables matching publication-backed entities.

**Rationale:** Explicit schema centralizes offline table contract and prevents drift between PowerSync rules and frontend query layer.

**Alternatives considered:**

- Dynamic schema inference from runtime metadata: rejected because it reduces type safety and can hide contract mismatches.

### Decision 3: Use Supabase session access token for connector credentials

**Choice:** `PowerSyncBackendConnector` obtains the active Supabase session token and returns credentials for PowerSync service auth.

**Rationale:** Reuses existing auth system and keeps token lifecycle aligned with current frontend session handling.

**Alternatives considered:**

- Separate static PowerSync token: rejected for security and rotation complexity.
- Backend-issued custom connector token endpoint: deferred to a later hardening change.

### Decision 4: Keep uploadData as explicit interception boundary mapped to existing API contract

**Choice:** Implement `uploadData` with structured operation routing placeholders that target existing backend endpoints/procedures (`items`, `movements`, `projects`) without adding endpoints.

**Rationale:** Enables incremental rollout: first local persistence and reactivity, then durable mutation replay with known contract mapping.

**Alternatives considered:**

- No-op uploadData implementation: rejected because it hides required integration points.
- Immediate full mutation replay implementation: deferred to avoid over-scoping and unresolved conflict policies.

### Decision 5: Standardize on WASM/OPFS local persistence

**Choice:** Initialize `PowerSyncDatabase` with `@journeyapps/wa-sqlite` and OPFS-capable adapter.

**Rationale:** OPFS provides persistent browser/Tauri-webview storage suitable for offline-first desktop workflows.

**Alternatives considered:**

- In-memory SQLite only: rejected because it does not survive app restarts.
- IndexedDB abstraction without wa-sqlite: rejected due to mismatch with PowerSync SDK expectations.

## Risks / Trade-offs

- **Token expiration during sync** → Mitigation: connector credential fetch must occur per sync session and surface auth errors explicitly for re-login flows.
- **Schema drift between Prisma/OpenAPI and PowerSync client schema** → Mitigation: constrain schema to existing entities and document contract alignment requirements in spec.
- **Partial upload replay implementation may be mistaken as complete offline write support** → Mitigation: document upload path as prepared/interception-only until replay semantics are finalized.
- **Provider lifecycle issues in App Router** → Mitigation: isolate provider composition and initialize PowerSync once with controlled singleton/factory behavior.

## Migration Plan

1. Add frontend dependencies for PowerSync SDK, React bindings, Kysely, and wa-sqlite.
2. Add PowerSync module files (`schema.ts`, `connector.ts`, `db.ts`) and provider component.
3. Wrap the app with `PowerSyncProvider` in existing provider composition.
4. Update `openspec/specs/powersync/spec.md` with frontend architecture requirements.
5. Run `pnpm check` and `pnpm format` during implementation phase to ensure integration safety.

Rollback: remove provider wiring and new module imports, then uninstall new frontend dependencies.

## Open Questions

- Should upload replay call existing tRPC client procedures directly, or use REST OpenAPI paths for operation-level observability?
- Which mutation ordering and idempotency keys should be standardized for movement write replay?
- Should offline-first reads be introduced incrementally per feature page or via shared hooks abstraction first?
