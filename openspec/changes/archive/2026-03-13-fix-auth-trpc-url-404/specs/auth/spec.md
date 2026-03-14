## ADDED Requirements

### Requirement: Frontend auth procedures SHALL resolve through tRPC middleware path

The frontend transport used by auth procedures (`auth.login`, `auth.refresh`, `auth.logout`) SHALL always send requests to the API tRPC middleware path (`/trpc`) so procedure invocation does not target invalid root-level paths.

#### Scenario: Base API URL is provided without /trpc

- **WHEN** `NEXT_PUBLIC_API_URL` is configured as a base origin such as `http://localhost:3001`
- **THEN** frontend tRPC transport resolves requests to `http://localhost:3001/trpc`
- **AND** auth procedure calls do not request `http://localhost:3001/auth.login`

#### Scenario: Explicit tRPC URL is provided

- **WHEN** `NEXT_PUBLIC_API_URL` already includes `/trpc`
- **THEN** frontend tRPC transport uses the configured URL without duplicating the path suffix

### Requirement: Frontend auth environment contract SHALL document valid API URL behavior

Frontend environment documentation SHALL state that `NEXT_PUBLIC_API_URL` may be defined as either API origin or full tRPC URL, and runtime resolution MUST produce a valid tRPC endpoint.

#### Scenario: Developer follows env example

- **WHEN** a developer configures frontend env using repository examples
- **THEN** resulting login requests are routed to the API tRPC endpoint and return auth responses instead of HTTP 404 due to path mismatch
