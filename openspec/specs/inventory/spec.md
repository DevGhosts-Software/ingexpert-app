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
