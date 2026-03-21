## 1. Database Migration

- [x] 1.1 Create revert migration `20240101000006_revert-stock-trigger.sql` in `packages/database/supabase/migrations/` to drop the trigger function and stock column

## 2. Schema Package Cleanup

- [x] 2.1 Remove `stock` field from `ItemSchema` in `packages/schema/src/item.schema.ts`
- [x] 2.2 Remove `stock` from `ItemEntity` type definition in `packages/schema/src/item.schema.ts`
- [x] 2.3 Run `pnpm --filter @ingexpert/schema build` to verify schema changes

## 3. PowerSync Schema Cleanup

- [x] 3.1 Remove `stock: column.real` from items table definition in `apps/frontend/src/lib/powersync/schema.ts`

## 4. Frontend Code Cleanup

- [x] 4.1 Remove stock-related INSERT/UPDATE logic from `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`
- [x] 4.2 Remove stock field from INSERT in `apps/frontend/src/features/inventory/components/item-form-sheet.tsx`
- [x] 4.3 Remove optimistic stock UPDATE from `apps/frontend/src/features/movements/components/movement-form-sheet.tsx`
- [x] 4.4 Remove `MOVEMENT_OPTIMISTIC_SOURCE` constant and filtering logic from `apps/frontend/src/lib/powersync/connector.ts`
- [x] 4.5 Update any stock references in `apps/frontend/src/lib/api-migration-local-reads.ts`

## 5. Spec Archive

- [x] 5.1 Mark `openspec/specs/offline-inventory-ledger-sync/spec.md` as obsolete with a deprecation notice
- [x] 5.2 Update `openspec/specs/powersync/spec.md` to remove stock column references

## 6. Verification

- [x] 6.1 Run `pnpm check` to verify no type errors after removals
- [x] 6.2 Delete the obsolete trigger migration file `packages/database/supabase/migrations/20240101000001_inventory-ledger-trigger.sql`
