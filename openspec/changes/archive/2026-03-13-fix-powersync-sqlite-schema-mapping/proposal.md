## Why

PowerSync sync is currently failing because the frontend SQLite schema contract in `apps/frontend/src/lib/powersync/schema.ts` does not match the actual source table/column naming used in Supabase and PowerSync output. This mismatch prevents reliable local sync and breaks offline data availability.

## What Changes

- Align frontend PowerSync `AppSchema` table definitions with the actual synchronized table set: `items`, `kit_details`, `movement_details`, `movements`, `projects`, `staff`, `users`, and `work_ares`.
- Normalize column naming in the frontend PowerSync schema to match synced payload fields (snake_case vs camelCase mismatches).
- Ensure PowerSync config and frontend schema contracts remain consistent so synced rows materialize into expected SQLite tables.
- Add verification steps to confirm records replicate into local SQLite for the updated table set.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `powersync`: Expand and correct frontend/local schema mapping requirements to match actual synced table names and fields, including additional user/staff/work-area related tables.

## Impact

- Affected code/config:
  - `apps/frontend/src/lib/powersync/schema.ts`
  - `ops/powersync/powersync.yaml` (if sync shape/table aliases must be updated to match schema)
  - `openspec/specs/powersync/spec.md`
- No new API routes.
- No Prisma schema migration required for this change.
