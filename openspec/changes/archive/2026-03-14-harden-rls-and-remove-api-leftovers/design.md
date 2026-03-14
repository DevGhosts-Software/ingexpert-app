## Context

Ingexpert has moved to a local-first runtime where Supabase RLS is now the critical enforcement layer for frontend and PowerSync mutation paths. `movements` and `movement_details` are immutable-ledger tables but currently lack explicit RLS guarantees for insert-only semantics. In parallel, the API runtime has been removed, yet workspace/task/dependency metadata can still retain stale API references that create drift and maintenance risk.

## Goals / Non-Goals

**Goals:**

- Enforce explicit RLS for `movements` and `movement_details` with insert-only behavior.
- Keep read/write behavior compatible with current working local-first flows.
- Remove stale API runtime leftovers from workspace/package/task configuration.
- Preserve immutable-ledger guarantees at the database policy layer.

**Non-Goals:**

- Re-introducing API runtime paths.
- Changing movement domain semantics (stock direction, kit expansion logic).
- Large data-model redesign beyond policy and configuration cleanup.

## Decisions

1. **Movement tables will be governed by explicit immutable RLS policies.**  
   We will define `SELECT` and `INSERT` policies for `movements` and `movement_details`, and intentionally omit `UPDATE`/`DELETE` policies so those operations remain denied under RLS.  
   **Alternative considered:** Trigger-based immutability only.  
   **Why not:** Triggers alone do not express per-role read/write authorization and do not replace row-level authorization intent.

2. **Read access remains role-scoped to avoid breaking current UX.**  
   Existing role/identity helpers in `04_powersync-rls.sql` will be reused to preserve current visibility semantics while tightening write controls.  
   **Alternative considered:** Restrict reads to admins only.  
   **Why not:** High risk of breaking existing movement views and sync behavior for non-admin authorized users.

3. **API cleanup is repo-configuration-first and evidence-driven.**  
   We will remove API leftovers from `pnpm-workspace.yaml`, `turbo.json`, and package manifests only when references are truly unused.  
   **Alternative considered:** Keep dormant API references for “future fallback.”  
   **Why not:** Dormant references increase install/build complexity and contradict finalized local-first ownership.

## Risks / Trade-offs

- **[Risk]** Overly strict RLS may block legitimate movement writes.  
  **Mitigation:** Preserve existing auth helper predicates and validate expected insert paths before/after migration.

- **[Risk]** Cleanup may remove dependencies still needed transitively by scripts.  
  **Mitigation:** Verify with workspace-wide check/build graph (`pnpm check`) after cleanup.

- **[Risk]** Existing data sync assumptions might rely on broad read policies.  
  **Mitigation:** Keep read policies aligned with current visibility model; only tighten mutation surface.
