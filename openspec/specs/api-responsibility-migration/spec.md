## ADDED Requirements

### Requirement: Migration rollout SHALL execute by procedure classification

The system MUST execute API simplification in phased order based on audited procedure classification so low-risk reads migrate first and security/authority boundaries remain centralized.

#### Scenario: Tiered rollout is initialized from audit matrix

- **WHEN** maintainers start a migration cycle
- **THEN** each frontend procedure MUST be assigned a rollout tier derived from its classification
- **THEN** `Server Authority Write` procedures MUST be marked non-migratable in this cycle unless explicitly approved
- **THEN** `Identity/Auth` procedures MAY migrate only with approved security-equivalence evidence

### Requirement: Procedure cutover SHALL be gated by dual-run parity

Any procedure marked as migration candidate MUST pass dual-run parity acceptance before local-only cutover.

#### Scenario: Candidate procedure enters cutover review

- **WHEN** local and API results are compared for a candidate read procedure
- **THEN** cutover MUST remain blocked until acceptance criteria are met for required fields
- **THEN** mismatch telemetry MUST remain available for audit and rollback decisions

### Requirement: Finalized cutover SHALL remove runtime read fallbacks

After a read procedure is accepted as migrated, the frontend MUST remove runtime API fallback branches for that procedure and operate local-first only.

#### Scenario: Read cutover is finalized

- **WHEN** parity acceptance is complete for a migrated read procedure
- **THEN** runtime flags/branches that switch that read back to API MUST be removed from active frontend code
- **THEN** the local PowerSync/SQLite path MUST be the only supported runtime path for that read

### Requirement: Cutdown completion SHALL retire migrated API read procedures

When a procedure is finalized as local-first and no longer consumed, the corresponding API read procedure MUST be removed from router/service layers.

#### Scenario: Procedure is approved for retirement

- **WHEN** a procedure is marked remove-ready by the retention matrix
- **THEN** maintainers MUST delete the router procedure and tightly-coupled service logic
- **THEN** OpenAPI output MUST no longer expose the retired operation
