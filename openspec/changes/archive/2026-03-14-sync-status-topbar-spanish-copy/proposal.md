## Why

Users need clear real-time feedback about sync/connection state to trust local-first data, avoid editing during active sync, and understand how fresh their data is. At the same time, remaining English UI/error strings create inconsistent UX in a Spanish-first product.

## What Changes

- Add a topbar sync status indicator showing connection state, last successful sync, and active sync/loading states for the current user session.
- Define non-blocking but visible UX cues (for example: syncing, offline mode, loading) so users understand when data may still be in transition.
- Standardize user-facing copy to Spanish across affected frontend surfaces, including auth/login errors (for example `Invalid credentials`).
- Ensure status and localization behavior works without reintroducing API runtime dependencies.

## Capabilities

### New Capabilities

- `frontend-sync-status-localization`: Unified frontend requirements for sync-state visibility (topbar status) and Spanish-first user-facing copy consistency.

### Modified Capabilities

- None.

## Impact

- Frontend UI shell/topbar components and shared state/hooks that expose sync state metadata.
- Frontend auth and other user-facing screens where English copy remains.
- No new API routes or OpenAPI contract changes.
- No Prisma schema/model changes.
