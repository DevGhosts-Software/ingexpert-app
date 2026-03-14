## MODIFIED Requirements

### Requirement: Final API ownership SHALL be limited to deployment/bootstrap support only

After this change, runtime mutation ownership for users/projects/items/kits/admin management/batch imports MUST not depend on NestJS API procedures, and retained API responsibility MUST be limited to non-runtime bootstrap/support concerns only. Once runtime API usage reaches zero, the repository MUST remove frontend tRPC bootstrap wiring and MUST retire the `apps/api` workspace application entirely.

#### Scenario: API retention matrix is finalized post-admin/batch migration

- **WHEN** maintainers publish the post-migration API surface
- **THEN** runtime `adminUsers.*` and batch import procedures MUST be absent from active router and OpenAPI outputs
- **THEN** frontend runtime flows for those capabilities MUST execute via local-write + PowerSync or Supabase cloud function paths

#### Scenario: Repository is finalized for full API retirement

- **WHEN** maintainers complete frontend/runtime retirement verification
- **THEN** frontend application bootstrap MUST not mount `TRPCProvider` or equivalent tRPC client provider wiring
- **THEN** frontend source MUST not import API router types from `apps/api`
- **THEN** the monorepo MUST not contain an active `apps/api` workspace application
