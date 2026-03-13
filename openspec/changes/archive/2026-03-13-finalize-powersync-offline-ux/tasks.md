## 1. Audit local-first blockers

- [x] 1.1 Audit `apps/frontend/src/app/(dashboard)/layout.tsx`, `apps/frontend/src/components/providers/trpc-provider.tsx`, and `apps/frontend/src/hooks/use-is-admin.ts` for online-only auth guard dependencies that block offline usage.
- [x] 1.2 Audit inventory and movement flows for blocking tRPC awaits in `apps/frontend/src/features/inventory/components/item-form-sheet.tsx`, `apps/frontend/src/features/inventory/components/inventory-table.tsx`, `apps/frontend/src/features/movements/components/movement-form-sheet.tsx`, `apps/frontend/src/features/movements/components/movement-table.tsx`, and `apps/frontend/src/features/movements/components/movement-detail-sheet.tsx`.

## 2. Implement offline-tolerant auth guard behavior

- [x] 2.1 Update dashboard/auth gating in `apps/frontend/src/app/(dashboard)/layout.tsx` to allow previously validated non-expired local sessions when offline and defer remote validation until connectivity returns.
- [x] 2.2 Implement reconnection revalidation and invalid-session handling in auth/session provider flow (`apps/frontend/src/components/providers/trpc-provider.tsx` and related auth utilities) with explicit user feedback.

## 3. Make inventory writes instant and queue-based

- [x] 3.1 Refactor item create/edit save flow in `apps/frontend/src/features/inventory/components/item-form-sheet.tsx` to complete on local SQLite write success and enqueue upload asynchronously.
- [x] 3.2 Ensure inventory views (`apps/frontend/src/features/inventory/components/inventory-table.tsx` and `apps/frontend/src/app/(dashboard)/inventory/page.tsx`) update immediately from PowerSync local query state after local commit.
- [x] 3.3 Remove/replace remote-mutation blocking spinners in inventory save UX with explicit queued/pending sync status messaging.

## 4. Make movement reads and interactions instant

- [x] 4.1 Refactor movement list/detail data loading in `apps/frontend/src/features/movements/components/movement-table.tsx` and `apps/frontend/src/features/movements/components/movement-detail-sheet.tsx` to render from local PowerSync data without waiting on tRPC reads.
- [x] 4.2 Validate movement form dependency loading in `apps/frontend/src/features/movements/components/movement-form-sheet.tsx` remains local-first and non-blocking under offline/high-latency conditions.
- [x] 4.3 Remove residual movement loading states that wait for remote read/mutation completion when local data is available.

## 5. Reposition debug surface and verify behavior

- [x] 5.1 Move `apps/frontend/src/components/powersync-debug.tsx` placement in `apps/frontend/src/app/layout.tsx` to the right-side layout position.
- [x] 5.2 Verify left-side navigation remains unobstructed and debug interactions remain functional after repositioning.

## 6. Validate and finalize

- [x] 6.1 Run `pnpm check` and resolve any issues.
- [x] 6.2 Run `pnpm format` and confirm no unintended formatting regressions.
