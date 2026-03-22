## MODIFIED Requirements

### Requirement: Direct-write tables MUST be protected by committed Supabase RLS policies

The system MUST define repository-managed SQL policies for direct-write tables used by frontend/PowerSync mutation paths, including `users`, `projects`, `items`, `kit_details`, `movements`, `movement_details`, `staff`, and `work_areas`.

#### Scenario: Policy file is prepared for rollout

- **WHEN** maintainers finalize direct-write migration
- **THEN** a SQL file under `packages/database/supabase/migrations/` MUST create/alter required RLS policies for affected tables
- **THEN** policy definitions MUST scope read/write access to authenticated users under explicit role/ownership constraints
- **THEN** `staff` and `work_areas` MUST have explicit authenticated CRUD policy coverage in the committed SQL artifact
- **THEN** movement-ledger tables MUST be configured as insert-only for application roles (no update/delete policy grants)

### Requirement: RLS rollout MUST include verification queries

The policy SQL artifact MUST include verification queries that prove expected allow/deny behavior before production cutover, including authenticated CRUD checks for `staff` and `work_areas`.

#### Scenario: Policy validation is executed

- **WHEN** maintainers run policy verification after applying SQL
- **THEN** expected authorized writes MUST succeed for permitted rows/actions
- **THEN** expected unauthorized writes MUST fail for forbidden rows/actions
- **THEN** authenticated CRUD behavior for `staff` and `work_areas` MUST be explicitly verifiable from included SQL checks
- **THEN** update/delete attempts against `movements` and `movement_details` MUST fail while allowed inserts still succeed

#### Scenario: User role can INSERT projects

- **WHEN** authenticated user with `user` role attempts INSERT on `projects`
- **THEN** RLS policy SHALL allow the operation
- **AND** UPDATE/DELETE on `projects` SHALL remain admin-only

#### Scenario: User role can INSERT items but not UPDATE/DELETE

- **WHEN** authenticated user with `user` role attempts INSERT on `items`
- **THEN** RLS policy SHALL allow the operation
- **AND** UPDATE operations SHALL be blocked for non-admin users
- **AND** DELETE operations SHALL be blocked for non-admin users
