## 1. Update local PowerSync container startup wiring

- [x] 1.1 Update `ops/powersync/docker-compose.yml` to replace deprecated top-level `--config` command usage with supported startup command semantics (`start -r unified`).
- [x] 1.2 Update `ops/powersync/docker-compose.yml` environment wiring to set `POWERSYNC_CONFIG_PATH` and keep `ops/powersync/powersync.yaml` mounted read-only at the referenced path.

## 2. Align local config and environment contract

- [x] 2.1 Validate and adjust `ops/powersync/powersync.yaml` keys/shape only as needed to remain compatible with current PowerSync image expectations while preserving Ingexpert sync scope (`items`, `movements`, `movement_details`, `projects`).
- [x] 2.2 Update `ops/powersync/.env.example` to document any required or renamed environment variables introduced by the startup/config wiring change.

## 3. Verify local startup and regression safety

- [x] 3.1 Run local compose verification in `ops/powersync` (`docker compose up -d`, inspect logs) and confirm startup no longer fails with `unknown option '--config'`.
- [x] 3.2 Run `pnpm check` from repo root to ensure monorepo validation passes after configuration updates.
