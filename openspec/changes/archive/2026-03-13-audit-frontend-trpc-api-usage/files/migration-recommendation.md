# Migration Recommendation

This recommendation applies to frontend tRPC procedures inventoried in `trpc-usage-matrix.json` and mapped in `openapi-mapping.md`.

## Phase 1: Observe

- Keep API as source of truth for all currently mapped procedures.
- Continuously regenerate and commit the tRPC usage matrix to detect new call sites.
- Track contract gaps called out in `openapi-mapping.md` (frontend-used procedures with no OpenAPI mapping).
- Establish telemetry for stats parity candidates (`items.getStats`, `movements.getStats`, `projects.getStats`, `adminUsers.getStats`).

Exit criteria:

- Procedure inventory is complete and reviewed.
- OpenAPI/procedure gaps are triaged (intentional vs missing metadata).

## Phase 2: Dual-run

- For read candidates, compute local result and API result side by side.
- Start with stats procedures documented in `stats-parity-plan.md`.
- Log per-field equality and mismatch context (user role, filters, timestamp).
- Keep UI rendering API value while collecting parity evidence.

Exit criteria:

- Stable parity at field level across representative datasets.
- No authorization drift for admin-only flows.

## Phase 3: Cutover

- Switch selected read procedures to local-computed source only after dual-run acceptance.
- Keep writes (`Server Authority Write`) API-backed.
- Keep `Identity/Auth` API-backed until explicit security-equivalence approval.
- Document each cutover decision in the responsibility matrix/governance docs.

Exit criteria:

- No parity regressions after switch.
- User-visible dashboard/admin metrics remain unchanged.

## Phase 4: Rollback

- Maintain a runtime flag for each migrated read procedure to revert to API instantly.
- Trigger rollback on parity mismatch, auth/RBAC anomalies, or elevated error rates.
- Keep dual-run instrumentation available during and after rollback for diagnosis.

Rollback triggers:

- Any non-zero mismatch rate above accepted threshold for integer stat fields.
- Security or permission boundary breach.
- Sustained data staleness beyond expected sync bounds.

## Recommendation Summary

- Migrate in a read-first strategy: stats and low-risk reads after parity validation.
- Keep auth/session and authority writes centralized.
- Treat missing OpenAPI mappings as governance debt to resolve before broad backend reduction.
