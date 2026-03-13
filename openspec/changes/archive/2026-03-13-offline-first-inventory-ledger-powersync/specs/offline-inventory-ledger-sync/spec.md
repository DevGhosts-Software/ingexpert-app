## ADDED Requirements

### Requirement: Movement detail trigger SHALL reconcile item stock on all row changes

The system SHALL implement a PostgreSQL trigger function on `movement_details` that executes for `INSERT`, `UPDATE`, and `DELETE` and updates `items.stock` using the parent `movements.type` as the stock direction source.

#### Scenario: INSERT applies signed stock delta

- **WHEN** a `movement_details` row is inserted and the parent movement type is `IN`
- **THEN** the trigger MUST increment `items.stock` by `NEW.quantity` for `NEW.item_id`
- **WHEN** a `movement_details` row is inserted and the parent movement type is `OUT`
- **THEN** the trigger MUST decrement `items.stock` by `NEW.quantity` for `NEW.item_id`

#### Scenario: UPDATE reverses old effect then applies new effect

- **WHEN** a `movement_details` row is updated (quantity, item, or movement reference changes)
- **THEN** the trigger MUST first reverse the old signed effect derived from `OLD` + old parent movement type
- **THEN** the trigger MUST apply the new signed effect derived from `NEW` + new parent movement type

#### Scenario: DELETE reverts prior stock effect

- **WHEN** a `movement_details` row is deleted
- **THEN** the trigger MUST reverse the previously applied signed effect based on `OLD` + parent movement type

### Requirement: Trigger-based stock reconciliation MUST be authoritative

The system MUST treat database trigger reconciliation as the source of truth for `items.stock` and prevent non-authoritative movement-side optimistic stock values from becoming canonical in the cloud state.

#### Scenario: Cloud reconciliation overrides local provisional stock

- **WHEN** local optimistic stock updates differ from trigger-reconciled stock
- **THEN** replicated server state MUST overwrite local provisional values during sync convergence
