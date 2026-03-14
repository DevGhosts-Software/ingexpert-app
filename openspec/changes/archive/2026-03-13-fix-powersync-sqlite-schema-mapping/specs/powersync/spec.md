## ADDED Requirements

### Requirement: Frontend PowerSync schema SHALL match synchronized table identifiers

The frontend PowerSync schema in `apps/frontend/src/lib/powersync/schema.ts` SHALL define table identifiers that match the effective synchronized dataset for local SQLite replication.

#### Scenario: Synchronized table set is expanded

- **WHEN** synchronized tables include `items`, `kit_details`, `movement_details`, `movements`, `projects`, `staff`, `users`, and `work_ares`
- **THEN** `AppSchema` includes corresponding table definitions for those identifiers
- **AND** sync ingestion does not fail due to missing table definitions

### Requirement: Frontend PowerSync schema SHALL preserve synced field naming

PowerSync table field declarations in `apps/frontend/src/lib/powersync/schema.ts` MUST use field names aligned with synchronized payload naming so values are queryable in local SQLite without name translation mismatches.

#### Scenario: Synced payload uses snake_case fields

- **WHEN** synchronized rows include snake_case keys
- **THEN** schema field definitions use matching snake_case keys
- **AND** local reads can access replicated values without undefined field lookups

### Requirement: PowerSync capability SHALL include schema/table validation step

Implementation of PowerSync schema updates MUST include verification of effective synchronized table names and adjustment for any discovered naming discrepancy before rollout.

#### Scenario: Provided table name is inconsistent with actual sync output

- **WHEN** diagnostics/logs show a different effective table identifier than initial assumptions
- **THEN** schema and sync contract are updated to the verified identifier
- **AND** final sync behavior is validated against the corrected table name
