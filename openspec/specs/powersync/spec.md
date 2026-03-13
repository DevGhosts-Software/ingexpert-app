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
