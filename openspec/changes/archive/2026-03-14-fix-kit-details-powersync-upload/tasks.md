## 1. Connector CRUD support for kit details

- [x] 1.1 Update `apps/frontend/src/lib/powersync/connector.ts` to add `kit_details` (`kit_details`/`KitDetail`) upload handling for `PUT` replay into Supabase.
- [x] 1.2 Update `apps/frontend/src/lib/powersync/connector.ts` to support `DELETE` replay for `kit_details` entries (id-based delete) without breaking existing table behavior.
- [x] 1.3 Ensure error messages in `apps/frontend/src/lib/powersync/connector.ts` remain table-scoped and actionable for `kit_details` failures.

## 2. Validation coverage and regression protection

- [x] 2.1 Extend `apps/frontend/src/lib/powersync/connector.validation.ts` with cases that validate `kit_details` table routing is accepted and no unsupported-table error is thrown.
- [x] 2.2 Add or update connector validation cases in `apps/frontend/src/lib/powersync/connector.validation.ts` for `kit_details` failure paths (including Supabase error propagation shape).

## 3. End-to-end verification

- [x] 3.1 Validate kit component edit flow in `apps/frontend/src/features/inventory/components/item-form-sheet.tsx` still emits expected local `kit_details` writes for replay assumptions.
- [x] 3.2 Run `pnpm check` from repository root and confirm the change passes format, lint, type-check, and build.
