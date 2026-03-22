## Why

Currently, Excel imports create a separate `PURCHASE` movement for every single item imported, cluttering the inventory history and making it difficult to trace bulk imports. A new `EXCEL_IMPORT` movement type will properly categorize these bulk operations and clean up the history.

## What Changes

- Add new `EXCEL_IMPORT` enum value to `MovementType`
- Modify Excel import processor to create ONE bulk movement containing all imported items instead of individual movements per item
- Update `TypeBadge` component to render a distinct badge for `EXCEL_IMPORT` movements
- Remove the existing observation-text hack that detects Excel imports

## Capabilities

### New Capabilities

- `excel-import-movement`: New movement type specifically for bulk Excel inventory imports

### Modified Capabilities

- `movements`: The movement type enum will include the new `EXCEL_IMPORT` value
- No changes to existing movement behavior or table selection logic

## Impact

**Files modified:**

- `packages/database/prisma/schema/movement.prisma` — Add `EXCEL_IMPORT` to MovementType enum
- `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx` — Create single bulk movement instead of per-item movements
- `apps/frontend/src/features/movements/components/movement-table.columns.tsx` — Add badge rendering for new enum

**No API or additional DB changes required** — this is purely a frontend change that uses the existing movement structure.
