## 1. Frontend Implementation

- [x] 1.1 Update the `isPending` definition in `apps/frontend/src/features/inventory/components/item-form-sheet.tsx` to include `form.formState.isSubmitting`.
- [x] 1.2 Verify that the `submit` button and all relevant inputs (name, code, location, stock, unit, type picker, kit builder) are disabled when `isPending` is true.
- [x] 1.3 Ensure the submit button displays "Guardando..." (edit) or "Agregando..." (create) while `isPending` is true.
- [x] 1.4 Test the form to ensure that multiple 'Enter' key presses do not trigger duplicate `onSubmit` calls (verified by `isSubmitting` behavior).

## 2. Validation

- [x] 2.1 Run `pnpm check` to ensure no linting, formatting, or type errors were introduced.
