## 1. Inventory Import Logic Fix

- [x] 1.1 Modify the `UPDATE items` SQL statement for individual items in `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx` (around line 265) to remove the `image_url` assignment and its corresponding parameter.
- [x] 1.2 Modify the `UPDATE items` SQL statement for kits in `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx` (around line 435) to remove the `image_url` assignment and its corresponding parameter.

## 2. Verification

- [x] 2.1 Run `pnpm check` to ensure formatting, linting, type-checking, and build pass without regressions.
