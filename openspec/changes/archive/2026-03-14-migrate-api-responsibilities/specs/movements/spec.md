## ADDED Requirements

### Requirement: Movement read migration SHALL preserve role-filter security

Any movement read or stats procedure migrated to local-first execution MUST preserve role and filter semantics currently enforced by API boundaries.

#### Scenario: Non-admin movement stats are evaluated for cutover

- **WHEN** movement stats migration is assessed for non-admin users
- **THEN** local-first behavior MUST produce results equivalent to role-constrained API behavior
- **THEN** cutover MUST be blocked if role-filter parity is not proven

### Requirement: Movement stats cutover SHALL validate month-boundary behavior

Movement stats migration MUST validate current month aggregate semantics across timezone and month-boundary transitions.

#### Scenario: Month boundary parity run executes

- **WHEN** parity validation includes records around month boundaries
- **THEN** local `thisMonth` aggregate behavior MUST match accepted API semantics
- **THEN** mismatches MUST be observable and rollback-capable
