## Why

The movements section has `EXCEL_IMPORT` as a movement type enum in the database, but the detail sheet (`movement-detail-sheet.tsx`) still detects Excel imports via fragile observation string matching instead of using the type. Additionally, the type badge styling between the table rows and the detail sheet header doesn't match (different border colors), and there's no UI filter to view only Excel imports.

## What Changes

- Replace observation string matching with `movement.type === 'EXCEL_IMPORT'` check in `movement-detail-sheet.tsx`
- Add `EXCEL_IMPORT` entry to `TYPE_CONFIG` in `movement-detail-sheet.tsx` with emerald/green colors matching the table rows
- Ensure badge border styling is consistent between table and detail sheet
- Add Excel import filter tab to `movement-table-toolbar.tsx`

## Capabilities

### New Capabilities

- `excel-import-filter`: Add a filter option in the movements toolbar to show only Excel-imported stock movements

### Modified Capabilities

- `movements`: UI consistency for Excel import type - use type enum for detection, match badge styling across table and detail sheet

## Impact

- **apps/frontend**:
  - `movement-detail-sheet.tsx`: Detect Excel imports by type enum, add EXCEL_IMPORT to TYPE_CONFIG, match badge styling
  - `movement-table-toolbar.tsx`: Add excelImport filter tab
