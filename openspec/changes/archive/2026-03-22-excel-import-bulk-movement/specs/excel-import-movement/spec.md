## ADDED Requirements

### Requirement: Excel imports SHALL create bulk EXCEL_IMPORT movements

The Excel import processor SHALL create exactly ONE movement with type `EXCEL_IMPORT` containing all imported item details, instead of creating individual PURCHASE movements per item.

#### Scenario: Single bulk movement for warehouse inventory items

- **WHEN** a user imports an Excel file with items that have warehouse inventory
- **THEN** the system SHALL create exactly ONE movement with type `EXCEL_IMPORT`
- **AND** the movement SHALL contain ALL imported items as movement_details
- **AND** the movement observations SHALL be "Importación de stock desde Excel"

#### Scenario: Separate EXIT movements for onsite inventory preserved

- **WHEN** an imported item has onsite (obra) inventory greater than zero
- **THEN** the system SHALL create a separate EXIT movement for that item
- **AND** the EXIT movement SHALL have destination "Importación desde Excel - Obra"
- **AND** this EXIT creation behavior SHALL remain unchanged from current implementation

### Requirement: EXCEL_IMPORT movement type SHALL be supported in UI

The movements table UI SHALL properly display and filter `EXCEL_IMPORT` type movements.

#### Scenario: TypeBadge renders distinct badge for EXCEL_IMPORT

- **WHEN** a movement with type `EXCEL_IMPORT` is displayed in the table
- **THEN** the TypeBadge SHALL render with a distinct visual style (emerald color)
- **AND** the badge SHALL show the label "Importación desde Excel"
- **AND** it SHALL NOT use the observations-text hack

#### Scenario: Toolbar filter tab for Excel imports

- **WHEN** a user views the movements page toolbar
- **THEN** there SHALL be a filter tab labeled "Importación" (or similar)
- **AND** clicking this tab SHALL filter to show only `EXCEL_IMPORT` movements

#### Scenario: Excel import filter tab shows correct counts

- **WHEN** the movements page displays type counts
- **THEN** the Excel import tab SHALL show the count of `EXCEL_IMPORT` movements
- **AND** the count SHALL update when new imports are created

### Requirement: EXCEL_IMPORT filter tab SHALL integrate with selection system

The checkbox selection system SHALL work identically for the EXCEL_IMPORT filter tab.

#### Scenario: Header checkbox selects only filtered EXCEL_IMPORT items

- **WHEN** the user has active the Excel import filter tab
- **AND** the user clicks the header checkbox
- **THEN** only `EXCEL_IMPORT` movements matching the current filter SHALL be selected
- **AND** behavior SHALL match other filter tabs (all, purchase, exit, etc.)

#### Scenario: Selection persists when switching to Excel import tab

- **WHEN** the user has selected items on one filter tab
- **AND** the user switches to the Excel import filter tab
- **THEN** previously selected items SHALL remain selected if visible on new tab
- **AND** items not matching the new filter SHALL be removed from selection

#### Scenario: Export button shows correct count for Excel import selection

- **WHEN** the user has selected EXCEL_IMPORT movements
- **THEN** the Export button counter SHALL show the correct selection count
- **AND** the exported file SHALL contain only the selected EXCEL_IMPORT movements
