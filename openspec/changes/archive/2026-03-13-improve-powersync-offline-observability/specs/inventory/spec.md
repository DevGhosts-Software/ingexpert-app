## ADDED Requirements

### Requirement: Inventory SQL projection mapping MUST minimize unnecessary aliasing

Local PowerSync SQL queries MUST avoid aliasing database columns unless aliasing is required to satisfy a consuming contract.

#### Scenario: Query row types keep native DB names

- **WHEN** a query result is consumed internally by local transformation logic
- **THEN** columns such as `image_url` MUST be selected using native DB names without alias-only convenience mappings

#### Scenario: Contract boundary maps only required fields

- **WHEN** local row data is converted into frontend entity shapes that require camelCase fields
- **THEN** mapping to fields such as `imageUrl` MUST occur at a single boundary transform step
- **THEN** duplicate SQL and post-query remapping for the same field MUST be avoided
