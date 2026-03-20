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
- **THEN** the item type MUST be limited to PRODUCT, TOOL, or MATERIAL (KIT is NOT available)

#### Scenario: KIT items must be created via inventory management

- **WHEN** a user needs to create a KIT item
- **THEN** the user MUST use the inventory management form (admin-only)
- **THEN** the purchase movement form MUST NOT allow KIT creation
