## MODIFIED Requirements

### Requirement: Admin management runtime flows SHALL execute via Supabase cloud function

Frontend runtime admin-user management operations MUST call the Supabase admin-control cloud function and MUST NOT call API `adminUsers.*` procedures after cutover. Calls MUST propagate authenticated Supabase session context in a form that allows the cloud function to resolve caller identity for authorization checks.

#### Scenario: Admin manages users from dashboard

- **WHEN** an authenticated admin performs user-management actions (create/update/remove/auth grant/auth revoke/password reset/list/get)
- **THEN** the frontend MUST invoke the admin-control cloud function with the corresponding action payload
- **THEN** no runtime request to API `adminUsers.*` procedures may execute

#### Scenario: Revoke access uses authenticated caller context

- **WHEN** an authenticated admin triggers **Revocar acceso** for a user with auth enabled
- **THEN** the request to `admin-control` MUST include callable auth context that can be resolved by the function runtime
- **THEN** the function MUST execute `revokeAuth` without returning `401` due to missing caller context

#### Scenario: Session context is missing or invalid

- **WHEN** admin-management UI invokes `admin-control` without valid caller auth context
- **THEN** the function MUST deny the request
- **THEN** the frontend MUST surface an actionable auth-related error state and MUST NOT present a false success
