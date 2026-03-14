## ADDED Requirements

### Requirement: Admin management runtime flows SHALL execute via Supabase cloud function

Frontend runtime admin-user management operations MUST call the Supabase admin-control cloud function and MUST NOT call API `adminUsers.*` procedures after cutover.

#### Scenario: Admin manages users from dashboard

- **WHEN** an admin performs user-management actions (create/update/remove/auth grant/auth revoke/password reset/list/get)
- **THEN** the frontend MUST invoke the admin-control cloud function with the corresponding action payload
- **THEN** no runtime request to API `adminUsers.*` procedures may execute
