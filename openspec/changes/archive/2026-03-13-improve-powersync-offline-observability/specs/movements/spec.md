## ADDED Requirements

### Requirement: Movement create flow SHALL not depend on online-only lookups

The movement creation UX MUST use local PowerSync-backed dependency data for required selectors when available, so submitting movements remains functional offline after initial sync.

#### Scenario: Movement form opens with local dependencies offline

- **WHEN** the user opens movement form while offline
- **THEN** projects and user selector data already synchronized locally MUST be loaded from local PowerSync tables
- **THEN** form interaction MUST remain available without blocking on live tRPC queries

### Requirement: Offline movement posting MUST provide explicit queued-state feedback

When movement records are written locally and cloud upload is deferred, the user experience MUST clearly indicate local success and pending sync status.

#### Scenario: Local movement write succeeds offline

- **WHEN** movement header/details local SQL writes complete successfully while offline
- **THEN** the UI MUST confirm movement was saved locally
- **THEN** the UI MUST indicate upload is pending until connector synchronization succeeds
