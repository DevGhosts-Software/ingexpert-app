## ADDED Requirements

### Requirement: API simplification SHALL preserve authority boundaries

Architecture changes that reduce API scope MUST preserve centralized ownership for authentication/session validation and authoritative write operations.

#### Scenario: Team proposes API route removal

- **WHEN** an API route or procedure is proposed for deprecation/removal
- **THEN** maintainers MUST verify it is not an auth/session boundary or authority write path
- **THEN** non-compliant proposals MUST be rejected until boundaries are preserved

### Requirement: Migration observability SHALL be mandatory before cutover

Local-first cutovers MUST include parity telemetry, phase state, and rollback controls as first-class architecture requirements.

#### Scenario: Candidate read procedure approaches cutover

- **WHEN** a read procedure is marked ready for cutover
- **THEN** parity telemetry and rollback controls MUST be present and validated
- **THEN** cutover MUST be blocked if observability requirements are incomplete
