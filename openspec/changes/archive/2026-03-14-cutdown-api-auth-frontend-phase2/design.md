## Context

After phase-1 cutdown, API usage is concentrated in auth/session procedures and operational endpoints still used by non-admin workflows. The product now has strong local-first behavior via PowerSync, and Supabase already exists as the identity provider. This creates an opportunity to migrate auth/session authority and additional non-admin endpoints away from API.

This is a high-risk migration because auth currently enforces JWT/JWKS and role checks in API context. The design must preserve security/RBAC behavior while reducing API to admin-focused functions.

Constraints:

- Admin management operations remain API-owned in this phase.
- Existing user-visible behavior and role gates must stay equivalent.
- Endpoint retirement must be evidence-based from real frontend usage and parity validation.

## Goals / Non-Goals

**Goals:**

- Move auth/session flow authority to frontend + Supabase SDK/CLI-backed setup.
- Retire non-admin API endpoints that become unused after migration.
- Keep API primarily for admin operations in this phase.
- Support local-only export where local PowerSync data is sufficient.

**Non-Goals:**

- Migrating admin management operations out of API in this phase.
- Reworking domain data models in Prisma unless strictly required.
- Keeping transitional fallback branches indefinitely.

## Decisions

1. Frontend auth authority with explicit security-equivalence gates

- Frontend performs login, refresh/session recovery, logout, and current-user hydration directly against Supabase.
- Role context is resolved from synchronized/local user state with deterministic reconciliation rules.
- API auth endpoints are retired only after equivalence criteria pass.

Rationale: removes API auth dependency while preserving Supabase as identity authority.

Alternative: keep API auth until final phase. Rejected due to ongoing API runtime coupling.

2. Endpoint retirement by dependency class

- Class A (immediate retirement): endpoints with zero runtime frontend usage.
- Class B (retire after frontend switch): endpoints still used but fully replaceable by frontend/local/Supabase implementation.
- Class C (retain): admin operations and other non-equivalent endpoints.

Rationale: keeps removal safe and auditable.

Alternative: bulk removal. Rejected due to regression risk.

3. Local-only export for synchronized data

- Export flows read directly from local synchronized SQLite dataset for non-admin usage.
- API export dependency is removed where full local parity exists.

Rationale: aligns with local-first architecture and removes unnecessary online coupling.

Alternative: keep export API for consistency. Rejected where no backend value remains.

4. Rollback strategy uses release-level rollback, not long-lived runtime fallbacks

- During migration window, feature switches can exist.
- After acceptance, fallback branches are removed and rollback occurs via targeted revert/redeploy.

Rationale: avoids permanent dead complexity.

## Risks / Trade-offs

- [Risk] Auth semantics drift from API-era enforcement → Mitigation: require explicit security-equivalence checklist before endpoint retirement.
- [Risk] Role mismatch from local user projection → Mitigation: enforce deterministic role-source precedence and parity validation scenarios.
- [Risk] Hidden usage of supposedly removable endpoints → Mitigation: build/maintain call-site matrix and block deletion until zero-usage proof.
- [Risk] Offline session edge-cases cause lockouts or over-permission → Mitigation: define strict offline continuation + revalidation behavior and test gates.

## Migration Plan

1. Build updated endpoint usage/retention matrix from current frontend usage and OpenAPI.
2. Implement frontend auth authority path (Supabase SDK/CLI supported config and session flows).
3. Move project and other easy non-admin dependencies to local/Supabase equivalents.
4. Implement local-only export for covered datasets.
5. Remove now-unused non-admin API endpoints/procedures and regenerate OpenAPI.
6. Validate parity, RBAC, and offline behavior; execute `pnpm check`.
7. Finalize by removing transitional fallback switches and document retained admin API surface.

## Open Questions

- What is the canonical role source during auth bootstrap: JWT claims, local users table, or merged precedence?
- Should any project write endpoint remain API-owned due to future policy checks, or fully migrate now?
- Do we need a temporary server-side session-introspection endpoint during rollout, or can it be avoided entirely?
