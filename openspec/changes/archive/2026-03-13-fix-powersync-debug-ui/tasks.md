## 1. PowerSync Debug Component Modernization

- [x] 1.1 Refactor `apps/frontend/src/components/powersync-debug.tsx` to replace unsupported methods (`currentStatus`, `registerListener`, `watch`) with supported `@powersync/react` hooks (`useStatus`, `useQuery`).
- [x] 1.2 Implement resilient UI states in `apps/frontend/src/components/powersync-debug.tsx` for connection/sync values and tracked counters (`ps_buckets`, `items`) without runtime crashes when data is unavailable.

## 2. Global Debug Mount and Gating

- [x] 2.1 Mount `PowerSyncDebug` in `apps/frontend/src/app/layout.tsx` (inside `PowerSyncProvider`) so diagnostics remain visible while navigating routes.
- [x] 2.2 Add debug visibility gating in `apps/frontend/src/app/layout.tsx` and/or `apps/frontend/src/components/powersync-debug.tsx` using approved environment conditions (development and/or explicit env flag).

## 3. Verification

- [x] 3.1 Run `pnpm check` at repository root to verify formatting, lint, type-check, and frontend build health after the debug changes.
- [x] 3.2 Run `pnpm format` at repository root to ensure formatting consistency.
