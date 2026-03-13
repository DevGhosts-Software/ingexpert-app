## 1. Frontend dependency setup

- [x] 1.1 Update `apps/frontend/package.json` to add `@journeyapps/powersync-sdk-web`, `@powersync/react`, `kysely`, and `@journeyapps/wa-sqlite`.
- [x] 1.2 Run the workspace install command to update lockfile artifacts (`pnpm-lock.yaml`) after editing `apps/frontend/package.json`.

## 2. PowerSync core module scaffolding

- [x] 2.1 Create `apps/frontend/src/lib/powersync/schema.ts` exporting `AppSchema` for `Item`, `Movement`, `MovementDetail`, and `Project` aligned with Prisma/OpenAPI entity contracts.
- [x] 2.2 Create `apps/frontend/src/lib/powersync/connector.ts` implementing `PowerSyncBackendConnector` with Supabase session-token credential retrieval and explicit `uploadData` interception routing for existing items/movements/projects contract families.
- [x] 2.3 Create `apps/frontend/src/lib/powersync/db.ts` initializing a shared `PowerSyncDatabase` using the wa-sqlite WASM + OPFS adapter path.

## 3. App provider integration

- [x] 3.1 Create `apps/frontend/src/components/providers/powersync-provider.tsx` to manage database lifecycle and expose PowerSync context to React descendants.
- [x] 3.2 Update frontend provider composition (including `apps/frontend/src/app/layout.tsx` and/or `apps/frontend/src/components/providers/trpc-provider.tsx` as appropriate) to wrap the app tree with `PowerSyncProvider`.

## 4. Capability documentation updates

- [x] 4.1 Update `openspec/specs/powersync/spec.md` with normative frontend architecture requirements for schema, connector, DB initialization, and provider wiring.
- [x] 4.2 Cross-check `openspec/specs/powersync/spec.md` statements against `openapi/openapi.json`-aligned endpoint families to ensure upload contract references remain accurate without adding new API routes.

## 5. Verification

- [x] 5.1 Run `pnpm check` and resolve any format, lint, type-check, or build issues introduced by the PowerSync frontend integration.
- [x] 5.2 Run `pnpm format` if `pnpm check` reports formatting drift, then re-run `pnpm check` to confirm a clean pipeline.
