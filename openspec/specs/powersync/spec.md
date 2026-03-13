# PowerSync Spec — Ingexpert

> Covers local PowerSync Open Edition infrastructure for offline-first development in Ingexpert.

---

## Publication Scope

The PowerSync publication source MUST include the Prisma-mapped physical tables:

- `items` (`Item`)
- `kit_details` (`KitDetail`)
- `movements` (`Movement`)
- `movement_details` (`MovementDetail`)
- `projects` (`Project`)
- `staff` (`Staff`)
- `users` (`User`)
- `work_areas` (`WorkArea`)

The publication definition SHALL be maintained in `packages/database/prisma/powersync pubilcation.sql`.

---

## Local Infrastructure

The repository SHALL include `ops/powersync/docker-compose.yml` with exactly two runtime services for local setup:

- `journeyapps/powersync-service`
- `mongo` (internal PowerSync state storage)

The PowerSync service MUST start with supported subcommand semantics using `start -r unified` (or an equivalent supported role subcommand).

The PowerSync service MUST NOT use deprecated top-level `--config` invocation flags that fail on current images.

The PowerSync service MUST mount `ops/powersync/powersync.yaml` read-only as its configuration source and set `POWERSYNC_CONFIG_PATH` to the mounted file path.

---

## Sync Rules Baseline

`ops/powersync/powersync.yaml` SHALL define:

- A PostgreSQL source using `PS_DATA_SOURCE_URI`
- The `powersync` publication as replication source
- A schema contract for:
  - `items`
  - `kit_details`
  - `movements`
  - `movement_details`
  - `projects`
  - `staff`
  - `users`
  - `work_areas`
- A baseline global bucket policy that syncs all rows from those entities to authenticated users

This baseline is intentionally broad for local development and MUST be treated as an initial policy, not a final production authorization model.

Any local startup/config modernization MUST preserve the Ingexpert sync scope for `items`, `kit_details`, `movements`, `movement_details`, `projects`, `staff`, `users`, and `work_areas`, and MUST continue replicating from the `powersync` publication.

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

- `items`
- `kit_details`
- `movements`
- `movement_details`
- `projects`
- `staff`
- `users`
- `work_areas`

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

---

## Requirement: Connector uploadData SHALL upload canonical movement entities

The PowerSync Supabase connector MUST iterate through `uploadQueue` entries and upload `movements` and `movement_details` operations to Supabase using `supabase.from(...).insert(...)` with preserved operation ordering.

#### Scenario: Queue entry for movements is uploaded

- **WHEN** `uploadQueue` contains a pending insert for `movements`
- **THEN** `uploadData` MUST call `supabase.from('movements').insert(...)`
- **THEN** the queue item MUST be marked as processed only after a successful Supabase response

#### Scenario: Queue entry for movement_details is uploaded

- **WHEN** `uploadQueue` contains a pending insert for `movement_details`
- **THEN** `uploadData` MUST call `supabase.from('movement_details').insert(...)`
- **THEN** the queue item MUST be marked as processed only after a successful Supabase response

## Requirement: Connector MUST ignore movement-originated optimistic item stock updates

The connector MUST discard or skip upload-queue `UPDATE` operations on `items` when those operations originate from movement optimistic stock adjustments, because server trigger reconciliation is authoritative.

#### Scenario: Optimistic movement-side items update is skipped

- **WHEN** `uploadQueue` contains an `UPDATE` on `items` tagged as movement-originated optimistic stock
- **THEN** `uploadData` MUST ignore the entry and MUST NOT issue `supabase.from('items').update(...)`

#### Scenario: Canonical admin item update is allowed

- **WHEN** `uploadQueue` contains an `UPDATE` on `items` originating from the explicit admin item edit flow
- **THEN** `uploadData` MUST upload the change using Supabase client calls
