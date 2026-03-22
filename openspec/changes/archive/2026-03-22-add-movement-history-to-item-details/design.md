## Context

The `ItemDetailsSheet` component displays inventory item details but omits movement history. The `RowActions` component in `inventory-table.columns.tsx` already contains movement history display logic (lines 114-200), but it's embedded within a dropdown menu context and not reusable elsewhere.

## Goals / Non-Goals

**Goals:**

- Extract movement history logic into a reusable `MovementHistoryList` component
- Display movement history in `ItemDetailsSheet` for non-KIT items
- Add visual enhancements (icons, color coding) for better UX

**Non-Goals:**

- Modifying the existing dropdown history view in `RowActions`
- Adding new API endpoints or changing data models
- Supporting KIT items (kits don't have movement history)

## Decisions

### 1. Extract `MovementHistoryList` as standalone component

**Decision:** Create `movement-history-list.tsx` with the SQL query, `formatMovementType`, and rendering logic.

**Rationale:** DRY principle - the existing code in `RowActions` already has the query and formatting. Extracting it allows reuse in both `RowActions` (reducing duplication) and `ItemDetailsSheet`.

**Alternatives considered:**

- Copy-paste the logic into `ItemDetailsSheet` - rejected due to code duplication
- Keep it in `RowActions` and pass as prop - rejected as `RowActions` is tightly coupled to dropdown context

### 2. Reuse SQL query pattern

**Decision:** Use the same query pattern from `inventory-table.columns.tsx:115-137`.

**Rationale:** Ensures consistency with existing behavior and reuses the same filtered movement types.

### 3. Visual enhancement approach

**Decision:** Add icons and color badges per movement type.

**Rationale:** Improves scannability - users can quickly identify movement types without reading text.

## Risks / Trade-offs

[Risk] Increased bundle size from new component → **Mitigation:** Tree-shaking will handle it; the component is small.
[Risk] Query performance if many movements exist → **Mitigation:** LIMIT 12 as in existing code.
