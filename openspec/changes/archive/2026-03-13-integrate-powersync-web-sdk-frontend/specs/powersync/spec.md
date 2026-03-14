## ADDED Requirements

### Requirement: Frontend PowerSync dependencies are declared

The frontend workspace SHALL declare `@journeyapps/powersync-sdk-web`, `@powersync/react`, `kysely`, and `@journeyapps/wa-sqlite` as dependencies required for local PowerSync runtime and SQLite-backed offline persistence.

#### Scenario: Required SDK packages are discoverable

- **WHEN** contributors inspect `apps/frontend/package.json`
- **THEN** all four required dependencies are present and versioned for the frontend app

### Requirement: Client PowerSync schema mirrors backend publication entities

The frontend SHALL define `src/lib/powersync/schema.ts` with an `AppSchema` that includes `Item`, `Movement`, `MovementDetail`, and `Project` tables aligned with backend Prisma-backed data contracts.

#### Scenario: AppSchema includes required domain tables

- **WHEN** `src/lib/powersync/schema.ts` is reviewed
- **THEN** it exports a schema contract containing `Item`, `Movement`, `MovementDetail`, and `Project` with field definitions consistent with backend entity shapes

### Requirement: Connector authenticates with Supabase session credentials

The frontend SHALL implement `src/lib/powersync/connector.ts` with `PowerSyncBackendConnector` that retrieves Supabase Auth session tokens for PowerSync credential exchange.

#### Scenario: Credential acquisition uses active user session

- **WHEN** the connector requests backend credentials
- **THEN** it reads the current Supabase session token and supplies it to the PowerSync auth flow instead of using static credentials

### Requirement: Connector upload interception is prepared for existing backend contracts

`PowerSyncBackendConnector.uploadData` MUST provide an explicit mutation interception boundary prepared to route local writes to existing NestJS tRPC/OpenAPI-backed endpoints for items, movements, and projects.

#### Scenario: Upload path references existing contract families

- **WHEN** local mutation upload handling is implemented
- **THEN** the connector routes are structured against current contract families (`/items`, `/movements`, `/projects`) without introducing new API surface in this change

### Requirement: Frontend database initialization uses WASM/OPFS adapter

The frontend SHALL provide `src/lib/powersync/db.ts` that initializes a shared `PowerSyncDatabase` instance using the WASM SQLite runtime and OPFS-capable persistence adapter.

#### Scenario: Database bootstrap selects persistent local storage

- **WHEN** the PowerSync DB is initialized
- **THEN** the configuration uses the wa-sqlite/OPFS adapter path so local synchronized data persists across app sessions

### Requirement: App-level provider exposes PowerSync runtime

The frontend SHALL include a `PowerSyncProvider` component and wire it into the Next.js application provider tree so offline-reactive features can access the shared PowerSync database lifecycle.

#### Scenario: App router tree is wrapped by PowerSync provider

- **WHEN** the root provider composition is rendered
- **THEN** the PowerSync provider initializes once and makes the PowerSync context available to descendant components

### Requirement: Canonical PowerSync capability spec documents frontend runtime architecture

`openspec/specs/powersync/spec.md` SHALL document frontend PowerSync client architecture, including schema location, connector responsibilities, database bootstrap strategy, and provider integration.

#### Scenario: Contributors can follow frontend integration contract

- **WHEN** contributors read `openspec/specs/powersync/spec.md`
- **THEN** they find normative requirements for frontend SDK integration that align with local infrastructure and backend contract boundaries
