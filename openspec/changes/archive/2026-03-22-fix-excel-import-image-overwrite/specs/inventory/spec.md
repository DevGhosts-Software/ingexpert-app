## ADDED Requirements

### Requirement: Excel import SHALL perform partial updates on existing items

The Excel import process MUST strictly perform a partial update when an item already exists in the database. It SHALL only update fields provided in the Excel file (name, code, location, unit, type) and MUST preserve any existing fields not present in the import, particularly `image_url`.

#### Scenario: Importing an item that already has an image

- **WHEN** a user imports an Excel row for an item that already exists in the database with an assigned `image_url`
- **THEN** the system MUST update the item's metadata (name, location, etc.) and stock
- **THEN** the item's existing `image_url` MUST remain unchanged in the database

#### Scenario: Importing a kit that already has an image

- **WHEN** a user imports a Kit from the Excel Kits sheet that already exists in the database with an assigned `image_url`
- **THEN** the system MUST update the kit's metadata
- **THEN** the kit's existing `image_url` MUST remain unchanged in the database
