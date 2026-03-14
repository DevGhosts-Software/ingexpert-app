## ADDED Requirements

### Requirement: Final cutover SHALL remove runtime fallback for retired mutation procedures

For the final API retirement set, frontend runtime code MUST not contain fallback branches that call removed API mutation procedures.

#### Scenario: Runtime path is inspected after cutover

- **WHEN** frontend mutation handlers are reviewed for retired procedures
- **THEN** each handler MUST have a single local-write/Supabase-authorized execution path
- **THEN** no fallback branch may re-route to removed API procedures

### Requirement: Final cutover SHALL retire corresponding API procedures and contract entries

Once replacement paths are active, corresponding router/service procedures MUST be deleted and contract output regenerated.

#### Scenario: Backend cleanup is finalized

- **WHEN** maintainers complete final retirement implementation
- **THEN** retired procedures MUST be removed from API router/service wiring
- **THEN** regenerated OpenAPI MUST not expose those operations
