## ADDED Requirements

### Requirement: API retirement audit SHALL remove stale workspace and dependency references

The repository MUST continuously audit and remove stale API-era references from workspace membership, task orchestration, and package dependencies once API runtime has been retired.

#### Scenario: Workspace and task graph are audited

- **WHEN** maintainers execute final API footprint cleanup
- **THEN** `pnpm-workspace.yaml` MUST not include retired API workspace paths
- **THEN** `turbo.json` MUST not include API runtime tasks in active pipeline dependencies

#### Scenario: Package dependencies are audited

- **WHEN** maintainers inspect application and package manifests after API retirement
- **THEN** unused API-only dependencies MUST be removed from `package.json` files
- **THEN** install, type-check, and build workflows MUST still succeed with the cleaned dependency graph
