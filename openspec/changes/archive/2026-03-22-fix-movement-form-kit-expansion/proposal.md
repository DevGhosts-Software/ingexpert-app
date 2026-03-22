## Why

The kit expansion logic in the movement form (`movement-form-sheet.tsx`) is broken. When users attempt to add a kit item to a movement, they receive the error "El kit no tiene componentes configurados" even when the kit has components defined in `kit_details`. This regression was introduced by recent changes to the query or data flow.

## What Changes

- Fix the kit components query or data transformation so kits properly expand into their component items when added to a movement
- Ensure `kitComponentsByKitId` map correctly keyed and populated
- Verify data flow from `kitDetailsQuery` → `kitComponentsByKitId` → `handleAddItem`

## Capabilities

### New Capabilities

- None (bug fix only)

### Modified Capabilities

- None (this is a bug fix within existing behavior, not a requirement change)

## Impact

**Affected code:**

- `apps/frontend/src/features/movements/components/movement-form-sheet.tsx`
  - `kitDetailsQuery` (lines 206-218) - fetches kit components from `kit_details`
  - `kitComponentsByKitId` useMemo (lines 224-240) - builds kit→components map
  - `handleAddItem` function (lines 427-459) - expands kits into components

**Root cause likely locations:**

1. Query returning empty results (sync issue, missing where clause, or data not yet synced)
2. Map key mismatch (`kit_id` vs `item.componentId`)
3. `item.type === 'KIT'` check failing or `componentId` not being the kit's actual ID
