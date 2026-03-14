## Why

The current local PowerSync container startup is using an outdated container command (`--config`), which now fails with `unknown option '--config'`. As a result, local PowerSync cannot boot reliably, blocking final verification of offline sync behavior.

## What Changes

- Update local PowerSync Docker runtime invocation to the current self-hosted startup pattern (`start -r unified`) instead of legacy top-level flags.
- Update configuration wiring to use supported config injection (`POWERSYNC_CONFIG_PATH` with mounted config files, or equivalent supported env-based config wiring).
- Align `ops/powersync` compose and config structure with current docs-backed conventions so local startup works without manual patching.
- Preserve existing Ingexpert sync scope (items, movements, movement_details, projects) and environment contract while modernizing boot semantics.
- Add explicit local verification steps for container health and log-level startup success.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `powersync`: Update local infrastructure requirements to use current PowerSync container startup/config conventions and remove deprecated command usage that prevents boot.

## Impact

- Affected code/config:
  - `ops/powersync/docker-compose.yml`
  - `ops/powersync/powersync.yaml` (or split service/sync config files if required by final design)
  - `ops/powersync/.env.example` (if new/renamed env vars are required)
- No new API routes, Prisma models, or frontend contracts.
- Improves developer reliability for local PowerSync setup and final integration checks.
