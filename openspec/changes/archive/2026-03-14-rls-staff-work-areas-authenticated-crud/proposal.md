## Why

Current Supabase RLS governance does not explicitly cover `staff` and `work_areas`, even though both tables are in the PowerSync publication and are used by runtime user-management flows. This creates a policy gap where authenticated CRUD behavior is not contractually defined alongside other direct-write tables.

## What Changes

- Extend RLS governance scope to include `staff` and `work_areas`.
- Define authenticated CRUD policy expectations for `staff` and `work_areas`.
- Require migration SQL and verification queries to include these two tables.
- Keep movement-ledger immutability rules unchanged.
- No new API endpoints or tRPC procedures.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `supabase-rls-write-governance`: expand direct-write RLS requirements and verification coverage to include `staff` and `work_areas` with authenticated CRUD behavior.

## Impact

- Affected SQL migrations under `packages/database/supabase/migrations/` (RLS grants/policies + verification queries).
- Affected OpenSpec capability: `openspec/specs/supabase-rls-write-governance/spec.md`.
- No API contract changes (no OpenAPI route additions/removals).
- No Prisma schema/model changes required.
