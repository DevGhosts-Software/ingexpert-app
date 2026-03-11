## ADDED Requirements

### Requirement: openapi.json is the source of truth for projects endpoint contracts
Before implementing any project route, data model change, or frontend hook for projects, agents SHALL read `openapi/openapi.json` for the exact endpoint shapes, request/response schemas, and authentication requirements defined for this domain.

#### Scenario: Agent adds or modifies a project endpoint
- **WHEN** an agent is tasked with any change to the projects domain
- **THEN** it SHALL read `openapi/openapi.json` first to understand the current contract before writing code

### Requirement: Projects cannot be deleted while Movements reference them
The `Project` model has an `onDelete: Restrict` constraint via its FK on `Movement.projectId`. The projects service SHALL perform a pre-check before any delete operation and throw a user-friendly error if linked movements exist. Raw DB constraint errors MUST NOT reach the client.

#### Scenario: Admin attempts to delete a project with linked movements
- **WHEN** `projects.remove` is called for a project that has associated movement records
- **THEN** the service SHALL detect the existing movements via a pre-check query and throw a `BadRequestException` with a user-friendly message — it MUST NOT allow Prisma to surface the raw FK constraint error

#### Scenario: Admin deletes a project with no linked movements
- **WHEN** `projects.remove` is called for a project with zero associated movements
- **THEN** the deletion SHALL proceed normally

### Requirement: managerId FK must reference a valid User record
Every project MUST have a `managerId` that references an existing `User` row. The user does not need to have a Supabase Auth account (`hasAuth` may be `false`), but the `User` DB record MUST exist.

#### Scenario: Agent creates a project with a valid managerId
- **WHEN** `projects.create` is called with a `managerId` that references an existing User
- **THEN** the project is created successfully regardless of the User's `hasAuth` status

#### Scenario: Agent creates a project with an invalid managerId
- **WHEN** `projects.create` is called with a `managerId` that does not correspond to any User row
- **THEN** the service SHALL throw a validation error before attempting the DB write

### Requirement: Project names are unique within the system
Project names SHALL be unique. Attempting to create or update a project with a name that already belongs to another project MUST result in a user-friendly validation error.

#### Scenario: Agent creates a project with a duplicate name
- **WHEN** `projects.create` is called with a `name` that matches an existing project's name
- **THEN** the service SHALL return a descriptive error — it MUST NOT allow Prisma to surface the raw unique constraint violation
