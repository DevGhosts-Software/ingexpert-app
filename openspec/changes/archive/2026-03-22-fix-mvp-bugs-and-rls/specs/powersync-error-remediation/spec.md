## ADDED Requirements

### Requirement: PowerSync upload permission errors SHALL be handled non-blocking

When a PowerSync CRUD upload fails due to RLS/permission error (SQLSTATE 42501), the system SHALL delete the blocking entry from the local queue and continue processing remaining entries without throwing.

#### Scenario: Permission denied during item upload

- **WHEN** `uploadData()` encounters permission denied error for a CRUD entry
- **THEN** the system SHALL call `batch.deleteRecord(entry.id)` to remove the entry from queue
- **THEN** the system SHALL emit a `permission-error` event with table, record ID, and error message
- **THEN** processing SHALL continue to the next batch entry without blocking

#### Scenario: Permission denied blocks sync queue

- **WHEN** a permission-denied error is thrown instead of handled
- **THEN** all subsequent sync operations are blocked indefinitely
- **THEN** the queue entry remains pending forever
- **THEN** user receives no feedback about the failure

### Requirement: Permission errors SHALL surface as user alerts

The system SHALL expose permission-denied errors to users via an alert/notification system.

#### Scenario: User attempts operation without permission

- **WHEN** user submits an optimistic operation that fails RLS check server-side
- **THEN** user SHALL see a toast/alert with message: "Operation blocked - you don't have permission"
- **THEN** the alert SHALL identify the table and record involved
- **THEN** the alert SHALL be dismissible

### Requirement: Queue cleanup SHALL preserve other pending operations

The queue cleanup for a permission-blocked entry SHALL NOT affect other pending entries.

#### Scenario: Multiple entries with one permission error

- **WHEN** batch contains 5 entries and entry #3 fails with permission error
- **THEN** entries #1, #2, #4, #5 SHALL be processed normally
- **THEN** entry #3 SHALL be deleted from queue
- **THEN** alert SHALL be emitted for entry #3

### Requirement: Non-permission errors SHALL preserve queue entries

Errors that are NOT permission-denied SHALL cause the batch to stop processing but the queue entry SHALL NOT be deleted. The entry persists until the error is resolved.

#### Scenario: Offline during sync

- **WHEN** network becomes unavailable during `uploadData()`
- **THEN** the batch processing SHALL stop
- **THEN** all remaining queue entries SHALL persist (not be deleted)
- **THEN** the error SHALL be observable in debug diagnostics
- **AND** sync SHALL resume automatically when connection is restored

#### Scenario: Server error during sync

- **WHEN** server returns 500 error during upload
- **THEN** the batch processing SHALL stop
- **THEN** the failed queue entry SHALL persist in queue
- **AND** sync SHALL retry on next interval/connection

#### Scenario: Session expired (not revoked)

- **WHEN** Supabase token is expired but session itself is valid
- **THEN** the batch processing SHALL stop
- **THEN** the queue entry SHALL persist in queue
- **AND** sync SHALL resume after session refresh
