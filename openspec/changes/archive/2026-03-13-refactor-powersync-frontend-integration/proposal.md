## Why

The frontend PowerSync integration is built on `@journeyapps/powersync-sdk-web`, which is outdated for our current Next.js + Tauri setup and has caused critical WebAssembly/Turbopack SSR runtime crashes. We need to move to the current Web SDK patterns to stabilize desktop builds and keep offline sync reliable.

## What Changes

- Replace frontend dependency and integration patterns from `@journeyapps/powersync-sdk-web` to `@powersync/web` while preserving current data sync behavior.
- Update PowerSync database initialization to use modern Web SDK factories and explicit worker asset paths compatible with Turbopack.
- Add/align worker asset copy flow (`powersync-web copy-assets`) so required worker bundles are available under `public/@powersync/`.
- Harden provider initialization to avoid server-side instantiation and prevent SSR/WebAssembly crashes in Next.js App Router.
- Align Next.js + Tauri export/routing assumptions so generated assets and worker paths resolve correctly in desktop builds.
- Keep existing backend mutation routing contract families unchanged (`/items`, `/movements`, `/projects`).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `powersync`: Update frontend SDK integration requirements to modern `@powersync/web` setup, worker asset handling for Turbopack, SSR-safe provider wiring, and Tauri-compatible routing/asset resolution constraints.

## Impact

- Affected frontend files under `apps/frontend/src/lib/powersync/` and `apps/frontend/src/components/providers/`.
- `apps/frontend/package.json` scripts/dependencies and generated worker assets in `apps/frontend/public/@powersync/`.
- `apps/frontend/next.config.ts` (and related Tauri build assumptions) for stable desktop export behavior.
- No Prisma schema changes and no new API endpoints.
