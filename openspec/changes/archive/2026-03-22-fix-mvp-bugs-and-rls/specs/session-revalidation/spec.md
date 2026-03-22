## ADDED Requirements

### Requirement: Session revocation SHALL trigger revalidation and logout

When a PowerSync upload fails with permission denied error indicating session revocation, the system SHALL revalidate the Supabase session and force logout if session is invalid.

#### Scenario: User access revoked while logged in

- **WHEN** admin revokes user's access
- **AND** user attempts PowerSync operation
- **THEN** `fetchCredentials()` SHALL call `supabase.auth.getSession()` to revalidate
- **THEN** if session is null or invalid, user SHALL be logged out
- **THEN** user SHALL be redirected to login page

#### Scenario: Offline session becomes invalid after reconnect

- **WHEN** user was offline and returns online
- **AND** session was revoked during offline period
- **THEN** on next sync attempt, session SHALL be revalidated
- **THEN** invalid session SHALL trigger logout flow
- **THEN** user SHALL be redirected to login page

### Requirement: Offline auto-login SHALL be preserved

The session revalidation on permission errors SHALL NOT break the offline auto-login feature for valid sessions.

#### Scenario: Valid session with network interruption

- **WHEN** user has valid session but network is temporarily unavailable
- **THEN** `fetchCredentials()` SHALL return cached credentials from persisted session
- **THEN** offline reads and writes SHALL continue working
- **THEN** sync SHALL resume when network is restored
