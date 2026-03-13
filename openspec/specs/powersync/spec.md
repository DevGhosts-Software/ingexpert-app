# PowerSync Spec — Ingexpert

> Covers local PowerSync Open Edition infrastructure for offline-first development in Ingexpert.

---

## Publication Scope

The PowerSync publication source MUST include the Prisma-mapped physical tables:

- `items` (`Item`)
- `movements` (`Movement`)
- `movement_details` (`MovementDetail`)
- `projects` (`Project`)

The publication definition SHALL be maintained in `packages/database/prisma/powersync pubilcation.sql`.

---

## Local Infrastructure

The repository SHALL include `ops/powersync/docker-compose.yml` with exactly two runtime services for local setup:

- `journeyapps/powersync-service`
- `mongo` (internal PowerSync state storage)

The PowerSync service MUST mount `ops/powersync/powersync.yaml` as its configuration source.

---

## Sync Rules Baseline

`ops/powersync/powersync.yaml` SHALL define:

- A PostgreSQL source using `PS_DATA_SOURCE_URI`
- The `powersync` publication as replication source
- A schema contract for:
  - `Item`
  - `Movement`
  - `MovementDetail`
  - `Project`
- A baseline global bucket policy that syncs all rows from those entities to authenticated users

This baseline is intentionally broad for local development and MUST be treated as an initial policy, not a final production authorization model.

---

## Environment Contract

`ops/powersync/.env.example` MUST document required variables for local startup:

- `PS_DATA_SOURCE_URI` (Supabase/PostgreSQL datasource URI)
- `PS_PORT` (PowerSync service port)

---

## Frontend SDK Integration

The frontend workspace (`apps/frontend`) SHALL declare the PowerSync client dependencies:

- `@powersync/web`
- `@powersync/react`
- `kysely`
- `@journeyapps/wa-sqlite`

The deprecated `@journeyapps/powersync-sdk-web` package MUST NOT be used by frontend PowerSync integration files.

The frontend SHALL define `apps/frontend/src/lib/powersync/schema.ts` with `AppSchema` including:

- `Item`
- `Movement`
- `MovementDetail`
- `Project`

The schema contract MUST remain aligned with Prisma-backed entity fields for those tables.

The frontend SHALL provide `apps/frontend/src/lib/powersync/db.ts` that initializes a shared PowerSync database using current `@powersync/web` factory APIs and OPFS-capable local persistence.

---

## Turbopack Worker Asset Setup

The frontend package configuration SHALL include an automated worker asset copy step that runs `powersync-web copy-assets -o public` so PowerSync worker bundles are available under `public/@powersync/`.

PowerSync database and sync worker configuration SHALL reference generated worker assets explicitly under `public/@powersync/worker/` for Turbopack compatibility.

---

## Tauri-Compatible Static Routing and Asset Resolution

The Next.js frontend build configuration SHALL remain compatible with Tauri desktop packaging (`apps/frontend/src-tauri/tauri.conf.json` with `frontendDist: ../out`) so exported routes and PowerSync worker assets load correctly in packaged runtime.

Any PowerSync path changes MUST preserve compatibility with static export routing semantics used by the desktop bundle.

---

## Frontend Connector and Upload Contract

The frontend SHALL implement `apps/frontend/src/lib/powersync/connector.ts` with a `PowerSyncBackendConnector` implementation that:

- fetches Supabase session credentials using `supabase.auth.getSession()`,
- returns PowerSync credentials containing endpoint and bearer token,
- and implements `uploadData` by reading local CRUD batches and routing mutation requests to existing backend contract families.

Mutation routing MUST target current API families represented in the generated OpenAPI/tRPC metadata:

- `/items`
- `/movements`
- `/projects`

No new API routes are introduced by this capability.

---

## Frontend Provider Wiring

The frontend SHALL include `apps/frontend/src/components/providers/powersync-provider.tsx` that initializes and connects the shared PowerSync database and exposes it through a dedicated React context provider for descendant components.

Provider bootstrap MUST remain client-only and MUST NOT execute WebAssembly worker initialization in server-side rendering paths.

The Next.js application provider tree in `apps/frontend/src/app/layout.tsx` SHALL wrap the app with `PowerSyncProvider` so descendant components can consume offline-reactive PowerSync state.
