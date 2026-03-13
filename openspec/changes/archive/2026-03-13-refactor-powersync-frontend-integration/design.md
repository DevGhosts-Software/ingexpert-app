## Context

The current frontend integration uses `@journeyapps/powersync-sdk-web` and legacy database factory APIs, while the current PowerSync Next.js guidance targets `@powersync/web` + `@powersync/react` with copied worker assets under `public/@powersync/`. In our environment, this mismatch has produced critical WebAssembly and Turbopack SSR crashes, especially when client-only PowerSync initialization leaks into server execution paths.

Ingexpert also ships as a Tauri desktop app using static export (`next build` -> `out/`), so routing and asset resolution must remain compatible with both browser dev mode and packaged desktop runtime.

## Goals / Non-Goals

**Goals:**

- Migrate frontend PowerSync SDK usage to current supported packages and APIs.
- Eliminate Turbopack/SSR crashes by enforcing client-only initialization and explicit worker configuration.
- Keep local sync schema and upload connector behavior aligned with existing backend contracts.
- Preserve Tauri desktop compatibility for static export assets and routes.

**Non-Goals:**

- Introducing new backend endpoints, new tRPC procedures, or database schema changes.
- Redesigning domain synchronization scope (`Item`, `Movement`, `MovementDetail`, `Project`).
- Reworking PowerSync service infrastructure (`ops/powersync/*`) beyond compatibility touch-ups.

## Decisions

1. **Adopt `@powersync/web` as the frontend Web SDK source**
   - Replace imports from `@journeyapps/powersync-sdk-web` with `@powersync/web`.
   - Keep `@journeyapps/wa-sqlite` as peer dependency.
   - Rationale: matches current vendor guidance and removes outdated API surfaces that trigger integration breakage.
   - Alternative considered: keep legacy SDK and patch SSR behavior. Rejected due to recurring instability and future incompatibility.

2. **Use generated worker assets for Turbopack (`powersync-web copy-assets`)**
   - Add package script flow to copy worker bundles into `public/@powersync/`.
   - Configure explicit worker paths in DB/sync factories.
   - Rationale: Turbopack does not reliably support dynamic worker imports for this stack.
   - Alternative considered: custom bundler overrides. Rejected as brittle and harder to maintain.

3. **Enforce client-only provider bootstrap**
   - Keep PowerSync provider as `'use client'` and initialize/connect only in `useEffect`.
   - Avoid constructing PowerSync DB in server code paths and guard against duplicate initialization.
   - Rationale: prevents SSR invocation of WebAssembly/worker code.
   - Alternative considered: global singleton at module load. Rejected because module load can occur in server contexts.

4. **Preserve current upload contract families**
   - Keep routing to existing REST families (`/items`, `/movements`, `/projects`) used by upload replay.
   - Do not introduce new API shape dependencies in this refactor.
   - Rationale: integration hardening should not couple with backend contract expansion.

5. **Keep Tauri static export routing constraints explicit**
   - Verify Next.js export options and worker asset pathing remain valid for `src-tauri/tauri.conf.json` (`frontendDist: ../out`).
   - Ensure route/asset references resolve under packaged desktop runtime.
   - Rationale: broken path assumptions in static export can cause blank screens or missing worker failures in Tauri.

## Risks / Trade-offs

- **[Risk] SDK API differences break connector/database typing** → Mitigation: update imports/types in all PowerSync files together and run `pnpm check`.
- **[Risk] Worker assets not present in CI/local after install** → Mitigation: add deterministic script and document generated `public/@powersync/*` behavior.
- **[Risk] Tauri runtime resolves absolute paths differently** → Mitigation: validate desktop build path behavior and keep config consistent with current export mode.
- **[Trade-off] Additional generated assets in frontend workspace** → Mitigation: ignore generated worker bundle outputs appropriately and regenerate from script.
