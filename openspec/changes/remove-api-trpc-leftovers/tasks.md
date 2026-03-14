## 1. Frontend tRPC retirement cleanup

- [x] 1.1 Remove `TRPCProvider` usage from `apps/frontend/src/app/layout.tsx` and remove now-unused provider imports.
- [x] 1.2 Remove tRPC client/provider implementation files from `apps/frontend/src/components/providers/trpc-provider.tsx` and `apps/frontend/src/lib/trpc.ts` (or replace with non-tRPC equivalents if still referenced).
- [x] 1.3 Remove `NEXT_PUBLIC_API_URL` usage from `apps/frontend/.env` and `apps/frontend/.env.example`, and update any related frontend config/docs references.
- [x] 1.4 Remove `@ingexpert/api` and any now-unused tRPC client dependencies from `apps/frontend/package.json` and refresh lock/workspace metadata.

## 2. API workspace retirement

- [x] 2.1 Delete `apps/api/**` once all frontend imports and workspace references are removed.
- [x] 2.2 Update root workspace/build config references in `pnpm-workspace.yaml`, `turbo.json`, root scripts, and any tooling configs that still include `apps/api`.
- [x] 2.3 Remove stale repository references to API runtime wiring (including docs/config paths) that would fail after deleting `apps/api`.

## 3. Verification and evidence

- [x] 3.1 Run repository search to confirm no frontend runtime `trpc.*` call-sites or `TRPCProvider` mount paths remain.
- [x] 3.2 Run `pnpm format`.
- [x] 3.3 Run `pnpm check`.
