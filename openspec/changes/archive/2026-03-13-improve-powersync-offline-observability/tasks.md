## 1. PowerSync Debug Observability

- [x] 1.1 Expand diagnostics in `apps/frontend/src/components/powersync-debug.tsx` to include connection/sync state, per-table counts (`items`, `projects`, `movements`, `movement_details`, `users`), queue visibility, and surfaced query/connector errors.
- [x] 1.2 Add reusable debug query helpers in `apps/frontend/src/components/powersync-debug.tsx` (or extracted helper file) to keep telemetry rendering deterministic and low-overhead.

## 2. Offline Session and Connector Resilience

- [x] 2.1 Harden session-aware credential behavior in `apps/frontend/src/lib/powersync/connector.ts` so persisted Supabase sessions are reused offline and credential failures remain recoverable for local reads.
- [x] 2.2 Ensure upload queue semantics in `apps/frontend/src/lib/powersync/connector.ts` keep pending CRUD entries uncompleted on network/auth failure and resume in-order processing after reconnection.
- [x] 2.3 Add/update validation coverage in `apps/frontend/src/lib/powersync/connector.validation.ts` for offline session reuse and queue defer/resume behavior.

## 3. Offline Reads for Projects and Movement Dependencies

- [x] 3.1 Refactor `apps/frontend/src/app/(dashboard)/projects/page.tsx` to read from PowerSync local `projects` data and preserve existing client-side search/sort/pagination behavior offline.
- [x] 3.2 Refactor movement dependency lookups in `apps/frontend/src/features/movements/components/movement-form-sheet.tsx` to source synchronized local users/projects data so the form remains usable offline.

## 4. SQL Mapping Cleanup (imageUrl/image_url)

- [x] 4.1 Update inventory local query contracts in `apps/frontend/src/app/(dashboard)/inventory/page.tsx` to avoid unnecessary SQL aliases (including `image_url`), keeping native DB column names in row types and mapping once at entity-conversion boundary.
- [x] 4.2 Verify PowerSync schema consistency in `apps/frontend/src/lib/powersync/schema.ts` and related local SQL consumers to prevent redundant snake_case/camelCase remapping churn.

## 5. Validation

- [x] 5.1 Run `pnpm check` at repository root and fix any regressions introduced by the offline/debug/mapping changes.
- [x] 5.2 Run `pnpm format` at repository root to ensure formatting consistency before review.
