## Context

The movements feature uses `MovementType.EXCEL_IMPORT` to identify stock imported from Excel files. The database schema (`packages/database/prisma/schema/movement.prisma`) already includes `EXCEL_IMPORT` in the `MovementType` enum, and the frontend type definitions in `movement-table.columns.tsx` and `movement-table.types.ts` already handle it with emerald/green styling.

However, `movement-detail-sheet.tsx` (which displays movement details in a slide-over panel) has two issues:

1. **Wrong color**: It detects Excel imports via observation string matching (`'importación de stock desde excel'`) and maps them to `TYPE_CONFIG.PURCHASE` (blue), not the emerald green used in table rows.

2. **Fragile detection**: Using string matching instead of the type enum is brittle and inconsistent with how other movement types are handled.

Additionally, `movement-table-toolbar.tsx` lacks an `excelImport` filter tab, even though `ActiveTab` and `TypeCounts` types already define `excelImport` as a valid option.

## Goals / Non-Goals

**Goals:**

- Normalize Excel import detection in `movement-detail-sheet.tsx` to use `movement.type === 'EXCEL_IMPORT'` instead of observation string parsing
- Add `EXCEL_IMPORT` entry to `TYPE_CONFIG` with emerald/green colors matching the table rows
- Ensure badge border styling matches between table rows and detail sheet header
- Add `excelImport` filter tab to `movement-table-toolbar.tsx`

**Non-Goals:**

- No database schema changes (EXCEL_IMPORT enum already exists)
- No changes to movement creation flow
- No changes to API or tRPC routers

## Decisions

### 1. Add EXCEL_IMPORT to TYPE_CONFIG in movement-detail-sheet.tsx

The `TYPE_CONFIG` object maps movement types to display properties (icon, label, colors). Currently, Excel imports fall through to `TYPE_CONFIG.PURCHASE` because there's no `EXCEL_IMPORT` key.

**Decision**: Add a complete `EXCEL_IMPORT` entry with emerald/green colors:

```typescript
EXCEL_IMPORT: {
  icon: ArrowDownCircle,
  label: 'Importación desde Excel',
  description: 'Ingreso importado desde archivo Excel',
  colors: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
},
```

This matches the styling already defined in `movement-table.columns.tsx` for `TypeBadge`.

### 2. Remove observation string matching in movement-detail-sheet.tsx

The current code (lines 250-260) detects Excel imports by checking observations:

```typescript
const isExcelImport =
  movement?.observations?.toLowerCase().includes('importación de stock desde excel') ?? false;
```

**Decision**: Replace with direct type check:

```typescript
const isExcelImport = movement?.type === 'EXCEL_IMPORT';
```

This requires `EXCEL_IMPORT` to be properly typed in `LocalMovementHeaderRow`. The `type` field is already `'EXCEL_IMPORT' | 'PURCHASE' | 'RETURN' | ...` in the database, so no schema changes needed.

### 3. Add excelImport tab to TAB_ITEMS in movement-table-toolbar.tsx

The `TAB_ITEMS` array defines the type filter tabs. It currently lacks an `excelImport` entry.

**Decision**: Add:

```typescript
{ value: 'excelImport', label: 'Excel' },
```

The `ActiveTab` type already includes `excelImport`, and `TypeCounts` already has `excelImport`, so no type changes needed.

### 4. Ensure border consistency on badges

The table rows use `border-emerald-200` in badge classes. The detail sheet header should use the same border color class.

**Decision**: Ensure `config.colors.badge` includes `border-emerald-200` (or equivalent dark mode `dark:border-emerald-800`) to match the table badge styling exactly.

## Risks / Trade-offs

| Risk                                                                                            | Mitigation                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Observation string matching may have been needed if `type` isn't reliably set to `EXCEL_IMPORT` | Verify PowerSync connector or API correctly sets `type = 'EXCEL_IMPORT'` for imported movements. If not, fall back to observation check. |
| Adding new tab increases UI complexity                                                          | The `excelImport` count will be 0 when no Excel imports exist, so the tab appears but is empty.                                          |

[Risk]: Excel import movements may not have `type = 'EXCEL_IMPORT'` set → [Mitigation]: Keep observation string fallback for backward compatibility, or fix at source (PowerSync connector)
