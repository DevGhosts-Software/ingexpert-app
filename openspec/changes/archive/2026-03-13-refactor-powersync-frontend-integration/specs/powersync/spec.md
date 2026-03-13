## MODIFIED Requirements

### Requirement: Frontend SDK Integration

The frontend workspace (`apps/frontend`) SHALL use the modern PowerSync Web SDK stack for browser/Turbopack compatibility:

- `@powersync/web`
- `@powersync/react`
- `@journeyapps/wa-sqlite`
- `kysely`

The deprecated `@journeyapps/powersync-sdk-web` package MUST NOT be used by frontend PowerSync integration files.

The frontend SHALL define `apps/frontend/src/lib/powersync/schema.ts` with `AppSchema` including:

- `Item`
- `Movement`
- `MovementDetail`
- `Project`

The schema contract MUST remain aligned with Prisma-backed entity fields for those tables.

The frontend SHALL provide `apps/frontend/src/lib/powersync/db.ts` that initializes a shared PowerSync database using current `@powersync/web` factory APIs and OPFS-capable local persistence.

#### Scenario: Modern SDK dependencies are installed

- **WHEN** frontend dependencies are reviewed after the refactor
- **THEN** `@powersync/web` is present and `@journeyapps/powersync-sdk-web` is absent

#### Scenario: Database initialization uses current Web SDK APIs

- **WHEN** `apps/frontend/src/lib/powersync/db.ts` is inspected
- **THEN** database creation uses `@powersync/web` APIs compatible with the current SDK version

### Requirement: Frontend Provider Wiring

The frontend SHALL include `apps/frontend/src/components/providers/powersync-provider.tsx` that initializes and connects the shared PowerSync database and exposes it through a dedicated React context provider for descendant components.

Provider bootstrap MUST remain client-only and MUST NOT execute WebAssembly worker initialization in server-side rendering paths.

The Next.js application provider tree in `apps/frontend/src/app/layout.tsx` SHALL wrap the app with `PowerSyncProvider` so descendant components can consume offline-reactive PowerSync state.

#### Scenario: Provider remains client-side only

- **WHEN** Next.js renders server components
- **THEN** PowerSync database initialization is not executed in SSR contexts

#### Scenario: Descendants can access PowerSync context

- **WHEN** a child component calls the PowerSync context hook under `layout.tsx`
- **THEN** it receives a connected shared database instance after provider initialization

## ADDED Requirements

### Requirement: Turbopack worker asset setup for PowerSync

The frontend package configuration SHALL include an automated worker asset copy step that runs `powersync-web copy-assets -o public` so PowerSync worker bundles are available under `public/@powersync/`.

PowerSync database and sync worker configuration SHALL reference these generated worker assets explicitly for Turbopack compatibility.

#### Scenario: Worker assets are generated after install

- **WHEN** dependencies are installed and postinstall scripts run
- **THEN** `public/@powersync/worker/` contains the required worker bundles for PowerSync

#### Scenario: Runtime references generated worker files

- **WHEN** the app initializes PowerSync in development or production build
- **THEN** worker paths resolve to files under `public/@powersync/worker/`

### Requirement: Tauri-compatible static routing and asset resolution

The Next.js frontend build configuration SHALL remain compatible with Tauri desktop packaging (`src-tauri/tauri.conf.json` with `frontendDist: ../out`) so exported routes and PowerSync worker assets load correctly in packaged runtime.

Any PowerSync path changes MUST preserve compatibility with static export routing semantics used by the desktop bundle.

#### Scenario: Desktop bundle loads routes and workers

- **WHEN** the Tauri app is built with the exported frontend
- **THEN** route navigation and PowerSync worker asset loading succeed without runtime path errors
