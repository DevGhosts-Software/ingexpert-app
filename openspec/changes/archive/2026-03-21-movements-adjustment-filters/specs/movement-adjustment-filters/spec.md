## ADDED Requirements

### Requirement: Movements toolbar SHALL display stock adjustment filter tabs

The movements toolbar SHALL include filter tabs for viewing positive and negative stock adjustment movements alongside existing type filters.

#### Scenario: Toolbar displays adjustment tabs

- **WHEN** a user views the movements page
- **THEN** the toolbar SHALL display tabs for 'Todos', 'Compras', 'Devoluciones', 'Salidas', 'Bajas', 'Ajuste Positivo', and 'Ajuste Negativo'

#### Scenario: Adjustment tabs show correct counts

- **WHEN** movements exist with type STOCK_ADJUSTMENT_IN
- **THEN** the 'Ajuste Positivo' tab badge SHALL display the count of STOCK_ADJUSTMENT_IN movements

- **WHEN** movements exist with type STOCK_ADJUSTMENT_OUT
- **THEN** the 'Ajuste Negativo' tab badge SHALL display the count of STOCK_ADJUSTMENT_OUT movements

### Requirement: Clicking adjustment tab SHALL filter movements by type

Clicking the 'Ajuste Positivo' tab SHALL display only movements with type STOCK_ADJUSTMENT_IN. Clicking the 'Ajuste Negativo' tab SHALL display only movements with type STOCK_ADJUSTMENT_OUT.

#### Scenario: Filter by positive adjustment

- **WHEN** a user clicks the 'Ajuste Positivo' tab
- **THEN** only movements with type STOCK_ADJUSTMENT_IN SHALL be displayed in the table
- **THEN** the tab badge SHALL reflect the filtered count

#### Scenario: Filter by negative adjustment

- **WHEN** a user clicks the 'Ajuste Negativo' tab
- **THEN** only movements with type STOCK_ADJUSTMENT_OUT SHALL be displayed in the table
- **THEN** the tab badge SHALL reflect the filtered count

#### Scenario: Return to all movements

- **WHEN** a user clicks the 'Todos' tab after viewing adjustments
- **THEN** all movement types SHALL be displayed including STOCK_ADJUSTMENT_IN and STOCK_ADJUSTMENT_OUT

### Requirement: Selection system SHALL work correctly with adjustment filters

The checkbox selection system SHALL maintain proper state and function correctly when viewing adjustment-filtered movement lists.

#### Scenario: Select movements in adjustment tab scope

- **WHEN** a user clicks 'Ajuste Positivo' tab and selects individual movement rows
- **THEN** the selected count SHALL update correctly in the export button
- **THEN** the header checkbox SHALL reflect the correct tri-state (checked, indeterminate, or unchecked) for the current scope

#### Scenario: Selection persists when switching between tabs

- **WHEN** a user selects movements in 'Ajuste Positivo' tab
- **AND** switches to 'Ajuste Negativo' tab
- **AND** switches back to 'Ajuste Positivo' tab
- **THEN** the previous selections SHALL be preserved

#### Scenario: Global selection prompt appears with adjustment filters

- **WHEN** a user has selected movements while viewing an adjustment tab
- **THEN** the global selection prompt SHALL appear asking "¿Seleccionar todos los elementos existentes?"

#### Scenario: Export reflects correct selection count

- **WHEN** a user has selected N movements in the current filtered view
- **THEN** the export button SHALL display "Exportar (N)" where N is the selected count
