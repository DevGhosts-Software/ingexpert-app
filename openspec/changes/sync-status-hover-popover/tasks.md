## 1. Frontend sync indicator interaction update

- [x] 1.1 Update `apps/frontend/src/components/sync-status-indicator.tsx` to replace the `title`-based tooltip with a shadcn/Radix hover surface component around the sync badge trigger.
- [x] 1.2 In `apps/frontend/src/components/sync-status-indicator.tsx`, render structured hover detail rows for estado, última sincronización completa, and pendientes por subir while preserving existing status computation and Spanish copy.
- [ ] 1.3 Verify the topbar interaction behavior manually in the frontend app (hover/focus visibility and compact layout) without changing unrelated components.

## 2. Validation

- [ ] 2.1 Run `pnpm check` from repository root and resolve any regressions introduced by this change.
- [ ] 2.2 Run `pnpm format` from repository root to ensure formatting consistency for touched files.
