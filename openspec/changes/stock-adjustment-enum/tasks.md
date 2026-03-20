## 1. Database Schema

- [x] 1.1 Add `STOCK_ADJUSTMENT_IN` and `STOCK_ADJUSTMENT_OUT` to `MovementType` enum in `packages/database/prisma/schema/movement.prisma`
- [x] 1.2 Run `pnpm --filter @ingexpert/database prisma migrate dev --name add-stock-adjustment-types` to create and apply migration
- [x] 1.3 Regenerate Prisma client with `pnpm --filter @ingexpert/database generate`

## 2. Schema Package

- [x] 2.1 Update `packages/schema/src/movement.schema.ts` - ensure `MovementType` enum is re-exported (it's already re-exported from `@ingexpert/database`)
- [x] 2.2 Add validation that `STOCK_ADJUSTMENT_IN` and `STOCK_ADJUSTMENT_OUT` are NOT valid for `CreateMovementSchema` and `UpdateMovementSchema` input types (add refinement or separate z.nativeEnum without those values)

## 3. PowerSync Connector

- [x] 3.1 Update `apps/frontend/src/lib/powersync/connector.ts` - replace `__stock_adjustment__` destination handling with new enum type mapping
- [x] 3.2 For `ajuste_positivo`: map to `STOCK_ADJUSTMENT_IN` and set destination to `null`
- [x] 3.3 For `ajuste_negativo`: map to `STOCK_ADJUSTMENT_OUT` and set destination to `null`
- [x] 3.4 Remove the `__stock_adjustment__` destination assignment logic

## 4. Inventory Stock Edit

- [x] 4.1 Update `apps/frontend/src/features/inventory/components/item-form-sheet.tsx` - use `STOCK_ADJUSTMENT_IN`/`STOCK_ADJUSTMENT_OUT` instead of PURCHASE/WRITEOFF for stock adjustments
- [x] 4.2 Set `destination` to `null` instead of `__stock_adjustment__` when creating adjustment movements
- [x] 4.3 Update observations text to use clear Spanish labels ("Ajuste de stock desde edición de inventario" etc.)

## 5. Movements List & Display

- [x] 5.1 Update `apps/frontend/src/app/(dashboard)/movements/page.tsx` - remove the `AND COALESCE(m.destination, '') <> '__stock_adjustment__'` filter from the SQL query
- [x] 5.2 Update `apps/frontend/src/features/inventory/components/inventory-table.columns.tsx` - remove `__stock_adjustment__` special case handling from `formatMovementType`
- [x] 5.3 Add proper case handling for `STOCK_ADJUSTMENT_IN` (return "Ajuste de stock (entrada)") and `STOCK_ADJUSTMENT_OUT` (return "Ajuste de stock (salida)")

## 6. Data Migration

- [x] 6.1 Create a SQL migration script to convert existing `__stock_adjustment__` movements:
- [ ] 6.2 Apply the migration and verify row counts

```sql
UPDATE movements SET type = 'STOCK_ADJUSTMENT_IN', destination = NULL
WHERE destination = '__stock_adjustment__' AND type = 'PURCHASE';

UPDATE movements SET type = 'STOCK_ADJUSTMENT_OUT', destination = NULL
WHERE destination = '__stock_adjustment__' AND type = 'WRITEOFF';
```

## 7. Cleanup & Verification

- [x] 7.1 Search for any remaining `__stock_adjustment__` references and remove them
- [x] 7.2 Run `pnpm check` to verify format, lint, and type-check pass
- [ ] 7.3 Test stock adjustment creation from inventory edit (both increase and decrease)
- [ ] 7.4 Verify movements list shows stock adjustments correctly
