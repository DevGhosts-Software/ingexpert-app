## 1. Add topbar sync status surface

- [x] 1.1 Identify and update topbar/layout shell component(s) in `apps/frontend/src/app/` and/or shared layout components to render a persistent sync status UI.
- [x] 1.2 Implement a frontend sync-status state adapter (reusing existing PowerSync/connection signals) in `apps/frontend/src/lib/` or `apps/frontend/src/features/` to map to `connected`, `offline`, `syncing`, and `loading`.
- [x] 1.3 Display last successful sync reference in the new topbar status component with a clear fallback when no sync has completed yet.

## 2. Apply Spanish-first user-facing copy

- [x] 2.1 Audit and replace in-scope English user-facing status/auth strings in `apps/frontend/src/` with Spanish equivalents.
- [x] 2.2 Update login/auth error presentation (including invalid credentials) to Spanish user-facing copy in the relevant auth/login UI flow files.
- [x] 2.3 Verify no English user-facing copy remains within the touched sync-status/auth scope.

## 3. Validate behavior and quality

- [x] 3.1 Validate UI behavior manually for connected, offline, syncing, and loading transitions to confirm status messaging is clear and non-blocking.
- [x] 3.2 Run `pnpm check` from repository root and resolve any failures introduced by these frontend changes.
