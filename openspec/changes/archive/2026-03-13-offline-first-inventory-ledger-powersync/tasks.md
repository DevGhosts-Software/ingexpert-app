## 1. Database Ledger Trigger (Supabase/PostgreSQL)

- [x] 1.1 Add a SQL script for movement-ledger stock reconciliation trigger at `packages/database/prisma/inventory-ledger-trigger.sql` covering `INSERT`, `UPDATE`, and `DELETE` on `movement_details`.
- [x] 1.2 Implement trigger function logic in `packages/database/prisma/inventory-ledger-trigger.sql` to read parent `movements.type` and apply signed deltas to `items.stock` (`IN` add, `OUT` subtract), including reverse-then-apply handling for updates.
- [x] 1.3 Attach/drop-create trigger definitions in `packages/database/prisma/inventory-ledger-trigger.sql` and document execution order in `packages/database/prisma/README` or existing DB setup notes used by the team.

## 2. Frontend Inventory Reads (PowerSync useQuery)

- [x] 2.1 Replace inventory page read hooks in `apps/frontend/src/app/(dashboard)/inventory/page.tsx` from `trpc.inventory.*.useQuery` to PowerSync `useQuery` SQL reads.
- [x] 2.2 Update inventory-related components (`apps/frontend/src/features/inventory/components/inventory-table.tsx`, `inventory-stats.tsx`, `inventory-table-toolbar.tsx`) to consume local query data contracts and remove tRPC read dependencies.
- [x] 2.3 Ensure SQL projections in inventory read queries use sync-rule aliases (for example `image_url AS "imageUrl"`, `created_by_id AS "createdById"`) in `apps/frontend/src/app/(dashboard)/inventory/page.tsx` and any extracted query helpers.

## 3. Local Movement Mutations + Optimistic UX

- [x] 3.1 Refactor movement creation submit flow in `apps/frontend/src/features/movements/components/movement-form-sheet.tsx` to execute local `INSERT` statements into `movements` and `movement_details` via PowerSync DB.
- [x] 3.2 Add optimistic stock update SQL execution in `apps/frontend/src/features/movements/components/movement-form-sheet.tsx` using signed `UPDATE items SET stock = stock +/- ? WHERE id = ?`.
- [x] 3.3 Remove write-operation loading spinners and remote-mutation wait states from movement/inventory write UX in `apps/frontend/src/features/movements/components/movement-form-sheet.tsx` and related action components.

## 4. PowerSync Connector Upload Queue Rules

- [x] 4.1 Implement `uploadData` in `apps/frontend/src/lib/powersync/connector.ts` to iterate the upload queue and push `movements`/`movement_details` inserts via Supabase client.
- [x] 4.2 Add queue filtering in `apps/frontend/src/lib/powersync/connector.ts` to ignore movement-originated optimistic `UPDATE` operations on `items` while preserving canonical admin-origin item edits.
- [x] 4.3 Add/adjust connector tests or validation harness in existing PowerSync-related test location (or `apps/frontend/src/lib/powersync/connector.ts` test peer) to verify `items` optimistic updates are not uploaded.

## 5. API Cleanup and Validation

- [x] 5.1 Remove obsolete stock-calculation and backend validation paths from `apps/api/src/movements/movements.router.ts` and `apps/api/src/movements/movements.service.ts` that are superseded by trigger-based reconciliation.
- [x] 5.2 Confirm OpenAPI alignment by checking `apps/api/openapi/openapi.json` for remaining movement/item contract expectations after cleanup.
- [x] 5.3 Run `pnpm check` and then `pnpm format` from repository root to validate formatting, lint, type-check, and build integrity.
