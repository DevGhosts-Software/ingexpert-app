## ADDED Requirements

### Requirement: API cutdown SHALL not remove auth and authority management endpoints

API simplification MUST retain centralized authority for `auth.login`, `auth.refresh`, `auth.logout`, `users.me`, and user/admin management operations.

#### Scenario: Endpoint removal list is prepared

- **WHEN** maintainers compile candidate endpoint removals
- **THEN** auth/session and user/admin authority operations MUST be excluded from removal
- **THEN** the change MUST fail review if any protected authority endpoint is included

### Requirement: Read cutdown SHALL preserve RBAC enforcement ownership

Any read-path migration and endpoint retirement MUST preserve RBAC enforcement in API-owned auth and authority flows.

#### Scenario: Read endpoint is retired after local migration

- **WHEN** a read endpoint is removed from API
- **THEN** RBAC decisions for remaining protected endpoints MUST continue to be enforced by API guards
- **THEN** no local fallback logic may bypass API-owned authorization behavior
