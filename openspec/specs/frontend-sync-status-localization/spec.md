## ADDED Requirements

### Requirement: Topbar MUST expose sync and connectivity status for the active user session

The frontend MUST render a persistent topbar status element that communicates current sync/connectivity state for the active session, including whether the app is connected, offline, syncing, or loading.

#### Scenario: Connected state is visible

- **WHEN** the client has active connectivity and no pending sync operation
- **THEN** the topbar status MUST display a connected-ready state

#### Scenario: Offline mode is visible

- **WHEN** the client loses connectivity or enters offline sync mode
- **THEN** the topbar status MUST display offline mode clearly

#### Scenario: Active sync/loading is visible

- **WHEN** sync/upload/download or required loading is in progress
- **THEN** the topbar status MUST display an in-progress state so users avoid risky mid-sync actions

### Requirement: Topbar MUST display last successful sync reference

The frontend MUST show a last successful sync reference in the status area so users can evaluate the freshness of visible data, and it MUST expose sync detail fields through a structured shadcn/Radix hover surface instead of relying on the browser-native `title` tooltip.

#### Scenario: Last sync exists

- **WHEN** at least one successful sync has completed
- **THEN** the topbar status MUST display the last sync timestamp/reference

#### Scenario: Last sync is not yet available

- **WHEN** no successful sync has occurred in the session
- **THEN** the topbar status MUST display a clear “no sync yet” fallback state

#### Scenario: Sync details are shown via structured hover surface

- **WHEN** a user hovers or focuses the sync status indicator in the topbar
- **THEN** the UI MUST show structured detail content (status, last successful sync reference, and pending uploads) using a shadcn/Radix-based component
- **THEN** the implementation MUST NOT rely on a multiline browser-native `title` tooltip as the primary detail surface

### Requirement: User-facing in-scope copy MUST be Spanish-first

Frontend user-visible text in scope of this change MUST be Spanish, including authentication failure messages and sync/status labels surfaced to end users.

#### Scenario: Login credentials are invalid

- **WHEN** login fails due to invalid credentials
- **THEN** the message shown to the user MUST be in Spanish (for example, “Credenciales inválidas”)

#### Scenario: English legacy copy is audited

- **WHEN** maintainers audit in-scope status/auth/user-facing text
- **THEN** remaining English user-facing strings in that scope MUST be replaced with Spanish equivalents
