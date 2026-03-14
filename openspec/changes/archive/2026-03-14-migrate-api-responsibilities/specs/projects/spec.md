## ADDED Requirements

### Requirement: Project read migration SHALL keep UX parity

Project list and stats reads migrated from API to local-first execution MUST maintain equivalent user-visible behavior for filtering, sorting, and totals.

#### Scenario: Project list read path is migrated

- **WHEN** project list reads use local-first data as primary source
- **THEN** list ordering, filtering, and pagination behavior MUST remain consistent with accepted API-era behavior
- **THEN** API fallback MUST be available during stabilization

### Requirement: Project stats cutover SHALL retain deterministic totals

Project stats migration MUST retain deterministic total-project semantics under local-first execution.

#### Scenario: Project stats are sourced locally

- **WHEN** local compute is enabled for project stats
- **THEN** the `total` project count MUST meet parity acceptance criteria versus API output
- **THEN** any sustained mismatch MUST trigger rollback
