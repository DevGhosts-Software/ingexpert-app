## ADDED Requirements

### Requirement: Audit outputs SHALL drive executable migration state

The audit inventory MUST be consumable as an execution plan that tracks per-procedure migration phase, parity status, and rollback readiness.

#### Scenario: Migration plan is generated from latest audit

- **WHEN** a migration cycle starts
- **THEN** the latest procedure inventory MUST be transformed into an explicit per-procedure migration state
- **THEN** each entry MUST include current phase (`observe`, `dual-run`, `cutover`, `rollback`) and owner

### Requirement: Classification changes SHALL be versioned

Any change to procedure classification or migration candidacy MUST be recorded as a versioned update to prevent undocumented scope drift.

#### Scenario: Procedure classification is updated

- **WHEN** maintainers reclassify a procedure
- **THEN** the updated classification and rationale MUST be persisted with a revision marker
- **THEN** migration decisions MUST reference the latest revision
