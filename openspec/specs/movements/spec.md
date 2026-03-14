## ADDED Requirements

### Requirement: Phase-2 movement cutdown SHALL retire redundant non-admin endpoints

Movement endpoints already replaced by local PowerSync-backed behavior and not required for admin authority MUST be retired in phase-2.

#### Scenario: Movement endpoint is eligible for retirement

- **WHEN** local movement behavior parity is accepted and runtime API dependency is eliminated
- **THEN** redundant non-admin movement endpoint MUST be removed from API router/service
- **THEN** OpenAPI contract MUST exclude the retired operation

### Requirement: Movement admin authority paths SHALL be preserved in phase-2

Movement procedures required for admin authority decisions or admin workflows MUST remain API-owned during phase-2.

#### Scenario: Movement endpoint retention is reviewed

- **WHEN** maintainers finalize movement endpoint retention list
- **THEN** admin-required movement authority operations MUST remain in API scope
- **THEN** non-admin retirement actions MUST not degrade admin behavior

### Requirement: Movement ledger tables SHALL be immutable under Supabase RLS

The system MUST enforce immutable behavior for `movements` and `movement_details` through RLS, allowing authorized inserts while denying row updates and deletes for application roles.

#### Scenario: Authorized movement insert is allowed

- **WHEN** an authenticated user satisfying movement write constraints inserts a new movement row and its detail rows
- **THEN** the insert operations MUST succeed under RLS

#### Scenario: Movement row update is denied

- **WHEN** an authenticated application user attempts to update an existing `movements` or `movement_details` row
- **THEN** the operation MUST be rejected by RLS policy enforcement

#### Scenario: Movement row delete is denied

- **WHEN** an authenticated application user attempts to delete an existing `movements` or `movement_details` row
- **THEN** the operation MUST be rejected by RLS policy enforcement
