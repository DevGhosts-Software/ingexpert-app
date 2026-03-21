## Why

The Movements module lacks filter tabs for stock adjustment movements, forcing users to search manually for "Ajuste Positivo" and "Ajuste Negativo" entries. Additionally, the checkbox and export selection system needs verification and fixes to ensure seamless integration with the new adjustment filters and proper persistence across pagination.

## What Changes

- **New**: Add 'Ajuste Positivo' and 'Ajuste Negativo' filter tabs to the Movements toolbar, complementing existing type tabs (Todos, Compras, Devoluciones, Salidas, Bajas)
- **Modify**: Update `TypeCounts` type to include `stockAdjustmentIn` and `stockAdjustmentOut` counts
- **Modify**: Extend `ActiveTab` type to include `stockAdjustmentIn` and `stockAdjustmentOut` values
- **Modify**: Update `typeMap` in movements page to handle new tab values
- **Modify**: Update `typeCounts` computation to include stock adjustment types
- **Modify**: Verify and fix checkbox selection logic to work correctly with new tabs and ensure no stale state or remounting bugs

## Capabilities

### New Capabilities

- `movement-adjustment-filters`: Filter movements by stock adjustment type (positive/negative) directly from toolbar tabs

### Modified Capabilities

- `movement-selection`: The checkbox/export selection system requires updates to handle the new adjustment filter tabs and maintain proper state synchronization

## Impact

**Frontend**:

- `apps/frontend/src/features/movements/components/movement-table-toolbar.tsx` - Add new tabs
- `apps/frontend/src/features/movements/components/movement-table.types.ts` - Update types
- `apps/frontend/src/app/(dashboard)/movements/page.tsx` - Add adjustment filtering logic and counts
- `apps/frontend/src/features/movements/components/movement-table.tsx` - Verify checkbox logic works with new filters
