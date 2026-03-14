## ADDED Requirements

### Requirement: Project non-admin dependencies SHALL migrate off API in phase-2

Project user-facing operations that are local-computable or already synchronized MUST migrate away from API dependency in this phase.

#### Scenario: Project workflow is audited for API dependency

- **WHEN** maintainers evaluate project procedures used by non-admin runtime flows
- **THEN** locally covered project behaviors MUST use local-first execution without API dependency
- **THEN** corresponding non-admin API procedures MUST be marked for retirement

### Requirement: Project API retention SHALL be admin-scope only in phase-2

After project non-admin migration is complete, retained project API procedures in phase-2 MUST be limited to admin-scope operations.

#### Scenario: Project endpoint set is finalized for phase-2

- **WHEN** project endpoint retirement is completed
- **THEN** project endpoints needed only by non-admin flows MUST be removed from active API contract
- **THEN** admin-only project operations MUST remain available

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
