## ADDED Requirements

### Requirement: openapi.json is the source of truth for auth endpoint contracts

Before implementing any authentication route, JWT handling change, or user management endpoint, agents SHALL read `openapi/openapi.json` for the exact endpoint shapes, request/response schemas, and authentication requirements defined for this domain.

#### Scenario: Agent modifies an auth or user endpoint

- **WHEN** an agent is tasked with changing the login flow, user creation, or password management
- **THEN** it SHALL read `openapi/openapi.json` first to understand the current contract and MUST NOT introduce shape drift

### Requirement: JWT authentication uses RS256/JWKS validation

All authenticated tRPC procedures SHALL validate Bearer JWTs against Supabase's JWKS endpoint using RS256. No shared secret is used. `ctx.user` SHALL contain `{ id, email, role }` decoded from the JWT. `ctx.user.id` is the canonical source of `createdById` — the client MUST NOT override it.

#### Scenario: Agent adds a new authenticated procedure

- **WHEN** an agent creates a new tRPC procedure requiring authentication
- **THEN** it SHALL use `trpc.protectedProcedure` (or `trpc.adminProcedure` for admin-only), which enforces JWKS validation via `trpc.context.ts`

#### Scenario: Agent needs the authenticated user's identity

- **WHEN** a service method needs to record who performed an action
- **THEN** it SHALL use `ctx.user.id` from the tRPC context — never accept an `id` field from the client payload as the user identifier

### Requirement: tRPC procedure guards enforce access control at the transport layer

Three procedure types SHALL be used exclusively: `trpc.procedure` (public), `trpc.protectedProcedure` (valid JWT), `trpc.adminProcedure` (JWT + `role === ADMIN`). Hybrid endpoints (checking role inside a `protectedProcedure`) are prohibited.

#### Scenario: Agent creates an admin-only operation

- **WHEN** an agent adds an operation restricted to administrators (e.g., user creation, bulk import)
- **THEN** it SHALL use `trpc.adminProcedure` — it MUST NOT use `protectedProcedure` with an inline role check

### Requirement: Users module uses two-router architecture

User operations SHALL be split across two routers: `UsersRouter` (`protectedProcedure` — self-service: `me`, `updateMe`, `updateMyPassword`, `listNames`) and `AdminUsersRouter` (`adminProcedure` — full user CRUD). No `protectedProcedure` SHALL be added to `AdminUsersRouter`.

#### Scenario: Agent adds a self-service user operation

- **WHEN** an agent adds an operation any authenticated user can perform on their own account
- **THEN** it SHALL add it to `UsersRouter` using `protectedProcedure`

#### Scenario: Agent adds an admin user management operation

- **WHEN** an agent adds an operation only admins can perform (create user, list all users, reset another user's password)
- **THEN** it SHALL add it to `AdminUsersRouter` using `adminProcedure`

### Requirement: hasAuth flag tracks Supabase Auth account presence

The `hasAuth: Boolean` field on `User` SHALL accurately reflect whether a Supabase Auth account exists for that user. The four lifecycle operations (`create`, `createWithoutAuth`, `grantAuth`, `revokeAuth`) are the only valid state transitions.

#### Scenario: Agent creates a user with login capability

- **WHEN** an agent calls `create`, a DB record AND a Supabase Auth account are created — `hasAuth` is set to `true`
- **THEN** the user can log in immediately

#### Scenario: Agent removes login access without deleting the user

- **WHEN** an agent calls `revokeAuth`, `supabaseAdmin.auth.admin.deleteUser(id)` is called and `hasAuth` is set to `false`
- **THEN** the DB record is preserved and the user is still visible in reports but cannot log in

#### Scenario: Agent deletes a user record

- **WHEN** an agent calls `remove`
- **THEN** it SHALL call `supabaseAdmin.auth.admin.deleteUser(id)` only if `hasAuth === true` before deleting the DB record

### Requirement: Permission matrix restricts user management operations

User management operations SHALL enforce the permission matrix: admins cannot edit or delete other admins; users cannot delete themselves; password reset is restricted to self and non-admin users.

#### Scenario: Admin attempts to edit another admin

- **WHEN** an admin calls `update` or `updatePassword` targeting another admin user
- **THEN** the service SHALL throw a forbidden error

#### Scenario: User attempts to delete themselves

- **WHEN** any user calls `remove` with their own ID
- **THEN** the service SHALL throw a forbidden error
