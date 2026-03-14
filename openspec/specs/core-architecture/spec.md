## ADDED Requirements

### Requirement: Final API ownership SHALL be limited to admin management and batch import

After this change, non-admin runtime mutation ownership for users/projects/items/kits MUST be frontend-local with Supabase RLS, and retained API ownership MUST be restricted to admin user management and batch import procedures.

#### Scenario: API retention matrix is finalized

- **WHEN** maintainers publish the post-cutover API surface
- **THEN** retained runtime API procedures MUST include `adminUsers.*` and batch import procedures only
- **THEN** removed non-admin mutation procedures MUST be absent from active router and OpenAPI outputs
