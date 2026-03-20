## Context

The inventory management section (`item-form-sheet.tsx`) is admin-only, but regular users need to create items when registering PURCHASE movements. Currently, users must ask admins to create items first, creating a workflow bottleneck.

The RLS policies already permit authenticated users to INSERT into `items` (line165-172 of RLS migration). The limitation is purely UX-based: there's no UI for non-admins to create items.

## Goals / Non-Goals

**Goals:**

- Enable item creation from PURCHASE movement form
- Created items have their initial stock recorded via the purchase movement (no separate adjustment)
- Maintain audit trail: stock comes from purchase movement, not a separate adjustment
- Reuse existing item creation logic (fields, validation) where possible

**Non-Goals:**

- No changes to admin inventory management flow
- No changes to RLS policies (already permit authenticated INSERT)
- No item creation from EXIT, RETURN, or WRITEOFF movements (only PURCHASE)
- No modification to existing item creation schema or validation rules

## Decisions

### D1: Inline item creation modal within purchase movement form

**Decision:** Add a"Create New Item" trigger within the PURCHASE movement form that opens a simplified item creation modal/sheet.

**Rationale:**

- Keeps the movement form context (user is in the middle of creating a purchase)
- Reuses UI patterns from `item-form-sheet.tsx` (type picker, image upload, etc.)
- Clear visual separation between "select existing item" and "create new item"

**Alternatives considered:**

- Separate page navigation: Breaks flow, loses context
- Inline expansion: Too cluttered, hard to manage validation state

### D2: Single transaction for item + movement detail

**Decision:** Create the item and movement detail in a single PowerSync write transaction.

**Rationale:**

- Atomic operation ensures consistency
- No orphaned items if movement creation fails
- Stock is always tied to a movement for audit

**Implementation:**

```typescript
await powerSyncDb.writeTransaction(async (tx) => {
  // 1. Insert the new item
  await tx.execute(INSERT_ITEM_SQL, [itemId, ...]);

  // 2. Insert the movement (if not already created)
  await tx.execute(INSERT_MOVEMENT_SQL, [movementId, ...]);

  // 3. Insert movement detail with quantity
  await tx.execute(INSERT_MOVEMENT_DETAIL_SQL, [detailId, movementId, itemId, quantity]);

  //4. For KIT type, insert kit_details if components provided
  if (itemType === 'KIT') {
    for (const component of kitComponents) {
      await tx.execute(INSERT_KIT_DETAIL_SQL, [kitDetailId, itemId, component.itemId, component.quantity]);
    }
  }
});
```

### D3: Simplified item form for purchase context

**Decision:** Use a simplified item creation form that excludes stock input (stock comes from movement quantity).

**Rationale:**

- In purchase context, the movement quantity IS the stock
- Confusing to have both "item stock" and "movement quantity" fields- Follows the pattern from `item-form-sheet.tsx` where stock is shown as read-only after creation

**Fields included:**

- Type (PRODUCT, EQUIPMENT, TOOL only — KIT excluded)
- Name (required)
- Code (required)
- Location (required)
- Unit (required)
- Image (optional)

**Fields excluded:**

- Stock (derived from movement quantity)
- KIT type (must be created via admin inventory management)
- Kit components (not applicable - KIT creation not allowed)

### D4: Reuse existing components

**Decision:** Extract reusable form sections from `item-form-sheet.tsx` into shared components.

**Components to extract:**

- `ItemTypeCardPicker` - Type selection cards
- `ItemBasicFields` - Name, code, location, unit inputs
- `ItemImageUpload` - Image upload field
- `KitComponentsSection` - Kit component builder

**Rationale:**

- DRY principle - same validation, same UX
- Easier maintenance
- Consistent behavior across contexts

## Risks / Trade-offs

**R1: Users creating duplicate items**

- Risk: User might create "Hammer" instead of selecting existing "Hammer"
- Mitigation: Show item search first, "Create New" as secondary action. Search results show similar items by name/code.

**R2: Incomplete item data**

- Risk: Users rush through item creation, missing required fields
- Mitigation: Same validation as admin form. Form cannot submit without required fields.

**R3: Kit creation complexity**

- Risk: KIT creation requires configuring components, which adds complexity
- Mitigation: Exclude KIT type from purchase form entirely. KITs must be created via admin inventory management where proper component configuration can be done.

**R4: Transaction atomicity**

- Risk: Item created but movement detail fails
- Mitigation: Single PowerSync transaction ensures atomicity. On failure, nothing is persisted.
