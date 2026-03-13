## ADDED Requirements

### Requirement: PowerSync debug panel SHALL expose actionable offline diagnostics

The frontend PowerSync debug surface MUST report operational diagnostics needed to triage offline-first behavior, including connection/sync state, local table readiness, upload queue state, and latest error signals.

#### Scenario: Debug panel shows sync, queue, and table diagnostics

- **WHEN** the debug panel is rendered
- **THEN** it MUST display at minimum `connected`, `hasSynced`, per-table local row counts for critical tables, and upload queue depth
- **THEN** it MUST display the latest connector/query error state when present

#### Scenario: Debug panel distinguishes offline from idle

- **WHEN** the client is disconnected from network or PowerSync endpoint
- **THEN** the panel MUST indicate disconnected/offline state distinctly from an idle-but-connected state

### Requirement: Connector credential flow MUST tolerate offline session reuse

PowerSync connector credential retrieval MUST use persisted Supabase session state when available and MUST fail gracefully when no valid session can be obtained.

#### Scenario: Persisted session available while offline

- **WHEN** network connectivity is unavailable but Supabase persisted session exists locally
- **THEN** `fetchCredentials` MUST continue returning credentials derived from persisted session until token expiry rules require refresh

#### Scenario: Session missing or invalid while offline

- **WHEN** no usable persisted Supabase session is available
- **THEN** connector credential retrieval MUST return a recoverable failure state without crashing the app
- **THEN** local SQLite reads MUST remain available

### Requirement: Upload queue processing MUST preserve offline-first semantics

Connector upload processing MUST preserve queue order for canonical entities and defer transmission safely while offline.

#### Scenario: Offline upload defers without data loss

- **WHEN** upload runs while network is unavailable
- **THEN** queued CRUD entries MUST remain pending and MUST NOT be marked complete
- **THEN** the failure MUST be observable in debug diagnostics

#### Scenario: Reconnect resumes pending queue

- **WHEN** connectivity and valid credentials are restored
- **THEN** pending queue entries MUST resume upload in original queue order
