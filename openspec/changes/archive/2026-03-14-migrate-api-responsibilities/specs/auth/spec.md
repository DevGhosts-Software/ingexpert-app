## ADDED Requirements

### Requirement: Auth procedures SHALL remain API-owned during read migration

The migration program MUST keep auth/session procedures (`auth.login`, `auth.refresh`, `auth.logout`, `users.me`) API-owned unless a separate approved security-equivalence change is completed.

#### Scenario: Migration plan includes auth procedure candidate

- **WHEN** a migration plan attempts to include an auth/session procedure
- **THEN** the procedure MUST be marked blocked for this migration scope
- **THEN** maintainers MUST reference the security-equivalence gate process before any relocation

### Requirement: Read migration SHALL not weaken RBAC checks

Any local-first cutover in adjacent domains MUST preserve existing RBAC-protected behavior and continue relying on API authority for protected write/auth decisions.

#### Scenario: Local-first read cutover reaches production

- **WHEN** migrated read paths are active in production
- **THEN** role-based access behavior MUST remain unchanged from approved auth policy
- **THEN** any RBAC regression MUST trigger immediate rollback
