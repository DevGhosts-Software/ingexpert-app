## Why

The monorepo currently lacks a local offline-sync infrastructure, which blocks development and validation of offline-first flows in desktop and frontend features. We need a reproducible local PowerSync Open Edition setup so developers can run and test sync behavior end-to-end against the existing Prisma-backed domain models.

## What Changes

- Analyze `packages/database/prisma/powersync pubilcation.sql` and formalize the required publication-backed tables for local offline synchronization.
- Add `ops/powersync/docker-compose.yml` to run a local PowerSync service plus MongoDB (for PowerSync internal state).
- Add `ops/powersync/powersync.yaml` with baseline sync rules and schema mapping for `Item`, `Movement`, `MovementDetail`, and `Project`.
- Add `ops/powersync/.env.example` documenting required variables (`PS_DATA_SOURCE_URI`, `PS_PORT`) for local setup.
- Introduce a new capability spec at `openspec/specs/powersync/spec.md` describing this local infrastructure and operational contract.

## Capabilities

### New Capabilities

- `powersync`: Local PowerSync Open Edition infrastructure and sync-rule contract for offline-first development in the Ingexpert monorepo.

### Modified Capabilities

- None.

## Impact

- Affected paths: `ops/powersync/`, `packages/database/prisma/powersync pubilcation.sql` (analysis source), and `openspec/specs/powersync/spec.md`.
- Runtime dependencies (local infra): `journeyapps/powersync-service` container and `mongo` container.
- Data sync surface: `Item`, `Movement`, `MovementDetail`, `Project` tables via Postgres publication and PowerSync sync rules.
- API impact: no immediate tRPC or REST endpoint changes; this change adds local sync infrastructure and specification artifacts only.
