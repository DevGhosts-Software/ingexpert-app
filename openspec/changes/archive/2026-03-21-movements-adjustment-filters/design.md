## Context

The Movements module uses a tabbed filter system to view movements by type. Currently, only 4 type tabs exist (Compras, Devoluciones, Salidas, Bajas), but stock adjustment movements (STOCK_ADJUSTMENT_IN and STOCK_ADJUSTMENT_OUT) are filtered out of the tab counts and not directly accessible via tabs.

The selection/checkbox system was previously implemented but needs verification to ensure it works correctly with the new adjustment tabs and doesn't have stale state issues.

## Goals / Non-Goals

**Goals:**

- Add 'Ajuste Positivo' (STOCK_ADJUSTMENT_IN) and 'Ajuste Negativo' (STOCK_ADJUSTMENT_OUT) filter tabs to the Movements toolbar
- Update TypeCounts to include counts for adjustment types
- Ensure checkbox selection persists correctly across pagination and filter changes
- Ensure Export button counter updates correctly with selection changes

**Non-Goals:**

- No backend changes required - this is a frontend-only enhancement
- No new API endpoints or data models
- No changes to movement creation flow

## Decisions

**Decision 1: Extend ActiveTab type instead of creating new filter mechanism**

The existing toolbar uses a tab-based filter with `ActiveTab` type. Rather than introducing a new dropdown or section, we extend the existing `ActiveTab` type to include `stockAdjustmentIn` and `stockAdjustmentOut`.

_Rationale_: Maintains consistency with existing UI pattern. Users already understand tab-based filtering.

**Decision 2: currentScopeIds uses filtered (not paginated) data**

In `movement-table.tsx`, `currentScopeIds` is derived from `exportMovements` (the filtered but not paginated dataset). This matches how the Inventory module works.

_Rationale_: Header checkbox "select all in current scope" should select all visible items matching current filters, regardless of pagination. Selection cleanup via `useEffect` on `exportMovements` ensures stale IDs are removed when filters change.

**Decision 3: Use `filteredExportItems` pattern for Movements selection scope**

Currently `movement-table.tsx` computes `currentScopeIds` from `exportMovements` directly. To properly handle selection across tabs, we should use the same filtered dataset concept as Inventory - apply all active filters to `exportMovements` before computing `currentScopeIds`.

_Rationale_: Ensures header checkbox scope matches what's visible to the user.

## Risks / Trade-offs

[Risk] Adding tabs increases horizontal space - Trade-off: Tabs are standard UI pattern, shadcn TabsList handles overflow gracefully

[Risk] Selection state could become stale if `exportMovements` changes but component doesn't re-render properly - Mitigation: `useEffect` cleanup removes invalid IDs when `exportMovements` changes

[Risk] Global checkbox "select all existing" may include items outside current type filter - Trade-off: This is intentional behavior matching Inventory module - global selection selects ALL movements, not just filtered subset
