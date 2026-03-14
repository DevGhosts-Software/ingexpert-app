## ADDED Requirements

### Requirement: Movement creation SHALL execute locally first

The frontend movement creation flow MUST persist data via local PowerSync SQL execution before cloud upload.

#### Scenario: Save movement writes local movement header and details

- **WHEN** a user saves a movement
- **THEN** the client MUST execute `INSERT` into `movements`
- **THEN** the client MUST execute `INSERT` into `movement_details`
- **THEN** the operation MUST complete without waiting for immediate server mutation response

### Requirement: Movement save MUST perform optimistic local stock update

After local movement detail insertion, the client MUST execute an optimistic local stock update on `items.stock` using movement direction and quantity.

#### Scenario: OUT movement updates local stock instantly

- **WHEN** a saved movement type is stock-out with quantity `q` for item `i`
- **THEN** the client MUST execute local SQL equivalent to `UPDATE items SET stock = stock - q WHERE id = i`
- **THEN** the updated stock MUST be visible in the UI immediately

#### Scenario: IN movement updates local stock instantly

- **WHEN** a saved movement type is stock-in with quantity `q` for item `i`
- **THEN** the client MUST execute local SQL equivalent to `UPDATE items SET stock = stock + q WHERE id = i`
- **THEN** the updated stock MUST be visible in the UI immediately
