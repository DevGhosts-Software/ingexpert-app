## Why

The inventory stock calculation was changed to be derived from movement ledger entries via PostgreSQL triggers, but the Prisma schema lacks the `stock` field required for this trigger to work. Additionally, Supabase migration files are not being properly detected because they don't follow Supabase's timestamp-prefixed naming convention, preventing `supabase db push` from seeing changes.

## What Changes

- Add `stock` Decimal field to `Item` model in Prisma schema (required by `01_inventory-ledger-trigger.sql` trigger)
- Rename Supabase migration files to use timestamp prefix format for proper change detection
- Update documentation to reflect Supabase migration naming conventions

## Capabilities

### New Capabilities

(None - this is a fix alignment issue, not a new capability)

### Modified Capabilities

- `offline-inventory-ledger-sync`: The Prisma schema must include `stock` field to match the trigger implementation that updates `items.stock`

## Impact

- `packages/database/prisma/schema/inventory.prisma` - Add `stock` field to Item model
- `packages/database/supabase/migrations/` - Rename files with timestamp prefixes
- `packages/database/supabase/README.md` - Update documentation for migration workflow
