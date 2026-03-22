## Why

Currently, users can view movement history for inventory items only in the table's action menu (via `RowActions` in `inventory-table.columns.tsx`). The detail sheet (`item-details-sheet.tsx`) that shows item information lacks this context, forcing users to return to the table to check movement history.

## What Changes

- Add movement history section to `ItemDetailsSheet` component for non-kit items
- Extract reusable `MovementHistoryList` component to avoid code duplication
- Enhance UI with icons and color coding for movement types
- Show history in a scrollable list format within the detail sheet

## Capabilities

### New Capabilities

- `movement-history-display`: Reusable component for displaying item movement history with visual enhancement

### Modified Capabilities

- `item-details-view`: Enhancement to show movement history inline in the detail sheet

## Impact

- **Files modified**: `apps/frontend/src/features/inventory/components/item-details-sheet.tsx`
- **New component**: `apps/frontend/src/features/inventory/components/movement-history-list.tsx`
- **No API changes**: Uses existing tRPC queries already in place for movement data
- **No Prisma schema changes**
