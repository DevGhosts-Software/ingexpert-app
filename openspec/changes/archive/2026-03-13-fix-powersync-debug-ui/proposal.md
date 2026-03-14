## Why

PowerSync troubleshooting is still slow because the current debug component uses outdated/non-existent SDK methods and does not expose reliable live sync state. We need a maintained debug panel that reflects the current `@powersync/react` API and is visible in-app during debugging sessions.

## What Changes

- Replace deprecated/invalid PowerSync debug component logic with current SDK hooks (`useStatus`, `useQuery`, `usePowerSync` where needed).
- Surface live diagnostics for connection/sync progress and key local table counts (`ps_buckets`, `items`) in a stable debug panel.
- Mount the debug panel in a visible global location so it can be used in real-time while navigating the app.
- Keep debug UI gated for safe usage (development-focused visibility control).

## Capabilities

### New Capabilities

- `powersync-debug-ui`: Provide a reliable in-app PowerSync diagnostics panel based on current SDK APIs.

### Modified Capabilities

- None.

## Impact

- Frontend component changes in `apps/frontend/src/components/powersync-debug.tsx`.
- Frontend composition changes in `apps/frontend/src/app/layout.tsx` (or equivalent top-level shell) to make debug visible.
- Potential provider touch-up in `apps/frontend/src/components/providers/powersync-provider.tsx` if debug access contracts need alignment.
- No backend routes, Prisma schema, or OpenAPI contract changes required.
