## Why

Users cannot import an Excel file they just exported because the Export format includes three inventory columns (INVENTARIO_ALMACEN, INVENTARIO_OBRA, INVENTARIO_TOTAL) while the Classic Import format only expects one (INVENTARIO_ALMACEN). This creates a round-trip incompatibility that forces users to manually adjust exported files before re-importing them.

## What Changes

- Modify `parseInventoryRows` in `import-excel-dialog.tsx` to detect the file format by inspecting column headers
- When INVENTARIO_TOTAL column is detected (Export Format): read only the total column and inject 100% into warehouse inventory
- When INVENTARIO_TOTAL column is absent (Classic Import Format): maintain current behavior reading INVENTARIO_ALMACEN into warehouse inventory
- Both formats continue to use PURCHASE movement type with Excel Import observation text for stock additions

## Capabilities

### New Capabilities

- `inventory-import-format-detection`: Detect whether an imported Excel file follows the Export format (3 inventory columns) or Classic Import format (1 inventory column) and route parsing accordingly

### Modified Capabilities

- `inventory`: The inventory import capability requirements change to support two distinct file formats with different stock column mapping rules

## Impact

- File: `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`
- Parser function `parseInventoryRows` is modified to accept a format detection parameter
- No changes to Prisma schema, tRPC routers, or OpenAPI contract required
