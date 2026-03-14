## ADDED Requirements

### Requirement: Migration rollout SHALL execute by procedure classification

The system MUST execute API simplification in phased order based on audited procedure classification so low-risk reads migrate first and security/authority boundaries remain centralized.

#### Scenario: Tiered rollout is initialized from audit matrix

- **WHEN** maintainers start a migration cycle
- **THEN** each frontend procedure MUST be assigned a rollout tier derived from its classification
- **THEN** `Identity/Auth` and `Server Authority Write` procedures MUST be marked non-migratable in this cycle

### Requirement: Procedure cutover SHALL be gated by dual-run parity

Any procedure marked as migration candidate MUST pass dual-run parity acceptance before local-only cutover.

#### Scenario: Candidate procedure enters cutover review

- **WHEN** local and API results are compared for a candidate read procedure
- **THEN** cutover MUST remain blocked until acceptance criteria are met for required fields
- **THEN** mismatch telemetry MUST remain available for audit and rollback decisions

### Requirement: Per-procedure rollback SHALL be immediately available

Each migrated procedure MUST have a rollback switch that restores API-backed behavior without requiring code redeploy.

#### Scenario: Mismatch anomaly is detected after cutover

- **WHEN** parity or security anomalies are detected for a migrated procedure
- **THEN** operators MUST be able to restore API-backed reads for that procedure immediately
- **THEN** the incident context MUST include procedure identifier and migration phase
