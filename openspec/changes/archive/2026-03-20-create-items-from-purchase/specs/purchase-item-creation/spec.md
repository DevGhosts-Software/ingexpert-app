## ADDED Requirements

### Requirement: Users SHALL be able to create items from the PURCHASE movement form

The system MUST allow authenticated users to create new items directly from the PURCHASE movement form when the item does not exist in the inventory.

#### Scenario: User creates a new item during purchase movement creation

- **WHEN** a user is creating a PURCHASE movement and selects "Create New Item"
- **THEN** the system MUST display an item creation form within the movement flow
- **THEN** the form MUST allow entering all required item fields (type, name, code, location, unit)
- **THEN** the form MUST NOT include a stock quantity field (stock is derived from movement quantity)

#### Scenario: KIT type is NOT available for creation from purchase form

- **WHEN** a user opens the item creation form from a PURCHASE movement
- **THEN** the type selector MUST only show PRODUCT, EQUIPMENT, and TOOL options
- **THEN** KIT type MUST NOT be available for selection
- **THEN** a hint MUST explain that KIT items must be created via inventory management

### Requirement: Created items MUST have stock recorded via purchase movement detail

When an item is created from a purchase movement, its initial stock MUST come from the movement detail quantity, not from a separate stock adjustment.

#### Scenario: Item stock is set from movement quantity

- **WHEN** a user creates a new item with quantity 50 from a PURCHASE movement
- **THEN** the item MUST be created in the database
- **THEN** a movement detail MUST be created linking the item to the movement with quantity 50
- **THEN** NO separate STOCK_ADJUSTMENT_IN movement MUST be created

#### Scenario: Item creation and movement detail are atomic

- **WHEN** a user creates a new item from a purchase movement
- **THEN** the item insert and movement detail insert MUST occur in a single transaction
- **THEN** if either operation fails, both MUST be rolled back

### Requirement: Item creation from purchase MUST follow existing validation rules

Items created from the purchase movement form MUST satisfy the same validation rules as items created from the inventory management form.

#### Scenario: Required fields are validated

- **WHEN** a user submits a new item from the purchase form
- **THEN** the system MUST validate name is present
- **THEN** the system MUST validate code is present
- **THEN** the system MUST validate location is present (for non-KIT types)
- **THEN** the system MUST validate unit is present (for non-KIT types)
- **THEN** the system MUST validate type is a valid ItemType enum value

#### Scenario: Duplicate code validation

- **WHEN** a user attempts to create an item with a code that already exists
- **THEN** the system MUST reject the creation with an appropriate error message

### Requirement: Item creation UI MUST be available only for PURCHASE movement type

The "Create New Item" option MUST only be available when the movement type is PURCHASE.

#### Scenario: Create New Item is shown for PURCHASE type

- **WHEN** a user selects PURCHASE as the movement type
- **THEN** the UI MUST display a "Create New Item" option alongside the item search

#### Scenario: Create New Item is hidden for non-PURCHASE types

- **WHEN** a user selects EXIT, RETURN, or WRITEOFF as the movement type
- **THEN** the UI MUST NOT display the "Create New Item" option
- **THEN** the user MUST only be able to select from existing items
