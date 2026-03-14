## ADDED Requirements

### Requirement: Phase-2 migration SHALL include auth authority cutover gates

API responsibility migration MUST define explicit cutover gates for moving auth/session ownership from API to frontend authority.

#### Scenario: Auth procedure enters migration review

- **WHEN** an auth/session procedure is considered for retirement
- **THEN** migration MUST require approved security-equivalence evidence before cutover
- **THEN** rollback and incident handling playbook MUST be documented before retirement

### Requirement: Non-admin endpoint retirement SHALL follow dependency elimination

Remaining non-admin endpoints MUST be retired only after frontend local/Supabase paths are active and API dependency is eliminated.

#### Scenario: Non-admin endpoint is retired

- **WHEN** frontend local/Supabase replacement is enabled and verified
- **THEN** corresponding non-admin API endpoint MUST be removed from router/service and OpenAPI
- **THEN** retained admin endpoint behavior MUST remain unchanged
