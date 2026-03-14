## ADDED Requirements

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
