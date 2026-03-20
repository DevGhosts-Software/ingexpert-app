## Why

Stock adjustments are currently implemented using a magic string `__stock_adjustment__` as a destination value, paired with either PURCHASE or WRITEOFF movement types. This hack was acceptable when stock was a column in the items table, but with the migration to ledger-based stock calculation via movements, adjustments should be first-class movement types with proper enum entries. The current approach hides these movements from the movements view, preventing users from seeing inventory adjustment history.

## What Changes

- Add two new enum values to `MovementType`: `STOCK_ADJUSTMENT_IN` and `STOCK_ADJUSTMENT_OUT`
- Replace all `__stock_adjustment__` destination string usage with the new enum types
- Remove the filter that hides stock adjustment movements from the movements list
- Stock adjustment movements become visible in movements view with their own type badge
- These movement types remain creatable only from the inventory section (not from movements CRUD)

## Capabilities

### New Capabilities

None - this is an enhancement to existing capabilities.

### Modified Capabilities

- `movements`: Adds new movement types for stock adjustments. Changes visibility rules - stock adjustments are no longer hidden from movements list.
- `inventory`: Stock edit flow now creates movements with proper enum types instead of magic string destinations.

## Impact

- **Database**: Prisma schema `MovementType` enum requires migration
- **API**: Movement type validation in tRPC schemas
- **Frontend**: Movement type badges, movement list filters, inventory stock edit logic
- **PowerSync**: Upload connector mapping for legacy `ajuste_positivo`/`ajuste_negativo` types
- **Existing data**: Migration script needed to convert existing `__stock_adjustment__` movements to new types
