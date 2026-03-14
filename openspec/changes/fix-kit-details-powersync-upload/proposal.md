## Why

Kit component edits are now written locally through PowerSync, but upload replay fails with `Unsupported CRUD table "kit_details" in PowerSync uploadData`. This blocks syncing of kit composition changes and leaves local and remote state inconsistent.

## What Changes

- Add explicit PowerSync upload mapping for `kit_details` CRUD entries in the frontend connector.
- Define deterministic replay behavior for kit component replacement flows (delete old rows, insert new rows) so sync does not fail mid-batch.
- Add connector validation coverage for `kit_details` upload paths and failure handling.
- Verify no API endpoint additions are required; this remains a frontend-to-Supabase sync fix and keeps API disappearance goals intact.

## Capabilities

### New Capabilities

- `powersync-kit-details-upload`: Reliable upload replay for `kit_details` local writes through the PowerSync connector.

### Modified Capabilities

- `inventory`: Kit component local-write + sync behavior is tightened to require successful `kit_details` upload replay without unsupported-table errors.

## Impact

- Affected code: `apps/frontend/src/lib/powersync/connector.ts`, connector validation tests, and kit-component save flows that generate `kit_details` CRUD.
- API/OpenAPI: No new routes or response contracts in `apps/api/openapi/openapi.json`.
- Data model: No Prisma schema change expected; sync behavior aligns existing Supabase `kit_details` table writes with local schema.
