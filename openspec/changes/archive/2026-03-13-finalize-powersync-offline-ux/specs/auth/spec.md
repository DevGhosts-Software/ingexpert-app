## ADDED Requirements

### Requirement: Auth guard SHALL tolerate offline local sessions

Frontend auth guarding MUST allow users with a previously validated local session to access local-first screens when internet connectivity is unavailable, without forcing immediate online revalidation.

#### Scenario: Offline startup with valid local session

- **WHEN** the application starts offline and a non-expired locally persisted session exists that was previously validated online
- **THEN** the auth guard MUST allow navigation to authenticated local-first screens
- **THEN** the guard MUST defer remote token/JWKS validation until connectivity is restored

#### Scenario: Offline startup with invalid or missing local session

- **WHEN** the application starts offline and no valid local session is available
- **THEN** the auth guard MUST deny authenticated access
- **THEN** the UI MUST show explicit authentication-required feedback instead of a bounce loop

### Requirement: Auth recovery SHALL revalidate once online

When connectivity returns, the client MUST revalidate the active session against normal online auth flow and handle failure explicitly.

#### Scenario: Connectivity restored after offline continuation

- **WHEN** a user is operating under offline-continued session and network connectivity returns
- **THEN** the client MUST attempt normal session/token revalidation
- **THEN** invalid sessions MUST be revoked with clear user feedback and local cleanup
