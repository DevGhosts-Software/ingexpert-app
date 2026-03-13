## ADDED Requirements

### Requirement: Item writes SHALL complete from local queue commit

Item create, edit, and save interactions MUST complete immediately after local SQLite write/queue commit without waiting for remote mutation completion.

#### Scenario: Create item commits locally and returns immediate success

- **WHEN** a user submits a new item and local write succeeds
- **THEN** the UI MUST confirm success immediately from local commit
- **THEN** cloud upload MUST be marked as queued/pending and run asynchronously

#### Scenario: Edit item commits locally and updates list instantly

- **WHEN** a user saves edits to an existing item and local write succeeds
- **THEN** the updated item data MUST be visible immediately in local query-backed views
- **THEN** no blocking spinner tied to remote tRPC mutation completion may delay success state

### Requirement: Inventory write flows MUST avoid hidden online dependencies

Inventory write flows MUST not include hidden awaited tRPC reads/mutations that block post-save UX completion.

#### Scenario: Save flow executes while offline

- **WHEN** the user saves item changes while offline
- **THEN** save flow MUST finish from local operations only
- **THEN** the UI MUST communicate queued sync state instead of waiting for network recovery
