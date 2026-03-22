## Why

The movement table's selection behavior is broken when filters are applied. Currently, "select all" in the header checkbox selects everything globally instead of only items within the current filter scope. Selection is also not persisted across navigation. The inventory table already implements this correctly and should be used as reference.

## What Changes

- Fix `currentScopeIds` in `movement-table.tsx` to use a filtered set based on active filters (type, project, creator, date range, search), not `exportMovements` directly
- Align header checkbox behavior with inventory table: select only items matching current filters
- Align toolbar "select all" checkbox to represent "select all globally (unfiltered)"
- Selection persists when navigating between pages or changing filters

## Capabilities

### New Capabilities

None - this is a bug fix within existing functionality.

### Modified Capabilities

- `movements`: Fix selection scope calculation in movement-table.tsx to use `filteredExportItems` instead of raw `exportMovements`

## Impact

**Files modified:**

- `apps/frontend/src/features/movements/components/movement-table.tsx`
- `apps/frontend/src/features/movements/components/movement-table-toolbar.tsx` (possibly, depends on implementation)

**Reference implementation (no changes needed):**

- `apps/frontend/src/features/inventory/components/inventory-table.tsx`
- `apps/frontend/src/features/inventory/components/inventory-table-toolbar.tsx`
- `apps/frontend/src/features/inventory/components/inventory-table.columns.tsx`

**No API or database changes required.**
