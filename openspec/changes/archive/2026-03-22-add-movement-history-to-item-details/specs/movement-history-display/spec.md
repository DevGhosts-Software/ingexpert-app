## ADDED Requirements

### Requirement: Movement history display in item details

The system SHALL display movement history for non-KIT inventory items within the item details sheet, providing users visibility into stock movements without returning to the inventory table.

#### Scenario: Movement history shown in detail sheet

- **WHEN** user opens the detail sheet for a non-KIT item
- **THEN** system SHALL query and display up to 12 most recent movements
- **AND** each movement SHALL show type (translated), date, and quantity
- **AND** KIT items SHALL NOT display movement history section

#### Scenario: Movement types with visual distinction

- **WHEN** movement history is displayed
- **THEN** each movement type SHALL be color-coded for quick identification
- **AND** movement type icons SHALL provide visual context

### Requirement: Reusable movement history component

The system SHALL provide a reusable `MovementHistoryList` component that can be embedded in both the item details sheet and the row actions dropdown menu.

#### Scenario: Component renders empty state gracefully

- **WHEN** item has no movements
- **THEN** component SHALL display "Sin movimientos visibles para este ítem"
- **AND** component SHALL show loading state while fetching

#### Scenario: Component handles loading state

- **WHEN** movement data is being fetched
- **THEN** component SHALL display a loading indicator with "Cargando historial..."
