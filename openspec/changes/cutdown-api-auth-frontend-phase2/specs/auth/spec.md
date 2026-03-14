## MODIFIED Requirements

### Requirement: Auth authority SHALL remain API-owned during read migration

API-scope reduction initiatives MAY relocate `auth.login`, `auth.refresh`, `auth.logout`, and `users.me` authority only through an approved frontend-auth-authority migration with explicit security-equivalence evidence.

#### Scenario: Auth migration proposal is evaluated

- **WHEN** a migration plan proposes frontend ownership of auth/session procedures
- **THEN** the proposal MUST document equivalent session lifecycle, JWT/JWKS/claims handling, and RBAC outcomes
- **THEN** migration MUST remain blocked until security-equivalence criteria are approved

#### Scenario: Auth authority cutover is approved

- **WHEN** security-equivalence gates are satisfied for auth/session flows
- **THEN** auth/session authority MAY move from API procedures to frontend Supabase-based flows
- **THEN** retired API auth procedures MUST be removed from active contract surface

## ADDED Requirements

### Requirement: API cutdown phase-2 SHALL retain admin auth management in API

Even when auth/session user flows migrate to frontend authority, admin-user management capabilities MUST remain API-owned in this phase.

#### Scenario: Endpoint retirement plan includes admin user management

- **WHEN** maintainers prepare endpoint removals for auth migration
- **THEN** admin management procedures (`adminUsers.*`) MUST be excluded from this phase’s retirement scope
- **THEN** phase-2 completion MUST preserve admin management behavior unchanged
