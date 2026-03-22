## Context

The movement table selection feature has a bug: when a filter is applied (e.g., type=compras), the header's "select all" checkbox incorrectly considers all movements globally, not just those matching the filter. This means:

1. Header checkbox shows "indeterminate" even when all filtered items are selected
2. Clicking "select all" in header selects items outside the filter scope
3. The toolbar "select all" (global selection) is incorrectly checked when filtered items are fully selected

The inventory table (`inventory-table.tsx`) already correctly implements this pattern using `filteredExportItems` instead of raw `exportItems` for `currentScopeIds`.

## Goals / Non-Goals

**Goals:**

- Fix `currentScopeIds` in movement-table to use filtered export movements matching the inventory table pattern
- Ensure header checkbox "select all" only selects items in current filter scope
- Ensure toolbar checkbox correctly indicates global (unfiltered) selection state
- Selection persists across pagination/navigation (already works via `useEffect` cleanup)

**Non-Goals:**

- No API changes - this is purely a frontend presentation bug fix
- No changes to the reference inventory table implementation

## Decisions

**Decision 1: Use filteredExportItems pattern from inventory table**

The inventory table creates a `filteredExportItems` memo that filters `exportItems` based on current UI filters (search, location, type tab). The movement table should do the same.

Current (broken) code:

```tsx
const currentScopeIds = useMemo(
  () => exportMovements.map((movement) => movement.id),
  [exportMovements],
);
```

Should become (like inventory):

```tsx
const filteredExportItems = useMemo(() => {
  // Filter exportMovements based on: search, typeFilter, projectFilter, creatorFilter, dateFrom, dateTo
}, [exportMovements, search, typeFilter, projectFilter, creatorFilter, dateFrom, dateTo]);

const currentScopeIds = useMemo(
  () => filteredExportItems.map((item) => item.id),
  [filteredExportItems],
);
```

**Decision 2: Reuse existing filter props**

The movement table already receives filter props from its parent. We need to mirror the `filteredExportItems` calculation that the inventory table does internally.

Filters to apply:

- `search` (text search on movement fields)
- `typeFilter` (type tabs: all, purchase, return, exit, writeoff, stockAdjustmentIn, stockAdjustmentOut)
- `projectFilter`
- `creatorFilter`
- `dateFrom` / `dateTo`

## Risks / Trade-offs

- **Risk**: The movement table filter logic might differ from inventory. Mitigation: Compare filter application logic carefully against the parent component that computes filters before passing to the table.
- **Risk**: Adding `filteredExportItems` memo could cause extra re-renders. Mitigation: The inventory table pattern works well and this is a standard React optimization approach.
