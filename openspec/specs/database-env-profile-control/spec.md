## ADDED Requirements

### Requirement: Prisma commands MUST support explicit env-profile selection

The system MUST provide script entry points in `packages/database/package.json` that execute Prisma commands with deterministic env-file selection for development and production profiles, without renaming env files.

#### Scenario: Development Prisma command uses development env file

- **WHEN** a maintainer runs a development-profile Prisma script
- **THEN** Prisma MUST resolve `DATABASE_URL` from `.env.development`

#### Scenario: Production Prisma command uses production env file

- **WHEN** a maintainer runs a production-profile Prisma script
- **THEN** Prisma MUST resolve `DATABASE_URL` from `.env`

### Requirement: Supabase deploy flow MUST separate target selection from execution

The system MUST define explicit Supabase target-link scripts and deploy macros so maintainers can choose dev/prod target deliberately before running SQL/function deployment commands.

#### Scenario: Dev deployment flow is executed

- **WHEN** a maintainer runs the development deploy macro
- **THEN** the workflow MUST link to the dev Supabase project before push/deploy commands execute

#### Scenario: Prod deployment flow is executed

- **WHEN** a maintainer runs the production deploy macro
- **THEN** the workflow MUST link to the prod Supabase project before push/deploy commands execute

### Requirement: Database scripts MUST be normalized for safe daily operations

`packages/database/package.json` MUST expose a clear and consistent script taxonomy that distinguishes Prisma profile wrappers, Supabase target commands, and deploy macros.

#### Scenario: Script set is audited after implementation

- **WHEN** maintainers review database scripts for operator usability
- **THEN** script names MUST clearly indicate profile or target intent (`dev`/`prod`)
- **THEN** legacy ambiguous scripts that encourage accidental cross-environment execution MUST be removed or superseded by explicit alternatives
