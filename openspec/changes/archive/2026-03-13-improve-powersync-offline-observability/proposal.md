## Why

PowerSync is partially local-first today, but key user flows still degrade offline: session-dependent sync/upload fails, projects and other screens still depend on live tRPC reads, and debug visibility is too shallow to diagnose failures quickly. We need a complete offline contract so users can read and post reliably without Wi-Fi and developers can identify sync blockers fast.

## What Changes

- Improve `apps/frontend/src/components/powersync-debug.tsx` to expose actionable diagnostics (sync state, queue state, credential/session state, per-table availability, and error surfacing), not just item/bucket counters.
- Define offline Supabase session persistence/rehydration requirements so PowerSync credential fetch/upload can continue using cached auth state when connectivity drops and recover cleanly when connectivity returns.
- Expand local-first read coverage for PowerSync-backed tables (including projects and related lookups used by movement flows) so key dashboard data still loads offline.
- Tighten connector behavior and failure semantics for upload queue processing to clarify what can post offline, what is queued, and when entries are retried/marked complete.
- Standardize SQL projection/mapping guidance to avoid unnecessary alias churn (e.g., `imageUrl` vs `image_url`) and only map when required by the app contract.
- Clarify no new API routes are introduced; existing `/items`, `/movements`, `/projects`, and `/auth/*` contracts remain the source for sync/upload compatibility.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `powersync`: Add requirements for richer debug observability, offline session-aware credential behavior, queue diagnostics, and resilient upload/read behavior during network transitions.
- `projects`: Add/adjust requirements so project data required by dashboard and movement workflows can be loaded from local PowerSync state when offline.
- `inventory`: Refine requirements for SQL field-shape handling so aliasing is applied only when necessary and does not create redundant mappings.
- `movements`: Clarify offline posting expectations (local write first, queued cloud upload semantics, and user-visible status while disconnected).

## Impact

- **Frontend code:** `apps/frontend/src/components/powersync-debug.tsx`, `apps/frontend/src/lib/powersync/*`, and dashboard pages still using online-only reads.
- **Specs:** Deltas under `openspec/changes/improve-powersync-offline-observability/specs/{powersync,projects,inventory,movements}/spec.md`.
- **API/Data model:** No new endpoints and no Prisma schema changes expected; behavior aligns to existing OpenAPI contracts.
- **Developer workflow:** Better diagnostics for offline issues and clearer mapping conventions to reduce unnecessary SQL alias maintenance.
