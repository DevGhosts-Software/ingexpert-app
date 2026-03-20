## Why

Regular users cannot access the inventory section to create new items—only admins have access. However, users creating PURCHASE (compra) movements need to add items that don't yet exist in the system. Currently, this requires an admin to first create the item, then the user can add it to the purchase movement. This creates a workflow bottleneck where users must request admin intervention for every new item.

This change removes that bottleneck by allowing users to create new items directly from the purchase movement form, with the stock automatically recorded as part of the purchase itself.

## What Changes

- Movement form gains capability to create new items inline when movement type is PURCHASE
- New items created this way have their initial stock set directly via the purchase movement (no separate `STOCK_ADJUSTMENT_IN` movement)
- Item creation from purchase movements uses the same RLS permissions already available to authenticated users
- UI provides a streamlined item creation flow within the purchase movement form
- KIT type items are NOT creatable from purchase form (must be created via admin inventory management)

## Capabilities

### New Capabilities

- `purchase-item-creation`: Enables creation of new items directly from the PURCHASE movement form, with stock automatically recorded as part of the purchase movement detail

### Modified Capabilities

- `movements`: Movement creation flow for PURCHASE type now supports creating new items inline
- `inventory`: Item creation is now accessible from two entry points: the dedicated inventory form (admin-only) and the purchase movement form (all authenticated users)

## Impact

**Frontend:**

- `apps/frontend/src/features/movements/components/movement-form-sheet.tsx` — Add item creation capability
- May need a new simplified item creation modal/sheet for inline creation

**Backend/Database:**

- RLS policies for `items` already allow authenticated INSERT — no policy changes required
- No schema changes required
- No API changes required (PowerSync local-first writes)

**User Experience:**

- Users can now create items directly when registering a purchase without admin intervention
- Reduces friction for new material entry workflows
- Initial stock is captured in the purchase movement, maintaining proper audit trail
