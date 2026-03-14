## Context

The repository has already completed audit and migration groundwork (`audit-frontend-trpc-api-usage`, `migrate-api-responsibilities`) and now runs local-first data flows in key screens. However, API read procedures and runtime fallback branches still exist in several domains. This leaves dead or near-dead server endpoints, duplicate read logic, and fallback complexity that no longer matches desired architecture.

This change finalizes the cutdown phase: keep API authority where required (auth/session, user/admin management, authoritative writes), remove migrated read endpoints/procedures, and remove runtime fallback setup so approved reads run strictly from PowerSync/local SQLite.

Constraints:

- Auth/session boundaries in `auth` must remain API-owned.
- Admin/user management and authority writes must remain API-owned.
- Endpoint removals must be evidence-based from existing audit and migration outputs.
- OpenAPI contract must reflect retained endpoints after cleanup.

## Goals / Non-Goals

**Goals:**

- Minimize API surface to authority-required endpoints.
- Remove deprecated read endpoints and dead service/router code.
- Remove frontend runtime API fallback branches for already migrated read flows.
- Move lightweight dashboard card stats to local computation where parity is already established.
- Preserve behavior and RBAC semantics while simplifying implementation.

**Non-Goals:**

- Migrating auth/session ownership out of API.
- Migrating admin/user management or authoritative writes out of API.
- Introducing new fallback mechanisms.
- Prisma schema redesign.

## Decisions

1. Endpoint-retention matrix is the deletion gate

- We will maintain a retained-vs-removal-ready endpoint matrix driven by audited usage and migration completion evidence.
- Endpoints are removable only when frontend call sites and fallback branches are removed and local behavior parity is confirmed.

Rationale: avoids unsafe or opinion-only deletions.

Alternative considered: bulk-delete all non-auth reads immediately. Rejected due to hidden call-site risk.

2. Runtime fallback removal after cutover completion

- For approved migrated reads, frontend fallback toggles/branches will be removed, not merely disabled.
- Rollback, if required, is handled by controlled reintroduction/redeploy, not by dormant runtime fallback paths.

Rationale: aligns with request for PowerSync-only reads and reduces complexity/drift.

Alternative considered: keep fallback flags permanently. Rejected because it preserves dead complexity.

3. Strict authority boundary preservation

- Retain and protect `auth.*`, `users.me`, user/admin management, and authority writes.
- Deletion checks MUST fail proposals that remove these boundaries.

Rationale: protects security and consistency boundaries.

Alternative considered: include partial authority endpoint reduction. Rejected as out of scope and high risk.

4. Dead-code and stale-comment cleanup is mandatory

- Delete retired router procedures, service methods, fallback helpers, and stale “delete later” comments tied to retired paths.
- Regenerate and validate OpenAPI after cleanup.

Rationale: prevents ghost contracts and maintenance debt.

Alternative considered: leave dead code for one release. Rejected due to ambiguity and accidental reuse risk.

## Risks / Trade-offs

- [Risk] Hidden frontend dependency still hitting a removed endpoint → Mitigation: verify `trpc.*` call-site inventory and remove call sites before endpoint deletion.
- [Risk] Local stats drift after API stats endpoint removal → Mitigation: enforce parity evidence requirement before deletion and validate card outputs in affected screens.
- [Risk] Lost emergency rollback convenience without runtime fallback → Mitigation: keep rollback playbook via targeted revert/redeploy and strict pre-removal checks.
- [Risk] OpenAPI drift during cleanup → Mitigation: regenerate `apps/api/openapi/openapi.json` and compare retained operation set.

## Migration Plan

1. Build an explicit endpoint-retention matrix from current audit + current code usage.
2. Remove frontend fallback branches and feature toggles for already-approved local reads.
3. Remove API router/service procedures that are removal-ready.
4. Remove stale fallback/deletion comments and dead helper functions tied to retired procedures.
5. Regenerate OpenAPI and verify only retained endpoints remain exposed.
6. Run `pnpm check` to validate contract, types, lint, and build integrity.
7. If regressions appear, rollback by targeted commit revert and redeploy (no runtime fallback path).

## Open Questions

- Which currently exposed read endpoints are still required for non-UI integrations (if any)?
- Do we retain any non-OpenAPI internal tRPC procedures intentionally after this cutdown, or remove them now?
