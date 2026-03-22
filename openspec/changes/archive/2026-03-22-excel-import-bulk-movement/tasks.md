## 1. Database Schema - Add EXCEL_IMPORT Enum

- [x] 1.1 Add `EXCEL_IMPORT` to MovementType enum in `packages/database/prisma/schema/movement.prisma`

## 2. Schema Package - Update Types

- [x] 2.1 Update `packages/schema/src/movement.schema.ts` to include `EXCEL_IMPORT` in UserCreatableMovementTypeSchema (N/A - EXCEL_IMPORT is not user-creatable, only system-created during Excel import)
- [x] 2.2 Verify `MovementHeaderEntity` and related types include the new enum value (z.nativeEnum(MovementType) automatically includes new values)

## 3. Frontend - Bulk Movement Creation in Excel Import

- [x] 3.1 Modify `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`:
  - Before processing items, create ONE `EXCEL_IMPORT` movement with `uuidv4()`
  - Insert all warehouse inventory items into this single movement's `movement_details`
  - Keep existing EXIT movement logic for onsite inventory unchanged
  - Use observation: "Importación de stock desde Excel"
- [ ] 3.2 Run `pnpm check` to verify linting and type checking

## 4. Frontend - TypeBadge Component

- [x] 4.1 Update `apps/frontend/src/features/movements/components/movement-table.columns.tsx`:
  - Add `EXCEL_IMPORT` to `MOVEMENT_ROW_ACCENT` record with a distinct color (emerald/teal)
  - Add `EXCEL_IMPORT` case to `TypeBadge` function with emerald badge styling
  - Remove the observations-text hack (lines 56-63) since enum will be used
- [ ] 4.2 Run `pnpm check` to verify linting and type checking

## 5. Frontend - Toolbar Filter Tab for Excel Imports

- [ ] 5.1 Update `apps/frontend/src/features/movements/components/movement-table.types.ts`:
  - Add `'excelImport'` to `ActiveTab` type union
  - Add `excelImport: number` to `TypeCounts` type
- [ ] 5.2 Update `apps/frontend/src/app/(dashboard)/movements/page.tsx`:
  - Add `excelImport` to `DEFAULT_COUNTS`
  - Add `'excel_import'` to SQL WHERE clause filter list
  - Add `excelImport: 'EXCEL_IMPORT'` to `typeMap`
  - Add `excelImport` count to `typeCounts` calculation
- [ ] 5.3 Run `pnpm check` to verify linting and type checking

## 6. Verify and Test

- [ ] 6.1 Run `pnpm check` to verify all linting and type checking pass
- [ ] 6.2 Verify Excel import creates exactly ONE bulk movement with all items
- [ ] 6.3 Verify EXCEL_IMPORT badge renders correctly with emerald styling
- [ ] 6.4 Verify Excel Import filter tab shows correct count
- [ ] 6.5 Verify checkbox selection works correctly when switching to Excel Import tab
