## Context

The existing RLS migration `packages/database/supabase/migrations/04_powersync-rls.sql` defines grants/policies for `users`, `projects`, `items`, `kit_details`, `movements`, and `movement_details`, but does not include `staff` or `work_areas`. Both tables are already replicated in the `powersync` publication and are used by authenticated runtime flows, so governance is incomplete.

This change is security and data-governance focused. It must keep policy behavior explicit and reproducible through migration SQL and verification queries.

## Goals / Non-Goals

**Goals:**

- Add committed RLS grants/policies for `staff` and `work_areas`.
- Define authenticated CRUD behavior clearly for both tables.
- Extend verification queries to assert policy/grant presence and allow/deny behavior for these tables.
- Keep the migration idempotent and aligned with existing Supabase migration style.

**Non-Goals:**

- No API/tRPC endpoint changes.
- No Prisma schema/model changes.
- No change to movement ledger immutability constraints.
- No role-matrix redesign outside authenticated CRUD scope requested for `staff` and `work_areas`.

## Decisions

1. **Extend existing RLS migration rather than introducing a separate policy mechanism**
   - Decision: implement coverage by updating the Supabase migration path already responsible for direct-write governance.
   - Rationale: keeps policy ownership centralized and reduces drift between table scopes.
   - Alternative considered: create ad-hoc SQL outside migration chain. Rejected due to lower reproducibility.

2. **Use explicit table grants + RLS policies for both tables**
   - Decision: mirror established pattern (grant privileges, enable RLS, create guarded policies with `IF NOT EXISTS` checks).
   - Rationale: consistent with current migration conventions and safe re-run behavior.
   - Alternative considered: rely on broad schema grants only. Rejected because it lacks row-policy controls.

3. **Treat `staff` and `work_areas` as authenticated CRUD tables per requested scope**
   - Decision: define select/insert/update/delete coverage for authenticated users via policies.
   - Rationale: matches request intent (“authenticated users CRUD”) and prevents permission gaps.
   - Alternative considered: admin-only write policies. Rejected for this proposal because it conflicts with requested behavior.

## Risks / Trade-offs

- **[Risk] Overly broad authenticated CRUD may allow writes beyond intended business boundaries** → **Mitigation:** include explicit verification queries and document that stricter ownership/admin constraints can be layered in follow-up changes.
- **[Risk] Existing data workflows may depend on implicit permissions** → **Mitigation:** rollout with post-migration verification checks before production cutover.
- **[Trade-off] Simpler authenticated CRUD favors access continuity over tighter least-privilege controls** → **Mitigation:** isolate this as a bounded governance step and keep future hardening path open.

## Migration Plan

1. Update Supabase migration SQL under `packages/database/supabase/migrations/` to include `staff` and `work_areas` grants and RLS policy blocks.
2. Add verification queries for both tables to the migration notes section.
3. Apply migration in Supabase SQL editor/environment.
4. Execute verification checks for authorized CRUD and unauthorized access paths.
5. Rollback path: drop newly introduced `staff`/`work_areas` policies and revert grants if required.

## Open Questions

- Should authenticated CRUD on `staff`/`work_areas` be unrestricted (`true`) or constrained by role/ownership rules in this same change?
- Is a dedicated migration file preferred over extending `04_powersync-rls.sql` for production traceability?
