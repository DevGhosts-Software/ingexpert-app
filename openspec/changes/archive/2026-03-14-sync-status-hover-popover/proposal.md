## Why

The topbar sync badge currently exposes details only through a multiline `title` tooltip, which is hard to read, inconsistent across platforms, and not aligned with the app's shadcn UI patterns. We need a richer, accessible hover surface that preserves current sync context and improves readability for desktop users.

## What Changes

- Replace the browser-native `title` tooltip on the sync status badge with a shadcn/Radix-based hover detail surface.
- Keep current status semantics (offline/loading/syncing/connected), pending queue counts, and last successful sync reference.
- Ensure the detail surface remains Spanish-first and keyboard/mouse friendly.
- Preserve existing visual tone and icon behavior of the badge while improving interaction UX.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-sync-status-localization`: extend topbar sync-status requirements to define structured hover details instead of relying on native tooltip behavior.

## Impact

- Affected frontend component: `apps/frontend/src/components/sync-status-indicator.tsx`.
- Affected UI primitives: shadcn/Radix hover/tooltip-popover component usage in topbar status area.
- No API route changes.
- No Prisma schema changes.
- No backend service/module changes.
