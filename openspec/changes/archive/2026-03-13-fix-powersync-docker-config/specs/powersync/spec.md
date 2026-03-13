## ADDED Requirements

### Requirement: Local PowerSync container uses supported startup command semantics

The local PowerSync Docker Compose service SHALL start the PowerSync container using current subcommand-style invocation and MUST NOT pass deprecated top-level `--config` style flags that are rejected by current images.

#### Scenario: Compose startup command is compatible

- **WHEN** a developer runs `docker compose up powersync` in `ops/powersync`
- **THEN** the PowerSync service container command uses `start -r unified` (or an equivalent supported role command)
- **AND** startup does not fail with `unknown option '--config'`

### Requirement: Local config wiring uses supported config path environment variable

The local PowerSync Docker Compose service SHALL provide service configuration through a mounted YAML file and `POWERSYNC_CONFIG_PATH`, so the container resolves the config from a supported mechanism.

#### Scenario: Service reads mounted config file

- **WHEN** the PowerSync container starts in local development
- **THEN** `ops/powersync/powersync.yaml` is mounted into the container read-only
- **AND** `POWERSYNC_CONFIG_PATH` points to that mounted file path
- **AND** the service reaches a healthy running state

### Requirement: Local modernization preserves Ingexpert sync scope

Modernizing local startup/config wiring MUST preserve the baseline Ingexpert sync contract for `items`, `movements`, `movement_details`, and `projects`.

#### Scenario: Sync contract remains unchanged after startup fix

- **WHEN** the local PowerSync stack is updated to the new startup/config wiring
- **THEN** the effective sync configuration still references the `powersync` publication and the same entity schema/tables defined by the PowerSync capability
