## ADDED Requirements

### Requirement: Batch import flows SHALL execute through local SQLite writes

Item and kit batch import runtime flows MUST execute through local SQLite write transactions and synchronize via PowerSync upload replay instead of API batch import procedures.

#### Scenario: Item batch import is submitted

- **WHEN** a user submits an item batch import
- **THEN** the frontend MUST persist the batch through local SQLite writes
- **THEN** no runtime request to `trpc.items.createBatch` or `trpc.items.importMany` may execute

#### Scenario: Kit batch import is submitted

- **WHEN** a user submits a kit/components batch import
- **THEN** the frontend MUST persist the batch through local SQLite writes compatible with existing kit and `kit_details` sync behavior
- **THEN** no runtime request to `trpc.kits.importMany` may execute

### Requirement: Stock edit flow SHALL create movements with adjustment enum types

When editing an item's stock from the inventory section, the system MUST create movements using the proper `STOCK_ADJUSTMENT_IN` or `STOCK_ADJUSTMENT_OUT` enum types.

#### Scenario: Increasing stock from inventory edit

- **WHEN** a user edits an item and increases its stock quantity
- **THEN** the system MUST create a movement with type `STOCK_ADJUSTMENT_IN`
- **THEN** the movement destination MUST be `null`
- **THEN** the movement observations MUST indicate automatic adjustment from stock edit

#### Scenario: Decreasing stock from inventory edit

- **WHEN** a user edits an item and decreases its stock quantity
- **THEN** the system MUST create a movement with type `STOCK_ADJUSTMENT_OUT`
- **THEN** the movement destination MUST be `null`
- **THEN** the movement observations MUST indicate automatic adjustment from stock edit

#### Scenario: Creating new item with initial stock

- **WHEN** a user creates a new item with initial stock quantity
- **THEN** the system MUST create a movement with type `STOCK_ADJUSTMENT_IN`
- **THEN** the movement observations MUST indicate initial stock from item creation

### Requirement: Item form submission SHALL be atomic and protected against double-submissions

The item creation and edit forms MUST prevent multiple concurrent submissions. Once a submission is initiated, all subsequent submission triggers (e.g., clicks, 'Enter' key presses) MUST be ignored until the current operation completes or fails.

#### Scenario: User attempts double-click on submit button

- **WHEN** a user clicks the submit button while another submission is in progress
- **THEN** the second click MUST be ignored
- **THEN** the submit button MUST remain in a disabled or loading state

#### Scenario: User presses Enter multiple times

- **WHEN** a user presses the 'Enter' key while a submission is already being processed
- **THEN** the additional 'Enter' key presses MUST be ignored by the form handler
- **THEN** the form MUST NOT trigger the submission logic again

## MODIFIED Requirements

### Requirement: Item creation SHALL be accessible from purchase movement form

Items MUST be creatable from both the inventory management form (admin-only) and the PURCHASE movement form (all authenticated users).

#### Scenario: Non-admin user creates item from purchase form

- **WHEN** an authenticated non-admin user creates a purchase movement
- **THEN** the user MUST be able to create new items from the movement form
- **THEN** the created item MUST be immediately usable in the current movement

#### Scenario: Initial stock is set from purchase movement

- **WHEN** a user creates an item from the purchase movement form with movement quantity 100
- **THEN** the item's initial stock MUST be 100 (as recorded by the PURCHASE movement detail)
- **THEN** NO separate STOCK_ADJUSTMENT_IN movement MUST be created for the initial stock
- **THEN** the item's warehouse inventory MUST reflect the purchase quantity after sync

#### Scenario: Item data requirements match inventory form

- **WHEN** a user creates an item from the purchase movement form
- **THEN** the item MUST have all required fields (name, code, location, unit, type)
- **THEN** the item MUST follow the same validation rules as items created from inventory management
- **THEN** the item type MUST be limited to PRODUCT, EQUIPMENT, or TOOL (KIT is NOT available)

#### Scenario: KIT items must be created via inventory management

- **WHEN** a user needs to create a KIT item
- **THEN** the user MUST use the inventory management form (admin-only)
- **THEN** the purchase movement form MUST NOT allow KIT creation
