## Context

Ingexpert currently computes stock through API-centered movement workflows and retrieves inventory through tRPC reads. This model introduces coupling between network availability and user experience, and duplicates stock integrity concerns across frontend, API, and database layers. The target architecture is offline-first with PowerSync-backed local SQLite reads/writes, while Supabase PostgreSQL triggers become the authoritative ledger reconciliation mechanism for `items.stock`.

The existing contract surface in `apps/api/openapi/openapi.json` confirms movement and item APIs exist, but this change shifts operational responsibility: reads and writes become local-first, and cloud correctness is enforced by DB trigger logic over append-only movement details.

## Goals / Non-Goals

**Goals:**

- Enforce deterministic stock reconciliation server-side using trigger logic on `movement_details` for `INSERT`, `UPDATE`, and `DELETE`.
- Move inventory GET flows to PowerSync `useQuery` with SQL projections aligned to local schema and sync-rule camelCase aliases.
- Move movement POST flows to local SQL writes with immediate optimistic stock updates in local SQLite.
- Ensure connector upload behavior pushes canonical movement rows and filters movement-originated optimistic `items` updates.
- Remove backend/manual stock-calculation procedures and frontend write-loading UX patterns that are obsolete in local-first mode.

**Non-Goals:**

- Replacing all non-inventory domains with offline-first behavior in this change.
- Introducing new public REST/tRPC endpoints for the offline flow.
- Redesigning movement business semantics (movement types, role rules, project constraints).

## Decisions

1. **Adopt append-only movement details as stock delta source**
   - Decision: Stock is derived by applying signed deltas from `movement_details` based on parent `movements.type`.
   - Why: Preserves auditable ledger semantics and avoids dual-write drift between movement rows and item stock.
   - Alternative considered: Keep API transaction logic as primary source; rejected due to offline sync race complexity and duplicated invariants.

2. **Implement a single trigger function handling all row lifecycle events**
   - Decision: One trigger function handles `INSERT`, `UPDATE`, and `DELETE` on `movement_details`, including reversal-and-reapply behavior for updates.
   - Why: Guarantees idempotent correction for quantity/item changes and preserves integrity under edits/deletes.
   - Alternative considered: Separate triggers per operation; rejected because consistency logic would fragment and increase maintenance risk.

3. **Move inventory reads to local SQL subscriptions**
   - Decision: Replace inventory tRPC read hooks with PowerSync `useQuery` and explicit aliasing (`snake_case` -> `camelCase`) to match frontend entities.
   - Why: Enables instant offline reads and stable type/shape compatibility with existing UI contracts.
   - Alternative considered: Hybrid local cache + tRPC refetch; rejected because it preserves online-first latency and hook duplication.

4. **Use local SQL writes plus optimistic stock adjustment**
   - Decision: Movement save writes to local `movements` and `movement_details`, then updates local `items.stock` optimistically.
   - Why: Provides immediate UX feedback while maintaining eventual server convergence through the trigger source of truth.
   - Alternative considered: Wait for cloud ACK before stock update; rejected due to degraded offline UX.

5. **Filter connector uploads for movement-originated `items` updates**
   - Decision: `uploadData` uploads movement tables but ignores `items` updates identified as optimistic movement-side effects; allow canonical item edits from admin item workflows.
   - Why: Prevents race conditions where local optimistic stock deltas overwrite or conflict with trigger-computed stock.
   - Alternative considered: Upload all local item changes and resolve conflicts server-side; rejected due to non-deterministic merge behavior and integrity risk.

## Risks / Trade-offs

- **[Risk] Trigger sign mapping mismatch with movement type enum** -> **Mitigation:** Centralize type-to-sign mapping in SQL function and include explicit error for unknown types.
- **[Risk] Local optimistic stock diverges before sync reconciliation** -> **Mitigation:** Treat local `items.stock` as provisional and rely on replicated server state to converge; avoid uploading movement-originated `items` updates.
- **[Risk] Update/delete on `movement_details` can double-apply deltas** -> **Mitigation:** Implement strict reversal (`OLD`) then apply (`NEW`) pattern in trigger function.
- **[Risk] Filtering `items` updates may drop valid admin edits** -> **Mitigation:** Add operation-origin discriminator in queue entries and only ignore entries tagged as movement-optimistic.
- **[Risk] Transitional code paths (tRPC + PowerSync) may coexist temporarily** -> **Mitigation:** Remove deprecated tRPC read/mutation usages in same rollout and verify no stale write spinners remain.

## Migration Plan

1. Add/replace Supabase SQL trigger function and attach trigger on `movement_details` for all row-level operations.
2. Refactor frontend inventory reads to PowerSync `useQuery` SQL with required alias projections.
3. Refactor movement creation flow to local PowerSync `db.execute` writes plus optimistic local stock updates.
4. Implement `SupabaseConnector.uploadData` queue iteration with movement uploads and selective `items` update filtering.
5. Remove obsolete tRPC stock-calculation procedures and frontend write loading states.
6. Validate behavior with `pnpm check` and targeted manual offline/online sync scenarios.

Rollback strategy:

- Revert connector filtering and frontend hooks to prior tRPC paths.
- Disable/revert trigger migration and restore API-managed stock transaction behavior.

## Open Questions

- What queue metadata field is canonical for identifying movement-originated optimistic `items` updates (`source`, `opTag`, or equivalent)?
- Should movement detail edits remain user-accessible, or be restricted to preserve strict append-only semantics while still supporting server correction guarantees?
