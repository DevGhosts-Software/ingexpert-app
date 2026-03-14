## ADDED Requirements

### Requirement: Inventory read candidates SHALL cut over to local-first execution

Inventory read procedures classified as migration candidates MUST transition to local PowerSync/SQLite reads once parity gates pass.

#### Scenario: Inventory read candidate passes dual-run validation

- **WHEN** parity criteria are satisfied for an inventory read candidate
- **THEN** the frontend MUST use local-first data as the primary source for that read
- **THEN** API fallback MUST remain available during stabilization

### Requirement: Inventory stats migration SHALL preserve aggregate parity

Migration of inventory stats MUST preserve exact aggregate semantics currently exposed to the dashboard.

#### Scenario: Inventory stats are computed locally

- **WHEN** local computation is enabled for inventory stats
- **THEN** field-level totals (`total`, `products`, `equipment`, `tools`, `kits`) MUST match API parity criteria
- **THEN** mismatches MUST trigger rollback handling
