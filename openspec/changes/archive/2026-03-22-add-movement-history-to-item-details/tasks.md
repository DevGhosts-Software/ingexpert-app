## 1. Create MovementHistoryList Component

- [x] 1.1 Create `movement-history-list.tsx` in `apps/frontend/src/features/inventory/components/`
- [x] 1.2 Extract SQL query logic from `RowActions` in `inventory-table.columns.tsx` (lines 114-137)
- [x] 1.3 Extract `formatMovementType` function with color-coded icons for movement types
- [x] 1.4 Add `MovementHistoryRow` type definition
- [x] 1.5 Implement loading and empty states matching existing UI patterns
- [x] 1.6 Run `pnpm check` to verify no type errors

## 2. Integrate MovementHistoryList into ItemDetailsSheet

- [x] 2.1 Import `MovementHistoryList` in `item-details-sheet.tsx`
- [x] 2.2 Add movement history section after metadata section, only for non-KIT items
- [x] 2.3 Run `pnpm check` to verify no type errors

## 3. Verify Implementation

- [x] 3.1 Run `pnpm check` (format → lint → type-check → build)
- [ ] 3.2 Test that movement history appears in item details sheet for non-KIT items
- [ ] 3.3 Test that KIT items do not show movement history section
