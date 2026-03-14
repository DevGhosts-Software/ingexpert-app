## MODIFIED Requirements

### Requirement: Final API ownership SHALL be limited to deployment/bootstrap support only

After this change, runtime mutation ownership for users/projects/items/kits/admin management/batch imports MUST not depend on NestJS API procedures, and retained API responsibility MUST be limited to non-runtime bootstrap/support concerns only.

#### Scenario: API retention matrix is finalized post-admin/batch migration

- **WHEN** maintainers publish the post-migration API surface
- **THEN** runtime `adminUsers.*` and batch import procedures MUST be absent from active router and OpenAPI outputs
- **THEN** frontend runtime flows for those capabilities MUST execute via local-write + PowerSync or Supabase cloud function paths
