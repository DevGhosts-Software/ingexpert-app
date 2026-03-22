## MODIFIED Requirements

### Requirement: Excel import movements SHALL use type enum instead of observation string matching

The `movement-detail-sheet.tsx` component MUST detect Excel import movements by checking `movement.type === 'EXCEL_IMPORT'` rather than parsing the observations field for magic strings.

#### Scenario: Excel import badge displays with correct emerald styling

- **WHEN** a user opens the detail sheet for a movement with `type = 'EXCEL_IMPORT'`
- **THEN** the badge MUST display with emerald/green colors (`bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400`)
- **THEN** the badge border color MUST match the border color used in `movement-table.columns.tsx` TypeBadge for EXCEL_IMPORT

#### Scenario: Excel import type config has consistent styling

- **WHEN** `TYPE_CONFIG` in `movement-detail-sheet.tsx` is accessed with `EXCEL_IMPORT` key
- **THEN** the returned config MUST include emerald/green theme colors
- **THEN** the returned config MUST include `ArrowDownCircle` as the icon
- **THEN** the returned config MUST include `label: 'Importación desde Excel'`

### Requirement: Movements toolbar SHALL include Excel import filter tab

The `movement-table-toolbar.tsx` component MUST include an `excelImport` option in the type filter tabs, allowing users to view only movements created via Excel import.

#### Scenario: Excel import filter tab is visible

- **WHEN** a user views the movements list
- **THEN** the toolbar tabs MUST include an `excelImport` tab labeled "Excel" or similar
- **THEN** clicking the tab MUST filter movements to show only those with `type = 'EXCEL_IMPORT'`

#### Scenario: Excel import count is displayed in tab badge

- **WHEN** the movements list includes Excel import movements
- **THEN** the `excelImport` tab badge MUST display the count of Excel import movements
