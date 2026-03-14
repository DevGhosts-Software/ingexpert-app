## ADDED Requirements

### Requirement: Project mutation flows SHALL run via local-write and sync path

Project create, update, and delete runtime actions MUST execute through local PowerSync SQL writes with Supabase synchronization, not through API project mutation procedures.

#### Scenario: User creates or updates a project

- **WHEN** a project create or update action is submitted
- **THEN** the client MUST persist the mutation through local SQL write transaction
- **THEN** no runtime requests to `trpc.projects.create` or `trpc.projects.update` may execute

#### Scenario: User deletes a project

- **WHEN** a project delete action is submitted
- **THEN** the delete path MUST enforce equivalent constraints for linked movement references under DB/RLS rules
- **THEN** no runtime request to `trpc.projects.remove` may execute
