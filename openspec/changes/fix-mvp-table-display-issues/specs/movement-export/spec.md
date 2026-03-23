## ADDED Requirements

### Requirement: Movement export button SHALL be visible only to admin users

The export button in the movements toolbar SHALL be hidden from users with the USER role, matching the visibility behavior of import/export buttons in the inventory toolbar.

#### Scenario: Admin user sees export button

- **WHEN** a user with admin role is viewing the movements list
- **THEN** the export button SHALL be visible in the toolbar

#### Scenario: Non-admin user does not see export button

- **WHEN** a user with USER role is viewing the movements list
- **THEN** the export button SHALL NOT be rendered in the toolbar

### Requirement: Selection checkboxes SHALL be visible only to admin users

The row selection checkboxes in the movements table SHALL be hidden from users with the USER role to prevent bulk selection operations by non-admin users.

#### Scenario: Admin user sees selection checkboxes

- **WHEN** a user with admin role is viewing the movements table
- **THEN** the selection checkboxes SHALL be visible in the header and each row

#### Scenario: Non-admin user does not see selection checkboxes

- **WHEN** a user with USER role is viewing the movements table
- **THEN** the selection checkboxes SHALL NOT be rendered in the table
