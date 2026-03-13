## Context

The current PowerSync connector uploads local CRUD directly via Supabase client calls (`supabase.from('movements').insert(...)`). In environments where schema/table privileges or RLS policy grants are incomplete, writes fail with `permission denied for schema public`. This is an environment contract gap, not an API contract gap.

## Goals / Non-Goals

**Goals:**

- Define the minimum privileges/policies required for PowerSync upload tables.
- Provide an idempotent SQL remediation script operators can execute safely.
- Define verification checks so failures are caught during setup, not runtime.
- Improve connector diagnostics to point directly to grant/policy remediation.

**Non-Goals:**

- Introducing new API routes or replacing current upload contract families.
- Redesigning auth architecture or changing JWT issuance.
- Broad privilege grants beyond required upload tables.

## Decisions

1. **Add a canonical SQL remediation script in repo.**
   - File under `packages/database/prisma/` (single source of truth for DB bootstrap/ops SQL).
   - Includes schema usage grant, table privileges, sequence privileges (if required), and RLS policy creation/update checks.
   - Idempotent statements (`GRANT`, conditional policy creation) to support repeated application.

2. **Limit privileges to required tables.**
   - Scope to `movements`, `movement_details`, and existing connector-uploaded tables as needed (`items`, `projects` updates).
   - Avoid blanket broad grants on all `public` tables.

3. **Add explicit operator verification commands.**
   - Include privilege/policy inspection SQL and a smoke test path to confirm writes succeed for authenticated role.

4. **Improve connector error messaging only for permission category.**
   - Keep original server/database error visibility but append remediation hint when matching permission-denied signatures.

## Risks / Trade-offs

- **[Risk]** Over-granting privileges weakens security posture → **Mitigation:** least-privilege grants, table-specific scope, documented rationale.
- **[Risk]** RLS policy mismatch still blocks writes despite grants → **Mitigation:** include policy checks/creation in the same script and verification SQL.
- **[Risk]** Environment drift across Supabase projects → **Mitigation:** commit script + documented apply workflow in setup docs.

## Migration Plan

1. Add SQL remediation script to repository.
2. Update setup docs with execution and verification steps.
3. Apply script in target Supabase environment(s).
4. Validate PowerSync upload for `movements` and `movement_details` from a test client.
5. Rollback (if needed) by revoking newly granted privileges and removing added policies in controlled SQL rollback section.

## Open Questions

- Should movement/project/item upload continue to use direct Supabase table writes long-term, or should this migrate to API-mediated writes for stricter server-side control?
