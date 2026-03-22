## 1. Modify parseInventoryRows to Support Format Detection

- [x] 1.1 Update `parseInventoryRows` in `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx` to accept normalized headers as a parameter
- [x] 1.2 Add logic to detect Export Format by checking if `INVENTARIO_TOTAL` exists in normalized headers
- [x] 1.3 For Export Format: read `INVENTARIO_TOTAL` value and set warehouseInventory to that value, onsiteInventory to 0
- [x] 1.4 For Classic Import Format: maintain existing warehouseInventory/onsiteInventory parsing behavior
- [x] 1.5 Run `pnpm check` to verify no type or lint errors

## 2. Update handleFileChange to Pass Headers

- [x] 2.1 Modify `handleFileChange` to pass normalized header keys to `parseInventoryRows`
- [x] 2.2 Test that both Export Format and Classic Import Format files are correctly parsed
- [x] 2.3 Run `pnpm check` to verify no type or lint errors
