## Context

The remaining API-owned runtime mutations are concentrated in batch import procedures (`items.createBatch`, `items.importMany`, `kits.importMany`) and the `adminUsers.*` surface. Current frontend behavior already uses local SQLite + PowerSync for most non-admin flows, so batch operations can align to the same local-write model. Admin user operations require privileged auth-admin actions; these will move from NestJS routers/services to a single Supabase cloud function authority endpoint.

## Goals / Non-Goals

**Goals:**

- Remove runtime dependency on API batch mutation procedures.
- Replace `adminUsers.*` API ownership with one Supabase cloud function covering all admin actions.
- Keep role enforcement and data contracts explicit and auditable during migration.
- Retire corresponding API/OpenAPI exposure after replacement paths are active.

**Non-Goals:**

- Introducing new Prisma models or schema migrations.
- Reworking non-batch inventory flows already migrated to local-write + PowerSync.
- Splitting admin operations into multiple cloud functions for this phase.

## Decisions

- Use local SQLite transaction-based imports for items/kits batch flows and rely on PowerSync replay.
  - Rationale: matches the established offline-first architecture and removes API mediation latency.
  - Alternative considered: keeping API batch endpoints with thinner wrappers; rejected because it preserves API runtime ownership.
- Create one Supabase cloud function (proposed path: `supabase/functions/admin-control/`) with action-dispatch request contract.
  - Rationale: centralizes privileged admin logic and reduces endpoint sprawl.
  - Alternative considered: one function per admin action; rejected for now to minimize deployment/config overhead.
- Keep schema DTOs in `@ingexpert/schema` and reuse existing admin payload shapes where possible.
  - Rationale: preserves type-safe contracts and avoids shape drift between frontend and function.
- Remove API router/service wiring for migrated surfaces only after frontend callers are switched.
  - Rationale: avoids intermediate outages during rollout.

## Risks / Trade-offs

- [Risk] Single-function action dispatch can become oversized. → Mitigation: strict action enum + per-action handler separation inside function.
- [Risk] Privileged function auth misconfiguration could expose admin operations. → Mitigation: explicit admin claim checks and deny-by-default action guard.
- [Risk] Large local batch writes may cause sync bursts/conflicts. → Mitigation: bounded batch chunking in frontend import flow and retry-safe upsert semantics.
- [Trade-off] Cloud function introduces Supabase deployment surface replacing API surface. → Mitigation: place under repo-controlled folder and version with app code.

## Migration Plan

1. Add Supabase cloud function scaffold and shared action contract.
2. Migrate frontend admin screens/hooks to function invocation path.
3. Migrate batch import UI/services to local SQLite write transactions and PowerSync sync replay.
4. Remove API router/service exposure for migrated batch/admin procedures.
5. Regenerate OpenAPI and verify retired operations are absent.
6. Validate behavior via `pnpm check` plus targeted admin/batch manual verification.

Rollback: restore previous frontend callers and re-enable existing API router/service wiring if migration validation fails before cleanup merge.

## Open Questions

- Should cloud function responses exactly mirror current `adminUsers.*` payloads or adopt a normalized envelope with `action` metadata?
- Which Supabase role claim source is canonical for admin authorization in function runtime (`app_metadata.role` vs database lookup)?
