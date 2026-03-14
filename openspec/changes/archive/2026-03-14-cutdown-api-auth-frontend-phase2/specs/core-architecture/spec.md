## MODIFIED Requirements

### Requirement: API simplification SHALL preserve authority boundaries

Architecture changes that reduce API scope MUST preserve required authority boundaries, but in phase-2 API cutdown the retained boundary is admin-management authority while frontend-auth-authority may own end-user session flows after approved security-equivalence.

#### Scenario: Team proposes API route removal

- **WHEN** an API route or procedure is proposed for deprecation/removal
- **THEN** maintainers MUST verify admin-management authority boundaries remain intact
- **THEN** non-compliant proposals MUST be rejected until those boundaries are preserved

#### Scenario: Team finalizes auth authority migration

- **WHEN** auth/session ownership is migrated to frontend authority under approved gates
- **THEN** legacy API auth procedures MUST be retired from router and OpenAPI surfaces
- **THEN** architecture docs MUST identify frontend auth authority as the new owner
