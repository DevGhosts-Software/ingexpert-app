## MODIFIED Requirements

### Requirement: Final cutover SHALL remove runtime fallback for retired mutation procedures

For the final API retirement set, frontend runtime code MUST not contain fallback branches that call retired API mutation procedures, including batch import and admin-user management procedures.

#### Scenario: Runtime path is inspected after full retirement

- **WHEN** frontend mutation handlers are reviewed for retired procedures
- **THEN** each handler MUST have a single local-write/Supabase-authorized execution path
- **THEN** no fallback branch may re-route to retired `items.createBatch`, `items.importMany`, `kits.importMany`, or `adminUsers.*` procedures

### Requirement: Final cutover SHALL retire corresponding API procedures and contract entries

Once replacement paths are active, corresponding router/service procedures MUST be deleted and contract output regenerated.

#### Scenario: Backend cleanup is finalized

- **WHEN** maintainers complete final retirement implementation
- **THEN** retired batch import and `adminUsers.*` procedures MUST be removed from API router/service wiring
- **THEN** regenerated OpenAPI MUST not expose `/admin/users*` operations
