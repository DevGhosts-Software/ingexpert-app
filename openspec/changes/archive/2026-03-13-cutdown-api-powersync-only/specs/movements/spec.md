## ADDED Requirements

### Requirement: Movement migrated reads SHALL execute from local state only

Movement list, detail, and approved stats reads that have completed migration MUST execute from local PowerSync/SQLite data without runtime API fallback branches.

#### Scenario: Movement dashboard/stat card loads

- **WHEN** a migrated movement stat card is rendered
- **THEN** the value MUST be computed from local synchronized movement data
- **THEN** no runtime API fallback request may be used for that stat path

### Requirement: Movement read endpoint retirement SHALL follow migration completion

Movement API read procedures marked removal-ready MUST be deleted from active API surface once local-only behavior is verified.

#### Scenario: Movement read procedure is remove-ready

- **WHEN** retention evidence shows zero active frontend usage and parity-complete local replacement
- **THEN** maintainers MUST delete the retired movement read router/service procedure
- **THEN** the retired procedure MUST be absent from generated OpenAPI

## MODIFIED Requirements

### Requirement: Movement stats cutover SHALL validate month-boundary behavior

Movement stats migration MUST validate current month aggregate semantics across timezone and month-boundary transitions before API stats retirement.

#### Scenario: Month boundary parity run executes

- **WHEN** parity validation includes records around month boundaries
- **THEN** local `thisMonth` aggregate behavior MUST match accepted API semantics
- **THEN** API movement stats retirement MUST remain blocked until mismatches are resolved
