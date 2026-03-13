## 1. Dependency and build script migration

- [x] 1.1 Update `apps/frontend/package.json` to replace `@journeyapps/powersync-sdk-web` with `@powersync/web` and keep required peer/runtime dependencies for PowerSync web usage.
- [x] 1.2 Add/verify worker asset generation script (`powersync-web copy-assets -o public`) in `apps/frontend/package.json` and align generated asset ignore rules if needed.

## 2. PowerSync SDK refactor in frontend sources

- [x] 2.1 Refactor `apps/frontend/src/lib/powersync/schema.ts` imports and schema typing to use `@powersync/web` APIs.
- [x] 2.2 Refactor `apps/frontend/src/lib/powersync/db.ts` to initialize the shared database using current `@powersync/web` factory and explicit Turbopack-compatible worker paths under `public/@powersync/worker/`.
- [x] 2.3 Refactor `apps/frontend/src/lib/powersync/connector.ts` type imports to current SDK exports while preserving mutation replay behavior for `/items`, `/movements`, and `/projects`.
- [x] 2.4 Refactor `apps/frontend/src/components/providers/powersync-provider.tsx` to keep PowerSync bootstrap client-only, prevent SSR-side initialization, and preserve safe connect/disconnect lifecycle behavior.

## 3. Next.js + Tauri routing/asset compatibility hardening

- [x] 3.1 Update `apps/frontend/next.config.ts` only as needed so exported routes and static worker assets resolve correctly for Tauri packaging (`apps/frontend/src-tauri/tauri.conf.json` frontendDist `../out`).
- [x] 3.2 Validate PowerSync worker URLs and static asset references against exported build output used by Tauri desktop runtime.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @ingexpert/frontend type-check` and fix any SDK migration type issues.
- [x] 4.2 Run `pnpm check` at repository root to verify formatting, lint, type-check, and Next.js build pass after refactor.
