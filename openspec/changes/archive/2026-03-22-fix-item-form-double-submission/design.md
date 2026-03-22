## Context

The `ItemFormSheet` component in `apps/frontend/src/features/inventory/components/item-form-sheet.tsx` handles item creation and editing. Currently, it only tracks image upload state (`isUploading`) but doesn't manage the lifecycle of the overall form submission. This allows multiple concurrent submissions, leading to duplicate database records (specifically stock movements).

## Goals / Non-Goals

**Goals:**

- Prevent multiple concurrent submissions of the item form.
- Provide clear visual feedback (disabled state, "Saving...") during submission.
- Ensure the entire lifecycle (database transaction + image upload) is covered by the submission state.

**Non-Goals:**

- Modifying backend stock calculation logic.
- Changing existing table or selection logic.
- Refactoring the `PowerSync` transaction logic.

## Decisions

### Decision: Use `form.formState.isSubmitting` for submission state management

- **Rationale**: `react-hook-form` provides a built-in `isSubmitting` state that is automatically managed when using `handleSubmit`. Since the existing `onSubmit` is `async`, this state will correctly capture the duration of the entire operation.
- **Alternatives**:
  - **Manual `isSubmitting` state**: More boilerplate and manually managed. Less idiomatic when using `react-hook-form`.
  - **Debouncing `onSubmit`**: Prevents rapid clicks but doesn't handle the "disable while pending" UX as cleanly as state-based disabling.

### Decision: Combine `isSubmitting` with `isUploading` into a single `isPending` state

- **Rationale**: This ensures that all UI elements (buttons, inputs) remain disabled throughout the entire process, including the image upload which happens after the initial transaction.
- **Implementation**: `const isPending = form.formState.isSubmitting || isUploading;`

## Risks / Trade-offs

- **[Risk] Long-running uploads** → [Mitigation] The user must wait for the upload to finish before the sheet closes or allows another action. This is acceptable for data integrity.
- **[Risk] Submission failure** → [Mitigation] `react-hook-form`'s `isSubmitting` will reset to `false` if the `async` handler throws, allowing the user to retry.
