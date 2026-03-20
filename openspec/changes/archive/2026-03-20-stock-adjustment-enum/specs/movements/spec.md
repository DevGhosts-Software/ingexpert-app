## ADDED Requirements

### Requirement: Movement type enum SHALL include stock adjustment types

The `MovementType` enum MUST include `STOCK_ADJUSTMENT_IN` and `STOCK_ADJUSTMENT_OUT` as valid movement types for inventory stock corrections.

#### Scenario: Creating stock adjustment movement from inventory edit

- **WHEN** a user modifies an item's stock quantity from the inventory section
- **THEN** the system MUST create a movement with type `STOCK_ADJUSTMENT_IN` (for positive adjustments) or `STOCK_ADJUSTMENT_OUT` (for negative adjustments)
- **THEN** the movement MUST NOT use the string `__stock_adjustment__` as a destination value
- **THEN** the destination field MUST be `null` for stock adjustment movements

#### Scenario: PowerSync uploads stock adjustment movement

- **WHEN** a PowerSync client uploads a movement with legacy type `ajuste_positivo` or `ajuste_negativo`
- **THEN** the connector MUST normalize the type to `STOCK_ADJUSTMENT_IN` or `STOCK_ADJUSTMENT_OUT` respectively
- **THEN** no magic string destination handling MUST occur

### Requirement: Stock adjustment movements SHALL be visible in movements list

Stock adjustment movements MUST appear in the movements list view alongside other movement types.

#### Scenario: Movements list displays all movement types

- **WHEN** a user views the movements list
- **THEN** movements with type `STOCK_ADJUSTMENT_IN` or `STOCK_ADJUSTMENT_OUT` MUST be included in the results
- **THEN** the query MUST NOT filter out stock adjustment movements based on destination value

#### Scenario: Movement type badge displays adjustment labels

- **WHEN** a movement with type `STOCK_ADJUSTMENT_IN` is displayed
- **THEN** the type badge MUST show "Ajuste de stock (entrada)" or equivalent localized label

- **WHEN** a movement with type `STOCK_ADJUSTMENT_OUT` is displayed
- **THEN** the type badge MUST show "Ajuste de stock (salida)" or equivalent localized label

### Requirement: Stock adjustment types SHALL NOT be creatable from movements CRUD

The movement creation and update endpoints MUST NOT accept `STOCK_ADJUSTMENT_IN` or `STOCK_ADJUSTMENT_OUT` as valid input types.

#### Scenario: User attempts to create stock adjustment movement

- **WHEN** a user submits a movement creation request with type `STOCK_ADJUSTMENT_IN` or `STOCK_ADJUSTMENT_OUT`
- **THEN** the API MUST reject the request with a validation error
- **THEN** only the inventory edit flow may create stock adjustment movements
