## ADDED Requirements

### Requirement: Supabase cloud function SHALL be the runtime authority for admin user operations

Admin user management operations previously exposed as `adminUsers.*` MUST execute through a single Supabase cloud function endpoint with action-based dispatch and admin authorization checks.

#### Scenario: Authorized admin invokes action

- **WHEN** an authenticated admin invokes the cloud function with a supported admin action
- **THEN** the function MUST execute the corresponding user-management behavior and return a typed success payload

#### Scenario: Unauthorized caller invokes action

- **WHEN** a caller without admin authority invokes the cloud function
- **THEN** the function MUST deny the request and MUST NOT mutate user/auth state

#### Scenario: Unsupported action is requested

- **WHEN** the function receives an unknown action identifier
- **THEN** the function MUST return a validation error and MUST NOT execute side effects
