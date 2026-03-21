## Why

The inventory system has been refactored to calculate stock on-the-fly via SQL queries from the `movements` table, making the `items.stock` column obsolete. The source of truth is now the movements ledger, eliminating the risk of stock drift and removing the need for trigger-based reconciliation. This change removes all remaining references to the deprecated stock column.

## What Changes

- **BREAKING**: Remove `inventory-ledger-trigger` migration that maintains obsolete `items.stock` column
- Remove `stock` column definition from PowerSync local schema
- Remove stock-related INSERT/UPDATE logic from frontend forms
- Remove stock field from Zod schema definitions
- Create SQL revert migration to drop the trigger (for existing deployments)
- Update specs to reflect stock-as-derived-view architectural pattern

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `offline-inventory-ledger-sync`: Remove requirements for trigger-based stock reconciliation; stock is now derived from movements, not a persisted column
- `powersync`: Remove `stock` column from local schema contract; the column no longer exists in items

## Impact

**Database**:

- `packages/database/supabase/migrations/20240101000001_inventory-ledger-trigger.sql` —obsolete, must be reverted in existing deployments

**Frontend**:

- `apps/frontend/src/lib/powersync/schema.ts` — remove `stock: column.real`
- `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx` — remove stock from INSERT/UPSERT
- `apps/frontend/src/features/inventory/components/item-form-sheet.tsx` — remove stock from INSERT
- `apps/frontend/src/features/movements/components/movement-form-sheet.tsx` — remove optimistic stock UPDATE

**Schema**:

- `packages/schema/src/item.schema.ts` — remove stock field

**Specs**:

- `openspec/specs/offline-inventory-ledger-sync/spec.md` — remove or mark obsolete
- `openspec/specs/powersync/spec.md` — remove stock column mention
