## ADDED Requirements

### Requirement: Movement export SHALL include movement ID for traceability

The movement export functionality SHALL include the movement ID column in the exported Excel file to enable audit trail linkage between exported records and source data.

#### Scenario: Export movements to Excel includes ID column

- **WHEN** a user exports movements to Excel
- **THEN** the Movimientos sheet MUST include a MOVIMIENTO_ID column
- **THEN** each row MUST contain the corresponding movement's UUID identifier
