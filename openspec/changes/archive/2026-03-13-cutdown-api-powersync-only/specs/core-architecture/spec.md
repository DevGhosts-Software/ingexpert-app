## MODIFIED Requirements

### Requirement: API simplification SHALL preserve authority boundaries

Architecture changes that reduce API scope MUST preserve centralized ownership for authentication/session validation and authoritative write operations, while aggressively retiring non-authority read procedures that are migration-complete.

#### Scenario: Team proposes API route removal

- **WHEN** an API route or procedure is proposed for deprecation/removal
- **THEN** maintainers MUST verify it is not an auth/session boundary or authority write path
- **THEN** non-compliant proposals MUST be rejected until boundaries are preserved

#### Scenario: Team finalizes migrated read simplification

- **WHEN** a read procedure has approved local-first replacement and no remaining active frontend usage
- **THEN** maintainers MUST remove the corresponding API procedure and coupled dead code
- **THEN** runtime fallback setup for that read MUST NOT remain in active frontend code
