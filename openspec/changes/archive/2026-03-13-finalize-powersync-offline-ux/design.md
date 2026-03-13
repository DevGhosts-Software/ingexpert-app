## Context

PowerSync local-first behavior is partially implemented, but critical UX paths still block on online dependencies. The final rollout needs deterministic offline behavior for auth gating, item writes, and movement reads, plus a small operator UX change for debug panel placement. Existing API contracts already cover auth/items/movements endpoints; this change focuses on client orchestration and local-first guarantees.

## Goals / Non-Goals

**Goals:**

- Ensure local-authenticated users are not bounced by online-only auth guard checks.
- Ensure item create/edit/save operations commit instantly to local SQLite and defer remote upload.
- Ensure movement list/detail/open paths read from local PowerSync data without blocking on tRPC.
- Establish explicit audit criteria to detect and remove hidden network waits in local-first paths.
- Move the PowerSync debug component to the right side of the UI.

**Non-Goals:**

- Introducing new backend endpoints or changing OpenAPI contracts.
- Redesigning movement/business validation rules already defined in current specs.
- Replacing Supabase/JWKS verification model for online token validation.

## Decisions

1. **Offline-tolerant auth gating with bounded trust window**
   - Keep strict online JWT validation when connectivity is available.
   - Permit local session continuation when offline using previously validated session metadata and explicit offline state.
   - Rationale: preserves security posture online while preventing offline lockout for local-first screens.
   - Alternative considered: always require live JWKS verification. Rejected because it breaks offline-first usage.

2. **Write path is local-commit first, queue second, remote eventual**
   - Item create/edit and movement create flows must complete UI success from local SQL completion only.
   - Queue state is surfaced as pending upload; no UI spinner may wait on remote mutation resolution.
   - Rationale: user expectation for instant response and resilience under flaky/no network.
   - Alternative considered: hybrid local+remote wait for “confirmed” success. Rejected due to latency regressions.

3. **Read path priority: local SQL subscriptions over tRPC hooks**
   - Movement list/detail selectors and inventory dependencies are sourced from PowerSync-backed local tables first.
   - tRPC reads remain for hydration/reconciliation boundaries, not blocking primary rendering.
   - Rationale: eliminates online latency and loading regressions in already-synced datasets.

4. **Audit-driven rollout**
   - Add an explicit audit pass over auth, inventory, and movement screens to identify awaited tRPC/mutation dependencies in local-first flows.
   - Rationale: prevents partial fixes and ensures consistency across related screens/components.

5. **Debug panel placement standardization**
   - Place sync debug UI on right-side dock/rail consistently.
   - Rationale: reduces overlap with left-nav interactions and aligns operator observability ergonomics.

## Risks / Trade-offs

- **[Risk] Offline session misuse if device has stale credentials** → **Mitigation:** require prior successful online validation marker and enforce token/session expiry checks before allowing offline continuation.
- **[Risk] Perceived success before remote rejection** → **Mitigation:** clear queued/error sync states and retry affordances in debug/status UI.
- **[Risk] Data drift between local and remote sources** → **Mitigation:** local-first reads with connector reconciliation, preserving idempotent writes and conflict visibility.
- **[Risk] Hidden component-level tRPC calls remain** → **Mitigation:** audit checklist with route/component inventory and explicit replacement criteria.

## Migration Plan

1. Introduce spec deltas for auth, inventory, movements, and cross-cutting powersync-offline-ux capability.
2. Implement auth guard fallback logic for offline continuation based on validated local session state.
3. Remove blocking awaits/spinners in item and movement write flows; ensure local queue commit semantics.
4. Replace movement read blockers with local PowerSync SQL subscriptions.
5. Reposition debug component and validate layout behavior.
6. Run `pnpm check` and `pnpm format`, then validate offline and flaky-network scenarios manually.

## Open Questions

- Should offline continuation be allowed only for a maximum age since last successful online token validation?
- Should queued-upload status appear inline in inventory/movement forms in addition to global debug surface?
