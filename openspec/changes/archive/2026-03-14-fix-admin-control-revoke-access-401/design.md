## Context

`admin-control` is the runtime authority for admin user actions. The users table action **Revocar acceso** calls `revokeAuth` through `supabase.functions.invoke('admin-control')`, but production logs show `POST .../admin-control` returning `401` with authenticated session metadata present. This indicates caller identity derivation is brittle across Supabase Edge runtime request variants (for example: missing surfaced `Authorization` header while auth context exists in platform metadata/forwarded claims).

The fix must preserve strict admin-only enforcement while making caller resolution deterministic and observable for troubleshooting.

## Goals / Non-Goals

**Goals:**

- Make `admin-control` caller authentication resolution stable for authenticated admin sessions across Supabase Edge runtime variants.
- Keep deny-by-default authorization behavior for missing/invalid caller context and non-admin roles.
- Ensure `revokeAuth` succeeds when invoked by valid admins from the users dashboard.
- Improve error diagnostics so `401` causes are actionable.

**Non-Goals:**

- Changing action payload contracts (`revokeAuth`, `grantAuth`, etc.).
- Introducing new API endpoints or moving admin flows back to NestJS/tRPC.
- Modifying Prisma schema or database table layout.

## Decisions

- Centralize caller derivation in one strict resolver with ordered strategies.
  - Strategy order: explicit forwarded user headers, bearer token verification/claims, and runtime-auth compatible fallback accepted by Supabase guidance.
  - Rationale: one resolver prevents per-action drift and makes failures inspectable.
  - Alternative considered: keep current ad-hoc extraction logic; rejected because it already fails in production for valid sessions.

- Keep admin role authorization in database lookup against `public.users`.
  - Rationale: this is the current source of runtime role truth and aligns with existing function behavior.
  - Alternative considered: trust JWT role claim only; rejected to avoid drift between token metadata and persisted role.

- Standardize function error mapping for auth failures.
  - Rationale: distinct auth failure classes (`missing context`, `invalid token`, `non-admin`) speed debugging and reduce opaque frontend errors.
  - Alternative considered: generic `401`/`400` messages only; rejected because it obscures root cause.

- Keep frontend invocation contract unchanged, but improve user-facing error handling around revoke failures.
  - Rationale: avoids broad UI churn while giving admins clearer action feedback.
  - Alternative considered: introducing a new client wrapper contract; rejected as unnecessary for this targeted reliability fix.

## Risks / Trade-offs

- [Risk] Header strategy differences between local/dev/prod may still diverge. → Mitigation: codify accepted derivation paths and add targeted integration checks for revoke flow.
- [Risk] Additional auth parsing paths can increase complexity. → Mitigation: isolate into a small typed resolver with explicit branch coverage.
- [Trade-off] More explicit errors may expose internal auth-state hints. → Mitigation: keep messages actionable but bounded, without leaking secrets or raw tokens.

## Migration Plan

1. Update `admin-control` auth resolver and error mapping for caller derivation.
2. Validate admin `revokeAuth` from frontend users table against deployed function.
3. Confirm non-admin and missing-auth calls still return denial responses with no side effects.
4. Run repository verification (`pnpm check`) before merge.

Rollback: restore previous function implementation and redeploy `admin-control` if production regressions appear.

## Open Questions

- Should we add lightweight structured logging fields (error code + auth strategy path) for edge observability, or keep current plain error responses only?
