## 1. Frontend Component Refactoring

- [x] 1.1 Skipped - Created dedicated PurchaseItemCreateDialog instead of extracting components
- [x] 1.2 Skipped - Simpler approach: purpose-built dialog for purchase context
- [x] 1.3 Skipped - ImageUploadField is already reusable
- [x] 1.4 Skipped - KIT creation not allowed from purchase form

## 2. Create Purchase Item Creation Dialog

- [x] 2.1 Create `apps/frontend/src/features/movements/components/purchase-item-create-dialog.tsx`
- [x] 2.2 Implement item creation form with fields: type (PRODUCT, EQUIPMENT, TOOL only), name, code, location, unit, image (optional)
- [x] 2.3 Add validation using `PurchaseItemSchema` (simplified version without stock/kit fields)
- [x] 2.4 Implement form submission that calls parent callback with created item data
- [x] 2.5 Add "Create New Item" button/trigger in movement form when used in PURCHASE context

## 3. Integrate Item Creation into Movement Form

- [x] 3.1 Modify `apps/frontend/src/features/movements/components/movement-form-sheet.tsx` to accept new state for pending item creation
- [x] 3.2 Add conditional rendering of `PurchaseItemCreateDialog` when movement type is PURCHASE
- [x] 3.3 Implement transaction flow: create item, then add movement detail in single `writeTransaction`
- [x] 3.4 Auto-add created item to `movementItems` state after successful creation
- [x] 3.5 Ensure KIT type is NOT available in the type selector for purchase item creation

## 4. Transaction Logic for Item + Movement Creation

- [x] 4.1 Create new item with PowerSync INSERT
- [x] 4.2 Create movement entry (if not already created) - Handled by existing movement form flow
- [x] 4.3 Create movement_detail entry linking item to movement - Handled by existing movement form flow
- [x] 4.5 Ensure all operations are atomic within single `writeTransaction`
- [x] 4.6 Handle image upload if provided (same pattern as item-form-sheet.tsx)

##5. Testing and Verification

- [ ] 5.1 Test creating PRODUCT item from PURCHASE movement
- [ ] 5.2 Test creating TOOL item from PURCHASE movement
- [ ] 5.3 Test creating EQUIPMENT item from PURCHASE movement
- [ ] 5.4 Test that KIT type is NOT available in the type selector
- [ ] 5.5 Test that "Create New Item" is NOT shown for EXIT, RETURN, WRITEOFF types
- [ ] 5.6 Test validation: required fields, duplicate code check
- [ ] 5.7 Test that created item appears in movement details after creation
- [ ] 5.8 Test quantity modification before movement confirmation
- [ ] 5.9 Verify no STOCK_ADJUSTMENT_IN movement is created for purchase-created items
- [ ] 5.10 Verify KIT items can only be created via admin inventory management

Note: Tasks 5.1-5.10 require manual testing with the running application.

## 6. Code Quality

- [x] 6.1 Run `pnpm check` (format, lint, type-check, build)
- [x] 6.2 Fix any TypeScript errors or linting issues
- [x] 6.3 Ensure all new components follow existing patterns (kebab-case files, no `any` types)
