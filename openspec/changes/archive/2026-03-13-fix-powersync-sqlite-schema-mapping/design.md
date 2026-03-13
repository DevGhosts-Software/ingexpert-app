## Context

`apps/frontend/src/lib/powersync/schema.ts` currently defines a limited, camelCase-oriented schema (`Item`, `Movement`, `MovementDetail`, `Project`) that no longer matches the effective synchronized table set and naming from Supabase/PowerSync. The reported source tables are `items`, `kit_details`, `movement_details`, `movements`, `projects`, `staff`, `users`, and `work_ares`, and sync is failing because the local SQLite schema contract does not align.

PowerSync sync behavior depends on consistent naming and column mapping across config + frontend schema. Any mismatch can prevent rows from materializing or make queries silently return empty results.

## Goals / Non-Goals

**Goals:**

- Align frontend PowerSync `AppSchema` with actual synchronized table names and field naming conventions.
- Ensure sync configuration and frontend schema contract describe the same table surface.
- Preserve existing app behavior while restoring reliable sync ingestion in local SQLite.

**Non-Goals:**

- No backend route additions or auth flow redesign.
- No Prisma model migration in this change.
- No broad redesign of sync authorization rules beyond schema/table alignment.

## Decisions

1. **Use synchronized table names as canonical in frontend schema**
   - Define tables using the actual sync names (`items`, `kit_details`, `movement_details`, `movements`, `projects`, `staff`, `users`, `work_ares`) unless sync config intentionally aliases them.
   - Rationale: PowerSync SQLite tables must match emitted sync entities.

2. **Prefer source-aligned column names for PowerSync schema fields**
   - Use snake_case where sync output is snake_case; avoid camelCase translations in schema declarations.
   - Rationale: Prevent field-level mapping drift and query mismatches.

3. **Treat table list verification as part of implementation**
   - Validate table names against running sync diagnostics/logged payloads and adjust if a naming typo is identified.
   - Rationale: Avoid locking in an incorrect table identifier and re-breaking sync.

## Risks / Trade-offs

- **[Risk] One or more provided table names may contain typos (e.g., `work_ares`)** → **Mitigation:** Verify effective synced table identifiers before finalizing implementation.
- **[Risk] Existing app code may query old schema names** → **Mitigation:** Update dependent queries/usages in the same change to the canonical names.
- **[Trade-off] Wider schema surface increases maintenance** → **Mitigation:** Keep PowerSync capability spec as source of truth for required table coverage.
