## Context

The API footprint audit identified a clear boundary: auth/session and authority writes must remain centralized, while several read paths can move to local-first computation after parity validation. The current system already uses PowerSync and local SQLite for offline-first behavior in key areas, but frontend still depends on API-backed reads for dashboard and admin views. We need to apply the migration recommendations in a controlled way: simplify API responsibilities without sacrificing correctness, security, or performance.

Constraints:

- API remains source of truth for write authority and security boundaries.
- Auth requirements in `auth/spec.md` remain strict (JWT/JWKS, RBAC, session semantics).
- Migration must be reversible and observable.
- OpenAPI/tRPC contract visibility must remain explicit for retained procedures.

## Goals / Non-Goals

**Goals:**

- Move approved read paths from API-backed queries to local-first reads.
- Use dual-run parity validation before every cutover.
- Keep performance stable or improved by favoring local read paths.
- Preserve auth and write-path authority boundaries.
- Reduce API runtime scope to what is genuinely required.

**Non-Goals:**

- Replacing API auth/session flows with local-only logic.
- Migrating authority writes away from API in this change.
- Reworking Prisma schema unless a migration step proves it necessary.
- Blindly removing API routes without observability and rollback.

## Decisions

1. **Read-first migration sequence by risk tier**

- Tier 1 (first): `users.listNames`, `adminUsers.getWorkAreas`, `kits.getComponents`, table/filter/list reads already aligned with local-first flows.
- Tier 2 (second): stats procedures (`items.getStats`, `movements.getStats`, `projects.getStats`, `adminUsers.getStats`) only after parity instrumentation passes.
- Tier 3 (last): cleanup/deprecation of API read usage once cutover is stable.

Rationale: minimizes risk while quickly reducing online dependency where confidence is high.

Alternative considered: migrating all read procedures at once. Rejected due to parity and rollback risk.

2. **Dual-run gate as mandatory cutover control**

- For each candidate procedure, compute local result and compare to API output during observation.
- Define per-procedure acceptance criteria as exact equality for deterministic fields.
- Store mismatch telemetry with context (`procedure`, role, filters, timestamp).

Rationale: prevents silent data drift and protects user-visible metrics.

Alternative considered: direct cutover with manual QA. Rejected as insufficiently reliable.

3. **Auth and authority writes remain API-owned**

- Keep `auth.login`, `auth.refresh`, `auth.logout`, `users.me` centralized.
- Keep all `useMutation` authority paths API-backed.

Rationale: these are security and consistency boundaries, not mere transport choices.

Alternative considered: partial edge migration of auth now. Rejected pending explicit security-equivalence approval.

4. **Contract governance must be explicit**

- For retained API procedures, keep OpenAPI visibility accurate.
- For intentionally tRPC-only procedures, document rationale and lifecycle to avoid ambiguity.

Rationale: supports maintainability and prevents contract drift during simplification.

Alternative considered: defer contract cleanup. Rejected because migration decisions rely on explicit contracts.

## Risks / Trade-offs

- **[Risk] Local vs API stats divergence** → **Mitigation:** enforce dual-run acceptance and rollback triggers before cutover.
- **[Risk] Role-filter mismatch for admin/user views** → **Mitigation:** validate parity per role and filter set, not only global totals.
- **[Risk] Operational complexity from feature flags/telemetry** → **Mitigation:** standardize one migration flag pattern and one mismatch event schema.
- **[Risk] Premature API route removal breaks legacy UI paths** → **Mitigation:** cutover in phases, deprecate before removal, keep rollback switch until stable.

## Migration Plan

1. **Observe**

- Implement matrix-driven migration registry (procedure, class, owner, target mode).
- Add dual-run telemetry plumbing and feature flags per candidate read.

2. **Dual-run**

- Enable candidate reads in compare mode (local + API).
- Record parity deltas and monitor mismatch rates.

3. **Cutover**

- Switch passing candidates to local-primary reads.
- Keep API fallback flag for each migrated procedure.

4. **Rollback**

- On parity or security anomaly, flip procedure flag back to API immediately.
- Retain logs and mismatch traces for diagnosis.

5. **Stabilize and simplify**

- Remove dead frontend API-read paths for fully migrated procedures.
- Keep API modules focused on auth/session + authority writes + non-migrated high-risk reads.

## Open Questions

- Which exact mismatch threshold (if any above zero) is acceptable for non-critical aggregates during short observation windows?
- Should retained non-OpenAPI tRPC procedures be promoted to OpenAPI, or kept intentionally private with explicit governance notes?
- Do we maintain long-term dual-run for one release after cutover, or disable immediately after acceptance?
