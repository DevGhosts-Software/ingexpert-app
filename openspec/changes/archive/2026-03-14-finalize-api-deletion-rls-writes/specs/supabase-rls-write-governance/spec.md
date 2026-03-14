## ADDED Requirements

### Requirement: Direct-write tables MUST be protected by committed Supabase RLS policies

The system MUST define repository-managed SQL policies for direct-write tables used by frontend/PowerSync mutation paths, including `users`, `projects`, `items`, and `kit_details`.

#### Scenario: Policy file is prepared for rollout

- **WHEN** maintainers finalize direct-write migration
- **THEN** a SQL file under `packages/database/prisma/` MUST create/alter required RLS policies for affected tables
- **THEN** policy definitions MUST scope write access to authenticated users under explicit role/ownership constraints

### Requirement: RLS rollout MUST include verification queries

The policy SQL artifact MUST include verification queries that prove expected allow/deny behavior before production cutover.

#### Scenario: Policy validation is executed

- **WHEN** maintainers run policy verification after applying SQL
- **THEN** expected authorized writes MUST succeed for permitted rows/actions
- **THEN** expected unauthorized writes MUST fail for forbidden rows/actions
