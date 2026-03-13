## ADDED Requirements

### Requirement: PowerSync upload tables MUST have explicit Supabase privilege and policy setup

The system MUST define and apply explicit database grants and RLS policy compatibility for roles used by PowerSync upload requests so writes do not fail with schema/table permission errors.

#### Scenario: Authenticated upload role can write required movement rows

- **WHEN** PowerSync uploads an insert to `movements` or `movement_details`
- **THEN** the executing role MUST have required `USAGE` on schema `public` and table-level write privileges needed for the operation
- **THEN** RLS policies for the same role MUST allow the insert operation

#### Scenario: Missing grants or policy is detected during setup verification

- **WHEN** operator runs the verification SQL for PowerSync upload readiness
- **THEN** missing grants/policies MUST be detectable before runtime writes are attempted

### Requirement: Repository MUST provide canonical SQL remediation for PowerSync permission errors

The repository MUST include an idempotent SQL script for applying required grants/policies for PowerSync upload tables and for guiding operator verification.

#### Scenario: Operator applies remediation script safely multiple times

- **WHEN** the remediation SQL script is executed more than once
- **THEN** it MUST remain safe and converge to the same permissions state without destructive side effects

#### Scenario: Permission denied runtime error has actionable remediation path

- **WHEN** connector upload receives a database permission-denied error (for example on schema `public`)
- **THEN** diagnostics MUST clearly indicate DB privilege/policy remediation is required
- **THEN** operator MUST be able to resolve the issue by applying the canonical SQL script and re-running verification
