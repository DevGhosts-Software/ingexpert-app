## 1. Final retention audit and migration mapping

- [x] 1.1 Build a final endpoint-retention matrix artifact in `openspec/changes/finalize-api-deletion-rls-writes/files/` mapping each retirement target (`users.me`, `users.updateMe`, `users.updateMyPassword`, `projects.create`, `projects.update`, `projects.remove`, `items.remove`, `kits.setComponents`, `kits.clearKit`) to frontend replacement file paths.
- [x] 1.2 Cross-check retention targets against `apps/api/openapi/openapi.json` and enumerate exact router/service deletion points in `apps/api/src/users/users.router.ts`, `apps/api/src/projects/projects.router.ts`, `apps/api/src/items/items.router.ts`, `apps/api/src/kits/kits.router.ts` and coupled service files.

## 2. Supabase RLS SQL and local-write authority setup

- [x] 2.1 Add a Supabase policy SQL file (for example `packages/database/prisma/powersync-rls-final-api-cutdown.sql`) defining RLS for `users`, `projects`, `items`, and `kit_details` direct-write/read paths with explicit allow/deny semantics.
- [x] 2.2 Add verification queries and execution notes in the same SQL artifact (or companion SQL file) to validate permitted and forbidden actions for authenticated users and admin scopes.

## 3. Frontend migration off targeted API procedures

- [x] 3.1 Replace `trpc.users.me`, `trpc.users.updateMe`, and `trpc.users.updateMyPassword` usage in `apps/frontend/src/app/(dashboard)/layout.tsx`, `apps/frontend/src/hooks/use-is-admin.ts`, `apps/frontend/src/app/(dashboard)/page.tsx`, `apps/frontend/src/features/users/components/user-profile-sheet.tsx`, and `apps/frontend/src/features/users/components/user-table.columns.tsx` with Supabase/local synchronized user context and self-service mutation flows.
- [x] 3.2 Replace project mutation calls in `apps/frontend/src/features/projects/components/project-form-sheet.tsx` and `apps/frontend/src/features/projects/components/project-delete-sheet.tsx` with local PowerSync SQL write flows that preserve delete constraints.
- [x] 3.3 Replace inventory mutation calls in `apps/frontend/src/features/inventory/components/item-delete-dialog.tsx` and `apps/frontend/src/features/inventory/components/item-form-sheet.tsx` for item delete and kit component set/clear with local PowerSync SQL write flows; remove runtime API fallbacks.

## 4. API retirement, contracts, and verification

- [x] 4.1 Remove retired procedures and coupled logic from `apps/api/src/users/users.router.ts`, `apps/api/src/projects/projects.router.ts`, `apps/api/src/items/items.router.ts`, `apps/api/src/kits/kits.router.ts` and corresponding service files, while preserving `adminUsers.*` and batch import procedures.
- [x] 4.2 Regenerate OpenAPI and sync canonical output in `apps/api/openapi/openapi.json`, confirming retired operations are absent and retained scope matches admin management + batch imports.
- [x] 4.3 Update base capability specs in `openspec/specs/auth/spec.md`, `openspec/specs/projects/spec.md`, `openspec/specs/inventory/spec.md`, `openspec/specs/core-architecture/spec.md`, `openspec/specs/api-footprint-audit/spec.md`, `openspec/specs/api-responsibility-migration/spec.md`, and `openspec/specs/supabase-rls-write-governance/spec.md`.
- [x] 4.4 Run `pnpm check` at repository root and resolve introduced issues.
