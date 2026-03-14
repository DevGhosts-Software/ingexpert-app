## Context

PowerSync now serves local-first reads and local queued writes for key inventory and movement flows, but frontend still contains many direct tRPC procedure calls. Current production uncertainty is not about whether PowerSync works, but about backend scope: which calls remain mandatory for security/authority and which can be replaced by local computation or serverless functions.

Current frontend procedure footprint (from `apps/frontend/src/**`):

- Auth/session: `auth.login`, `auth.refresh`, `auth.logout`, `users.me`
- Dashboard stats: `items.getStats`, `movements.getStats`, `projects.getStats`, `adminUsers.getStats`
- Admin reads: `adminUsers.list`, `adminUsers.getWorkAreas`, `users.listNames`, `kits.getComponents`
- Writes: `items.remove`, `items.importMany`, `kits.importMany`, `kits.setComponents`, `kits.clearKit`, `projects.create`, `projects.update`, `projects.remove`, `users.updateMe`, `users.updateMyPassword`, `adminUsers.create`, `adminUsers.createWithoutAuth`, `adminUsers.update`, `adminUsers.updatePassword`, `adminUsers.grantAuth`, `adminUsers.revokeAuth`, `adminUsers.remove`

OpenAPI cross-check confirms auth and stats endpoints are currently server-backed (`/auth/login`, `/auth/refresh`, `/auth/logout`, `/users/me`, `/items/stats`, `/movements/stats`, `/projects/stats`, `/admin/users/stats`).

## Goals / Non-Goals

**Goals:**

- Create a complete, repeatable audit of frontend tRPC usage with ownership classification.
- Define clear criteria to decide which backend responsibilities must remain centralized.
- Identify which read/stats calls can move to local SQLite computation without behavior regressions.
- Define a low-risk migration path for evaluating Supabase Edge Functions/serverless replacements.

**Non-Goals:**

- Immediate replacement of all API routes.
- Relaxing authorization, RBAC, or auditability guarantees.
- Changing Prisma schema or rewriting domain business rules in this change.

## Decisions

1. **Call-site inventory is the source artifact**
   - Build and maintain a versioned matrix by procedure and file location, not just by domain summary.
   - Rationale: migration risk lives in call sites and behavior, not endpoint names alone.
   - Alternative considered: high-level domain checklist. Rejected because it misses hidden dependencies and utility-triggered calls.

2. **Classify procedures by authority boundary**
   - Categories: `Identity/Auth`, `Server Authority Write`, `Server Compute Read`, `Local-Computable Read`, `Migration Candidate`.
   - Rationale: avoids premature “move everything serverless” decisions and preserves correctness boundaries.
   - Alternative considered: classify only by query vs mutation. Rejected because some queries are security-critical and some mutations can be queue-mediated.

3. **Stats migration requires parity verification**
   - Any stats endpoint considered for local computation must pass parity checks between API response and local SQL-derived response over representative datasets.
   - Rationale: stats are user-visible aggregates and regress silently if formulas diverge.
   - Alternative considered: direct cutover to local stats. Rejected due to drift risk and role-filter differences.

4. **Auth remains centralized unless equivalent security controls are proven**
   - `auth.login`, `auth.refresh`, `auth.logout`, and session validation semantics remain backend-owned unless an equivalent serverless implementation preserves JWT/JWKS constraints, cookie/session behavior, and RBAC guarantees.
   - Rationale: auth is a security boundary, not a convenience API.

## Risks / Trade-offs

- **[Risk] Local stats diverge from backend formulas or role filters** → **Mitigation:** parity test harness plus dual-run comparison before cutover.
- **[Risk] Migration reduces backend cost but increases edge-function operational complexity** → **Mitigation:** include observability, retry/error taxonomy, and rollback path in rollout gates.
- **[Risk] Hidden tRPC dependencies remain untracked** → **Mitigation:** enforce repository-wide static scan in CI for `trpc.` call inventory refresh.
- **[Risk] Security regressions from auth relocation** → **Mitigation:** treat auth as default non-migratable until formal security equivalence checklist passes.

## Migration Plan

1. Generate and commit the tRPC usage matrix from frontend call sites.
2. Tag each procedure with authority classification and offline behavior.
3. Prioritize dashboard stats procedures for local-compute feasibility analysis.
4. Implement dual-run mode for candidate stats (compute locally, compare against server responses).
5. Define cutover criteria and rollback trigger thresholds.
6. Keep auth/session flows API-backed until security equivalence is explicitly approved.

## Open Questions

- Should `adminUsers.getStats` remain server-owned due to potential role-bound aggregation semantics, even if technically computable locally?
- For writes currently routed through API, do we prefer Supabase Edge Functions as a full replacement or a hybrid with API retained for high-risk domains?
- What minimum observability baseline is required before disabling 24/7 API for selected read workloads?
