## 1. Type Updates

- [x] 1.1 Update `ActiveTab` type in `movement-table.types.ts` to include `stockAdjustmentIn` and `stockAdjustmentOut`
- [x] 1.2 Update `TypeCounts` type in `movement-table.types.ts` to include `stockAdjustmentIn` and `stockAdjustmentOut` counts

## 2. Toolbar Updates

- [x] 2.1 Add `stockAdjustmentIn` and `stockAdjustmentOut` entries to `TAB_ITEMS` array in `movement-table-toolbar.tsx` with labels "Ajuste Positivo" and "Ajuste Negativo"

## 3. Movements Page Updates

- [x] 3.1 Update `typeMap` in `page.tsx` to map new tab values to `STOCK_ADJUSTMENT_IN` and `STOCK_ADJUSTMENT_OUT`
- [x] 3.2 Update `typeCounts` computation in `page.tsx` to include counts for `stockAdjustmentIn` and `stockAdjustmentOut`
- [x] 3.3 Update `DEFAULT_COUNTS` to include new count entries

## 4. Verification and Fixes

- [x] 4.1 Verify `currentScopeIds` in `movement-table.tsx` correctly reflects filtered movements (not just raw exportMovements)
- [x] 4.2 Verify selection cleanup `useEffect` handles filter changes correctly
- [x] 4.3 Verify `headerSelectionState` computes correctly with new adjustment tabs
- [x] 4.4 Verify `globalSelectionState` continues to work across all movements

## 5. Testing

- [x] 5.1 Run `pnpm check` to verify type correctness
