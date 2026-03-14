## MODIFIED Requirements

### Requirement: Supabase cloud function SHALL be the runtime authority for admin user operations

Admin user management operations previously exposed as `adminUsers.*` MUST execute through a single Supabase cloud function endpoint with action-based dispatch and admin authorization checks. The function MUST resolve caller identity through supported Supabase runtime auth sources and MUST deny requests when caller context cannot be validated.

#### Scenario: Authorized admin invokes action

- **WHEN** an authenticated admin invokes the cloud function with a supported admin action
- **THEN** the function MUST resolve caller identity from accepted auth sources (forwarded auth headers and/or bearer token validation)
- **THEN** the function MUST verify admin role against `public.users`
- **THEN** the function MUST execute the corresponding user-management behavior and return a typed success payload

#### Scenario: Missing caller context during authenticated invocation

- **WHEN** the function cannot resolve caller identity from the incoming auth context
- **THEN** the function MUST return an authentication failure response indicating caller-context resolution failure
- **THEN** no admin mutation side effects may execute

#### Scenario: Unauthorized caller invokes action

- **WHEN** a caller without admin authority invokes the cloud function
- **THEN** the function MUST deny the request and MUST NOT mutate user/auth state

#### Scenario: Unsupported action is requested

- **WHEN** the function receives an unknown action identifier
- **THEN** the function MUST return a validation error and MUST NOT execute side effects
