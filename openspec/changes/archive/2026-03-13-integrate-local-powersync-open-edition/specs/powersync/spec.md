## ADDED Requirements

### Requirement: Publication source entities are explicitly validated for offline sync

The system SHALL analyze `packages/database/prisma/powersync pubilcation.sql` and align PowerSync-replicated entities with Prisma-backed persistence for `Item`, `Movement`, `MovementDetail`, and `Project`.

#### Scenario: Publication analysis documents required tables

- **WHEN** a developer prepares local PowerSync setup
- **THEN** the publication SQL and Prisma table mappings for `Item`, `Movement`, `MovementDetail`, and `Project` are reviewed and documented as the required offline data source set

### Requirement: Local PowerSync runtime assets are created in ops

The repository SHALL include `ops/powersync` as the local infrastructure directory for PowerSync Open Edition, containing a Docker Compose stack.

#### Scenario: Docker Compose defines minimum runtime dependencies

- **WHEN** `ops/powersync/docker-compose.yml` is opened
- **THEN** it defines a `journeyapps/powersync-service` container and a MongoDB container required for PowerSync internal state

### Requirement: Sync rules include core inventory and movement entities

The repository SHALL include `ops/powersync/powersync.yaml` defining schema and sync rules for `Item`, `Movement`, `MovementDetail`, and `Project` using a baseline global policy for authenticated users.

#### Scenario: Global authenticated sync rule is present

- **WHEN** the PowerSync config is evaluated
- **THEN** all rows for the four required entities are assigned to buckets accessible to authenticated users

### Requirement: Environment variable contract is documented for local setup

The repository SHALL include `ops/powersync/.env.example` that documents required environment variables for local execution.

#### Scenario: Required variables are discoverable

- **WHEN** a developer reads `ops/powersync/.env.example`
- **THEN** `PS_DATA_SOURCE_URI` and `PS_PORT` are clearly documented with example values

### Requirement: PowerSync capability is documented in canonical specs

The repository SHALL include a new capability spec at `openspec/specs/powersync/spec.md` describing local infrastructure setup, required files, and baseline sync-rule expectations.

#### Scenario: Capability spec exists for future change deltas

- **WHEN** contributors review architecture specs
- **THEN** they can find the PowerSync capability under `openspec/specs/powersync/spec.md` with normative requirements for local setup
