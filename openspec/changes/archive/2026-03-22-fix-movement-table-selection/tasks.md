## 1. Analyze Reference Implementation

- [x] 1.1 Review inventory-table.tsx `filteredExportItems` memo implementation
- [x] 1.2 Review inventory-table.tsx `currentScopeIds` usage with filtered items
- [x] 1.3 Review movement-table-toolbar.tsx for filter props passed

## 2. Implement filteredExportItems in movement-table.tsx

- [x] 2.1 Add `filteredExportItems` useMemo in movement-table.tsx that filters `exportMovements` by:
  - `search` text match on movement fields
  - Note: typeFilter, projectFilter, creatorFilter, dateFrom/dateTo are already applied server-side in exportMovements
- [x] 2.2 Update `currentScopeIds` to use `filteredExportItems.map((m) => m.id)` instead of `exportMovements.map((m) => m.id)`
- [x] 2.3 Update `globalSelectionState` to use `filteredExportItems.length` for checked/indeterminate calculation

## 3. Verify and Test

- [x] 3.1 Run `pnpm check` to verify linting and type checking pass
- [ ] 3.2 Verify header checkbox behavior: select all with filter applies only to filtered items
- [ ] 3.3 Verify toolbar checkbox only checks when ALL unfiltered items are selected
- [ ] 3.4 Verify selection persists across filter changes and pagination
