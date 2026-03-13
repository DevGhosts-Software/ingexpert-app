## ADDED Requirements

### Requirement: Auth-Scoped Bucket Assignment Must Be Explicit

The PowerSync sync configuration SHALL define at least one bucket with an explicit authentication parameter query so authenticated clients are deterministically assigned buckets.

#### Scenario: Authenticated client receives bucket assignment

- **WHEN** a client connects with a valid JWT and sync starts
- **THEN** PowerSync evaluates a parameter query using `request.user_id()`
- **AND** at least one bucket assignment is materialized for that client in local `ps_buckets`

### Requirement: Sync Rule Output Must Match Client Schema Contract

For each table included in the Ingexpert PowerSync baseline scope, sync-rule `SELECT` output columns SHALL match the client schema table names and expected field aliases.

#### Scenario: Replicated row can be applied to local SQLite table

- **WHEN** PowerSync replicates a row for a configured table in the baseline scope
- **THEN** the row includes a text `id` and contract-aligned field names
- **AND** the client applies the row into the corresponding local table without schema mismatch errors

### Requirement: PowerSync Provider Must Not Expose Debug Globals By Default

The frontend PowerSync provider SHALL initialize and connect the database without attaching the database instance to `window` in normal runtime behavior.

#### Scenario: Provider bootstraps without global leakage

- **WHEN** the PowerSync provider finishes initialization
- **THEN** the provider supplies the connected database through React context
- **AND** no debug-only `window` property is created for the database instance
