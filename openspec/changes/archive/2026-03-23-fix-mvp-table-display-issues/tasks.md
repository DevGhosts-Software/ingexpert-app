## 1. Kit Row Display Fix

- [x] 1.1 Update `warehouseInventory` column cell in `inventory-table.columns.tsx` to show em-dash for kit rows
- [x] 1.2 Update `onsiteInventory` column cell in `inventory-table.columns.tsx` to show em-dash for kit rows
- [x] 1.3 Update `totalInventory` column cell in `inventory-table.columns.tsx` to show em-dash for kit rows
- [x] 1.4 Run `pnpm check` to verify changes

## 2. Movement Export ID Column

- [x] 2.1 Add `MOVIMIENTO_ID` column to `movementRows` mapping in `movement-table-toolbar.tsx`
- [x] 2.2 Run `pnpm check` to verify changes

## 3. Restrict Export Button to Admin Users

- [x] 3.1 Wrap export button with `{isAdmin && ...}` condition in `movement-table-toolbar.tsx`
- [x] 3.2 Run `pnpm check` to verify changes

## 4. Date Filter UTC Conversion

- [x] 4.1 Update movement date filter in `page.tsx` to use `toLocaleDateString('en-CA')` for local date comparison
- [x] 4.2 Run `pnpm check` to verify changes

## 5. Hide Selection Checkboxes from Non-Admin Users

- [x] 5.1 Update `getColumns` in `movement-table.columns.tsx` to accept `isAdmin` parameter
- [x] 5.2 Gate selection column behind `isAdmin` check in `movement-table.columns.tsx`
- [x] 5.3 Update `movement-table.tsx` to pass `isAdmin` to `getColumns`
- [x] 5.4 Run `pnpm check` to verify changes
