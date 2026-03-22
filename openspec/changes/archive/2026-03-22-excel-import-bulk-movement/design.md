## Context

The Excel import functionality (`import-excel-dialog.tsx`) currently creates individual `PURCHASE` movements for each item imported (line 304-331) and individual `EXIT` movements for items with onsite inventory (line 343-370). This means importing 100 items from Excel creates 100+ movement records, cluttering the inventory history.

The `TypeBadge` component in `movement-table.columns.tsx` (lines 56-63) currently uses an observations-text hack to detect Excel imports (`importación de stock desde excel` in observations) instead of a proper movement type enum.

## Goals / Non-Goals

**Goals:**

- Add `EXCEL_IMPORT` to the `MovementType` enum
- Modify import logic to create ONE bulk movement containing all imported items (not one per item)
- Update `TypeBadge` to render a proper badge for `EXCEL_IMPORT` movements
- Remove the observations-text hack from `TypeBadge`

**Non-Goals:**

- Do NOT change Excel file parsing logic (export format vs classic format detection)
- Do NOT change the math that injects stock into `Inventario en almacén`
- Do NOT touch checkbox or export functionalities
- Do NOT change the per-item EXIT movement creation for onsite inventory (this is separate logic)

## Decisions

**Decision 1: Add `EXCEL_IMPORT` to MovementType enum**

The Prisma schema at `packages/database/prisma/schema/movement.prisma` defines the enum. Add `EXCEL_IMPORT` as a new value alongside existing `PURCHASE`, `EXIT`, etc.

**Decision 2: Create single bulk movement for warehouse inventory items**

In `import-excel-dialog.tsx`, instead of creating a movement per item:

- Before processing chunks, create ONE `EXCEL_IMPORT` movement
- For each item with positive `totalImportedQuantity`, insert a `movement_detail` into that single movement
- The single movement carries the observation `Importación de stock desde Excel`

**Decision 3: Keep EXIT movements for onsite inventory separate**

The existing logic for onsite inventory (items going to `Inventario en obra` via EXIT movements) should remain unchanged. This is intentional behavior — items physically moved to a project site need separate tracking.

**Decision 4: Remove observations-text hack in TypeBadge**

Once `EXCEL_IMPORT` enum is in use, the special case in `TypeBadge` (lines 56-63) that checks `observations.includes('importación de stock desde excel')` should be replaced with a proper `case 'EXCEL_IMPORT':` check.

## Risks / Trade-offs

- **Risk**: Existing Excel imports in the DB were created with `PURCHASE` type. These will still show as "Compra" in the UI. Mitigation: Run a data migration to update old movements, or accept this as historical data quirk.
- **Risk**: The `EXCEL_IMPORT` movement may grow large with many items. Mitigation: The existing chunked processing already handles this; movement_details are inserted per-item within a single transaction.
