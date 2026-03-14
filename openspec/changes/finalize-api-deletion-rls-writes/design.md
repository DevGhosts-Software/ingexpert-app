## Context

Phase-1 and phase-2 cutdowns removed most read and auth/session API ownership. Remaining non-admin runtime dependencies are specific self-service/user and inventory/project mutations still called through tRPC, even though the app already uses PowerSync local writes and Supabase session tokens for other mutation paths.

The requested end-state is:

- API retains admin user management (`adminUsers.*`) and batch imports only.
- Runtime user/project/item/kit mutations move to local SQL writes (PowerSync) + Supabase synchronization.
- Authorization for these direct writes is enforced by Supabase RLS, with policy SQL committed in-repo.

Constraints:

- Preserve RBAC outcomes currently expected by UI and admin boundaries.
- Avoid runtime fallback branches back to removed endpoints.
- Keep OpenAPI and frontend call-sites fully aligned.

## Goals / Non-Goals

**Goals:**

- Remove API dependency for:
  - `users.me`, `users.updateMe`, `users.updateMyPassword`
  - `projects.create`, `projects.update`, `projects.remove`
  - `items.remove`
  - `kits.setComponents`, `kits.clearKit`
- Define and commit Supabase RLS SQL for these direct-write/read paths.
- Implement frontend replacements with PowerSync local SQL and Supabase auth APIs.
- Retire corresponding API procedures/services and regenerate OpenAPI.

**Non-Goals:**

- Removing `adminUsers.*` procedures in this change.
- Removing batch import procedures in this change.
- Reworking Prisma schema or core table structure.

## Decisions

1. Use Supabase RLS as the authority layer for direct writes

- Decision: Add a SQL policy file (and verification section) under `packages/database/prisma/` that governs `users`, `projects`, `items`, and `kit_details` mutations for authenticated users.
- Rationale: Keeps authorization centralized and explicit after API procedure removal.
- Alternative considered: Keep lightweight API wrappers only for authorization checks. Rejected to meet final API deletion goal.

2. Replace targeted frontend tRPC mutations with local PowerSync SQL + Supabase auth APIs

- Decision: Move each targeted call-site to local write transactions and Supabase SDK operations where applicable (profile/password/session).
- Rationale: Aligns with existing local-first architecture already used in movements/items.
- Alternative considered: Write directly to remote Supabase tables from UI actions. Rejected because local-first UX and offline continuity are core behaviors.

3. Retire API procedures only after call-site zero-usage proof

- Decision: Remove routers/services for listed procedures after frontend call-sites are migrated and verified by repo scans.
- Rationale: Avoids breaking runtime paths and ensures OpenAPI reflects true ownership.
- Alternative considered: API-first removal followed by frontend migration. Rejected due to higher outage risk.

4. Keep admin/batch-import API surface intact

- Decision: Preserve `adminUsers.*` and import endpoints as explicit retained scope in this phase.
- Rationale: Matches requested operational boundary and avoids mixing admin migration into this cut.
- Alternative considered: remove additional admin endpoints now. Rejected as out of scope.

## Risks / Trade-offs

- [Risk] RLS policies too permissive or restrictive could cause over-access or failed writes
  - Mitigation: include explicit policy verification SQL and scenario-based test matrix per table/action.
- [Risk] Self-service flows (`users.me`, profile/password) diverge from current behavior
  - Mitigation: define deterministic frontend bootstrap from Supabase session + local user row and preserve role constraints.
- [Risk] Project delete semantics (linked movements restriction) regress after API removal
  - Mitigation: enforce equivalent constraint via DB/RLS rule and validate with negative tests.
- [Risk] Hidden call-sites keep removed endpoints alive
  - Mitigation: require grep-based usage evidence and OpenAPI diff as completion gates.

## Migration Plan

1. Build final retention matrix for targeted procedures and map each replacement path.
2. Add Supabase RLS SQL file with policies and verification queries.
3. Migrate frontend call-sites to PowerSync local writes / Supabase auth methods.
4. Remove retired API procedures/services and unregister from app router.
5. Regenerate OpenAPI and verify retained surface is admin management + batch import.
6. Run full `pnpm check` and document parity/behavior evidence.

Rollback strategy:

- Rollback by reverting the change set (frontend + API + SQL policy file) and redeploying previous contract.
- No permanent runtime fallback branches are added.

## Open Questions

- Should `users.me` replacement rely solely on local synchronized `users` table row keyed by `auth.uid()`, or require a dedicated bootstrap sync guard?
- For password change, do we standardize on Supabase `updateUser` flow only, or include optional re-auth enforcement UX?
- Should project delete guard be implemented as a hard DB constraint helper function + policy check, or as deny-on-related-row RLS predicate only?
