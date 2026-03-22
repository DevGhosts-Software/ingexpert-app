## ADDED Requirements

### Requirement: Excel import SHALL detect and handle two distinct file formats

The Excel import parser MUST detect whether an uploaded file follows the Export format or the Classic Import format based on column header presence, and route stock values accordingly.

#### Scenario: File with INVENTARIO_TOTAL column is imported (Export Format)

- **WHEN** an Excel file is submitted for import
- **AND** the normalized column headers include `INVENTARIO_TOTAL`
- **THEN** the system MUST read only the `INVENTARIO_TOTAL` column value
- **THEN** the system MUST inject 100% of the total value into warehouse inventory
- **THEN** the onsite inventory MUST be set to 0
- **THEN** a PURCHASE movement with Excel Import observation MUST be created for the warehouse stock addition

#### Scenario: File without INVENTARIO_TOTAL column is imported (Classic Import Format)

- **WHEN** an Excel file is submitted for import
- **AND** the normalized column headers do NOT include `INVENTARIO_TOTAL`
- **THEN** the system MUST read the `INVENTARIO_ALMACEN` column (with existing fallback aliases `STOCK`, `STOCK_INICIAL`)
- **THEN** the system MUST read the `INVENTARIO_OBRA` column when present
- **THEN** existing creation and update behavior MUST be preserved exactly
- **THEN** PURCHASE and EXIT movements MUST be created as before for warehouse and onsite stock respectively

#### Scenario: Item does not exist in database during import

- **WHEN** an imported row references an item code that does not exist in the database
- **THEN** the system MUST create the item with the specified warehouse stock
- **THEN** the movement type used MUST be `PURCHASE` with observation `Importación de stock desde Excel`
- **THEN** this behavior applies to BOTH Export Format and Classic Import Format

#### Scenario: Item exists in database during import

- **WHEN** an imported row references an item code that already exists in the database
- **THEN** the system MUST add the imported warehouse stock to the existing warehouse stock
- **THEN** the movement type used MUST be `PURCHASE` with observation `Importación de stock desde Excel`
- **THEN** this behavior applies to BOTH Export Format and Classic Import Format
