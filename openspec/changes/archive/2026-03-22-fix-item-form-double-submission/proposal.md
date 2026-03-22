## Why

A critical double-submission bug in the Product Edit form allows users to trigger multiple form submissions by rapidly pressing 'Enter' or clicking the submit button multiple times. This results in duplicate 'Adjustment' (Ajuste) movements in the backend, corrupting the inventory stock calculations which rely on a single movement per user action.

## What Changes

- **Frontend Form Guard**: Implement an `isSubmitting` state in the `ItemFormSheet` component to disable the submit button and ignore subsequent submission attempts until the current request is resolved.
- **Submission Feedback**: Ensure the button indicates a "Saving..." state during the entire lifecycle of the PowerSync transaction and image upload.
- **Event Handling**: Ensure the form submission handler correctly intercepts 'Enter' key presses to prevent rapid-fire triggers.

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `inventory`: Added requirement that item creation and edit forms MUST prevent multiple concurrent submissions to ensure movement integrity.

## Impact

- **Frontend**: `apps/frontend/src/features/inventory/components/item-form-sheet.tsx` will be modified to include submission state management.
- **Data Integrity**: Prevents duplicate movement creation in the `movements` and `movement_details` tables during stock adjustments from the inventory UI.
