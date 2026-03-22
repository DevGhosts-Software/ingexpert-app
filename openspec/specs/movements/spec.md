## ADDED Requirements

### Requirement: Phase-2 movement cutdown SHALL retire redundant non-admin endpoints

Movement endpoints already replaced by local PowerSync-backed behavior and not required for admin authority MUST be retired in phase-2.

#### Scenario: Movement endpoint is eligible for retirement

- **WHEN** local movement behavior parity is accepted and runtime API dependency is eliminated
- **THEN** redundant non-admin movement endpoint MUST be removed from API router/service
- **THEN** OpenAPI contract MUST exclude the retired operation

### Requirement: Movement admin authority paths SHALL be preserved in phase-2

Movement procedures required for admin authority decisions or admin workflows MUST remain API-owned during phase-2.

#### Scenario: Movement endpoint retention is reviewed

- **WHEN** maintainers finalize movement endpoint retention list
- **THEN** admin-required movement authority operations MUST remain in API scope
- **THEN** non-admin retirement actions MUST not degrade admin behavior

### Requirement: Movement ledger tables SHALL be immutable under Supabase RLS

The system MUST enforce immutable behavior for `movements` and `movement_details` through RLS, allowing authorized inserts while denying row updates and deletes for application roles.

#### Scenario: Authorized movement insert is allowed

- **WHEN** an authenticated user satisfying movement write constraints inserts a new movement row and its detail rows
- **THEN** the insert operations MUST succeed under RLS

#### Scenario: Movement row update is denied

- **WHEN** an authenticated application user attempts to update an existing `movements` or `movement_details` row
- **THEN** the operation MUST be rejected by RLS policy enforcement

#### Scenario: Movement row delete is denied

- **WHEN** an authenticated application user attempts to delete an existing `movements` or `movement_details` row
- **THEN** the operation MUST be rejected by RLS policy enforcement

### Requirement: Movement type enum SHALL include stock adjustment types

The `MovementType` enum MUST include `STOCK_ADJUSTMENT_IN` and `STOCK_ADJUSTMENT_OUT` as valid movement types for inventory stock corrections.

### Requirement: Movement type enum SHALL include Excel import type

The `MovementType` enum MUST include `EXCEL_IMPORT` as a valid movement type for movements created via Excel stock import.

#### Scenario: Excel import movements are detected by type enum

- **WHEN** a movement is created via Excel stock import
- **THEN** the movement type MUST be set to `EXCEL_IMPORT`
- **THEN** the movement detail sheet MUST detect Excel imports by checking `movement.type === 'EXCEL_IMPORT'`
- **THEN** the movement toolbar filter tabs MUST include an `excelImport` option to filter by this type

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

## MODIFIED Requirements

### Requirement: Movement creation flow SHALL support inline item creation for PURCHASE type

The movement creation form MUST allow creating new items directly when the movement type is PURCHASE, streamlining the workflow for entering new materials.

#### Scenario: User creates new item during PURCHASE movement

- **WHEN** a user is creating a PURCHASE movement and needs to add an item not in inventory
- **THEN** the movement form MUST provide an option to create a new item
- **THEN** the item creation form MUST appear within the movement creation flow (modal or inline)
- **THEN** after item creation, the new item MUST be automatically added to the movement details

#### Scenario: Created item appears in movement details

- **WHEN** a user creates a new item from the PURCHASE movement form with quantity 25
- **THEN** the movement details MUST include the newly created item with quantity 25
- **THEN** the user MUST be able to modify the quantity before confirming the movement

#### Scenario: Existing items remain searchable during PURCHASE movement

- **WHEN** a user is creating a PURCHASE movement
- **THEN** the existing item search functionality MUST remain available
- **THEN** users MUST be able to add both newly created items and existing items in the same movement
