## ADDED Requirements

### Requirement: Self-service user flows SHALL execute without API `users.*` procedures

Frontend runtime auth/user self-service behavior MUST not call API procedures `users.me`, `users.updateMe`, or `users.updateMyPassword` after final cutover.

#### Scenario: Dashboard bootstraps current user context

- **WHEN** an authenticated user opens the dashboard
- **THEN** user context MUST be resolved from Supabase session plus synchronized local user data
- **THEN** no runtime request to `trpc.users.me` may execute

#### Scenario: User updates own profile or password

- **WHEN** the user submits profile or password changes from self-service UI
- **THEN** the flow MUST use Supabase/local write paths governed by RLS
- **THEN** no runtime requests to `trpc.users.updateMe` or `trpc.users.updateMyPassword` may execute
