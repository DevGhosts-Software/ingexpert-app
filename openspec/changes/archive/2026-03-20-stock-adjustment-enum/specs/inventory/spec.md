## ADDED Requirements

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
