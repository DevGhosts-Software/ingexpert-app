## Context

`apps/frontend/src/components/powersync-debug.tsx` currently references legacy methods (`currentStatus`, `registerListener`, `watch`) that are not aligned with `@powersync/react@1.9.x`. The supported reactive path is hook-based (`useStatus`, `useQuery`). This mismatch makes the debug widget brittle and blocks real-time diagnosis of sync issues.

The debug panel is only useful if always reachable while testing sync flows across multiple pages, so it must be mounted at the app shell level and guarded for non-production usage.

## Goals / Non-Goals

**Goals:**

- Rebuild the debug component to use current supported hooks from `@powersync/react`.
- Show actionable runtime state: connection/sync status plus local SQLite counters for key tables.
- Place the panel in a globally visible location in frontend layout.
- Keep the panel safe by scoping visibility to development/debug contexts.

**Non-Goals:**

- Changing PowerSync sync rules (`ops/powersync/powersync.yaml`).
- Introducing new backend APIs or DB schema changes.
- Building a full observability dashboard beyond lightweight in-app diagnostics.

## Decisions

1. **Use hook-based reactivity instead of direct DB listeners**
   - Decision: Implement status with `useStatus()` and table metrics with `useQuery()`.
   - Rationale: This matches current package contracts and avoids unsupported DB event APIs.
   - Alternative considered: Using direct DB polling from `usePowerSync()`; rejected due to weaker reactivity and higher noise.

2. **Mount debug panel in root layout**
   - Decision: Render the debug component from `apps/frontend/src/app/layout.tsx` inside providers.
   - Rationale: Ensures visibility while moving through app routes and preserves access to `PowerSyncProvider` context.
   - Alternative considered: Mounting per-feature pages; rejected because it fragments debugging and misses cross-page issues.

3. **Gate with environment toggle**
   - Decision: Use a boolean guard (development and/or explicit env flag) to control rendering.
   - Rationale: Prevents leaking internal diagnostics in normal production UX.
   - Alternative considered: Always render for admins; rejected because diagnostics remain unnecessary for regular runtime.

## Risks / Trade-offs

- **[Risk] Querying internal tables may fail in early startup windows** → **Mitigation:** Show fallback values/loading states and avoid crashing UI on empty results.
- **[Risk] Debug panel adds visual noise** → **Mitigation:** Keep compact fixed-position card and gate rendering by environment.
- **[Risk] Version drift in SDK hooks** → **Mitigation:** Anchor implementation to installed package typings and README usage patterns.

## Migration Plan

1. Replace outdated methods in `powersync-debug.tsx` with current hooks.
2. Add global mount point in `layout.tsx` under existing providers.
3. Validate with `pnpm check` and `pnpm format`.
4. Rollback path: remove panel mount and restore previous component file if needed (no data migration involved).

## Open Questions

- Should debug visibility default to `NODE_ENV !== 'production'` only, or require an explicit `NEXT_PUBLIC_POWERSYNC_DEBUG=true` flag?
