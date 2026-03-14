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

### Requirement: Final retirement set MUST have zero frontend runtime usage evidence

The final retirement set (`users.me`, `users.updateMe`, `users.updateMyPassword`, `projects.create`, `projects.update`, `projects.remove`, `items.remove`, `kits.setComponents`, `kits.clearKit`) MUST be backed by repository evidence showing no active runtime call-sites. Final retirement evidence MUST also confirm removal of frontend tRPC bootstrap/client scaffolding that previously targeted API procedures.

#### Scenario: Retirement evidence is generated

- **WHEN** maintainers mark the final endpoint set as remove-ready
- **THEN** repository scans MUST show zero active `trpc.*` runtime usage for each listed procedure
- **THEN** all replacements MUST map to local-write/Supabase-authorized paths in the matrix artifact

#### Scenario: Frontend tRPC scaffolding is retired

- **WHEN** maintainers complete final frontend cleanup for API retirement
- **THEN** `apps/frontend/src/app/layout.tsx` MUST not mount a `TRPCProvider`
- **THEN** frontend provider/lib modules that construct tRPC clients for `NEXT_PUBLIC_API_URL` MUST be removed or no longer used in runtime
- **THEN** frontend package and env configuration MUST not require `@ingexpert/api` or `NEXT_PUBLIC_API_URL` for application startup
