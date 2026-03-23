## ADDED Requirements

### Requirement: Kit rows SHALL display em-dash placeholders for inventory count columns

When rendering kit items in the inventory table, the warehouse inventory, onsite inventory, and total inventory columns SHALL display the em-dash placeholder (—) to indicate that stock quantities are not applicable to kit types, consistent with other non-applicable columns.

#### Scenario: Kit row displays em-dash for warehouse inventory

- **WHEN** a kit item is rendered in the inventory table
- **THEN** the warehouse inventory column SHALL display — instead of 0 or any numeric value

#### Scenario: Kit row displays em-dash for onsite inventory

- **WHEN** a kit item is rendered in the inventory table
- **THEN** the onsite inventory column SHALL display — instead of 0 or any numeric value

#### Scenario: Kit row displays em-dash for total inventory

- **WHEN** a kit item is rendered in the inventory table
- **THEN** the total inventory column SHALL display — instead of 0 or any numeric value

#### Scenario: Kit row displays em-dash for location column

- **WHEN** a kit item is rendered in the inventory table
- **THEN** the location column SHALL display — (already implemented, must be preserved)

### Requirement: Selection checkboxes SHALL be visible only to admin users

The row selection checkboxes in the inventory table SHALL be hidden from users with the USER role to prevent bulk selection operations by non-admin users.

#### Scenario: Admin user sees selection checkboxes

- **WHEN** a user with admin role is viewing the inventory table
- **THEN** the selection checkboxes SHALL be visible in the header and each row

#### Scenario: Non-admin user does not see selection checkboxes

- **WHEN** a user with USER role is viewing the inventory table
- **THEN** the selection checkboxes SHALL NOT be rendered in the table
