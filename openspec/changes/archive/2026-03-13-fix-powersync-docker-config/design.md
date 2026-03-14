## Context

The local PowerSync stack in `ops/powersync/docker-compose.yml` currently passes `--config` as a top-level container argument. Current PowerSync service images expect startup subcommands (for example `start -r unified`) and read config through supported mechanisms such as `POWERSYNC_CONFIG_PATH` or base64 environment config. This mismatch causes startup failure with `unknown option '--config'`.

Ingexpert already has the required local artifacts (`docker-compose.yml`, `powersync.yaml`, `.env.example`) and a scoped PowerSync capability spec. The change should modernize boot wiring without altering domain sync scope.

## Goals / Non-Goals

**Goals:**

- Make local PowerSync container startup compatible with current image command semantics.
- Keep a single local PowerSync runtime service plus Mongo storage for local development.
- Preserve existing sync publication/entities and environment contract unless strictly necessary.
- Provide deterministic verification steps to confirm successful boot.

**Non-Goals:**

- No changes to frontend connector behavior or API contracts.
- No new sync authorization model design.
- No production HA split into separate API/sync containers for this local setup.

## Decisions

1. **Use explicit startup command `start -r unified`.**  
   Rationale: This matches current documented self-hosted compose usage and avoids deprecated top-level flags.

2. **Use `POWERSYNC_CONFIG_PATH` for file-based config injection.**  
   Rationale: This keeps config human-readable in-repo (`ops/powersync/powersync.yaml`) and avoids base64-encoding overhead for local development.

3. **Keep config file mounted read-only from repo.**  
   Rationale: Maintains current developer workflow and keeps config version-controlled.

4. **Retain existing service topology for local scope.**  
   Rationale: The current spec defines local setup expectations; this fix addresses startup compatibility rather than architecture expansion.

## Risks / Trade-offs

- **[Risk] Image behavior drift across tags** → **Mitigation:** Prefer documented command pattern and verify by running container startup checks.
- **[Risk] Config schema drift (`powersync.yaml` fields outdated)** → **Mitigation:** Validate current file against docs-driven minimum and update only required keys in this change.
- **[Trade-off] Unified role mode in local setup** → **Mitigation:** Accept for dev simplicity; production role split remains out of scope.
