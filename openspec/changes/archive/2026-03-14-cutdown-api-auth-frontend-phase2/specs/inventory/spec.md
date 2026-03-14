## ADDED Requirements

### Requirement: Export workflows SHALL support local-only execution when fully synchronized

Inventory export workflows MUST execute from local synchronized dataset when required export fields are fully available locally.

#### Scenario: User triggers export with synchronized local dataset

- **WHEN** export-required tables/columns are present in local PowerSync SQLite
- **THEN** export generation MUST run locally without requiring an API endpoint
- **THEN** exported content MUST preserve accepted field semantics

### Requirement: Inventory phase-2 cutdown SHALL retire redundant non-admin endpoints

Inventory endpoints not required by admin authority and fully replaced by local behavior MUST be retired in phase-2.

#### Scenario: Inventory endpoint is classified remove-ready

- **WHEN** endpoint usage evidence is zero and local replacement is verified
- **THEN** maintainers MUST remove the endpoint from API router/service and OpenAPI exposure
- **THEN** admin-required inventory authority endpoints MUST remain intact
