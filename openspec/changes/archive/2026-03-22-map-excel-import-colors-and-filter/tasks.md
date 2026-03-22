## 1. Update TYPE_CONFIG in movement-detail-sheet.tsx

- [x] 1.1 Add `EXCEL_IMPORT` entry to `TYPE_CONFIG` with emerald/green colors matching `movement-table.columns.tsx` (`bg-emerald-50`, `border-emerald-200`, `text-emerald-600`, `badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'`)
- [x] 1.2 Add `ArrowDownCircle` icon and appropriate label/description for EXCEL_IMPORT

## 2. Normalize Excel import detection in movement-detail-sheet.tsx

- [x] 2.1 Replace observation string matching (`movement?.observations?.toLowerCase().includes('importación de stock desde excel')`) with direct type check: `movement?.type === 'EXCEL_IMPORT'`
- [x] 2.2 Remove the spread from `TYPE_CONFIG.PURCHASE` for Excel import config - use standalone EXCEL_IMPORT config instead

## 3. Add excelImport filter tab to movement-table-toolbar.tsx

- [x] 3.1 Add `{ value: 'excelImport', label: 'Excel' }` (or "Importación Excel") to `TAB_ITEMS` array
- [x] 3.2 Ensure the `excelImport` tab badge displays correct count from `typeCounts.excelImport`

## 4. Verify consistency

- [x] 4.1 Compare badge styling in `movement-detail-sheet.tsx` header with `movement-table.columns.tsx` `TypeBadge` - ensure border colors match exactly
- [x] 4.2 Run `pnpm check` to verify no type errors or lint issues
