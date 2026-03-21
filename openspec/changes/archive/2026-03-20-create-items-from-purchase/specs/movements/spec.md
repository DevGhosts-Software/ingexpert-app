## MODIFIED Requirements

### Requirement: Movement creation flow SHALL support inline item creation for PURCHASE type

The movement creation form MUST allow creating new items directly when the movement type is PURCHASE, streamlining the workflow for entering new materials.

####Scenario: User creates new item during PURCHASE movement

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
