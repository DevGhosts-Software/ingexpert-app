## ADDED Requirements

### Requirement: Frontend SHALL own auth session authority via Supabase

The frontend MUST execute login, session recovery/refresh, logout, and current-session evaluation directly through Supabase client flows without API auth procedure dependency.

#### Scenario: User logs in from frontend

- **WHEN** a user submits credentials in the frontend login flow
- **THEN** authentication MUST be performed through Supabase client auth APIs
- **THEN** no API `auth.login` procedure may be required for successful login

### Requirement: Frontend auth bootstrap MUST establish role context safely

After Supabase session initialization, the frontend MUST resolve application role context with deterministic precedence and explicit invalid-session handling.

#### Scenario: Session exists at app startup

- **WHEN** the app starts with an existing Supabase session
- **THEN** frontend MUST resolve user role context before granting protected app access
- **THEN** invalid or unresolvable role state MUST deny privileged access and force recovery/login

### Requirement: Frontend auth migration SHALL preserve offline continuation semantics

Frontend-owned auth authority MUST preserve approved offline continuation behavior for previously validated sessions.

#### Scenario: Offline startup after prior successful online auth

- **WHEN** the app starts offline with a previously validated non-expired session
- **THEN** frontend auth guard MUST allow local-first protected screens
- **THEN** revalidation MUST be attempted automatically when connectivity returns
