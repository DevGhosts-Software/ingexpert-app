## ADDED Requirements

### Requirement: Workspace folder roles are documented
The `openspec/` workspace SHALL have a clear written description of the role of each top-level folder so that both humans and AI agents know where to place new documentation without guessing.

#### Scenario: Agent needs to add a new architectural decision
- **WHEN** an agent or developer makes a significant architectural decision
- **THEN** they SHALL create a new file in `openspec/decisions/` following the ADR template in `decisions/README.md`

#### Scenario: Agent needs to document a new feature under development
- **WHEN** a new domain feature is being proposed or implemented
- **THEN** the proposal artifact lives under `openspec/changes/<name>/` (managed by openspec CLI), and completed specs are archived to `openspec/archive/`

#### Scenario: Agent needs to add a foundational architectural rule
- **WHEN** a rule applies to the whole codebase (not a single feature)
- **THEN** the rule SHALL be added to the most relevant flat spec file in `openspec/specs/` (e.g., `api.md`, `frontend.md`, `schema.md`, `database.md`)

### Requirement: Spec file naming and structure conventions are defined
The flat spec files in `openspec/specs/` SHALL follow a defined naming and structure convention so the workspace stays internally consistent.

#### Scenario: A new satellite spec is needed for a new cross-cutting concern
- **WHEN** a cross-cutting architectural concern has grown large enough to warrant its own file
- **THEN** a new kebab-case `.md` file is added to `openspec/specs/` and linked in the Satellite Specs table in `architecture.md`

#### Scenario: An existing spec is modified
- **WHEN** an existing spec rule is changed or a new rule is added directly
- **THEN** the change is committed with a note in the PR describing what was updated and why

### Requirement: The openspec conventions spec is the entry point for workspace maintenance
The file `openspec/specs/openspec-conventions.md` SHALL be the single place documenting how the openspec workspace is maintained, superseding any ad-hoc instructions scattered across README files.

#### Scenario: AI agent is asked to restructure the docs
- **WHEN** an AI agent receives a request to reorganize or improve documentation
- **THEN** the agent SHALL read `openspec/specs/openspec-conventions.md` before making changes to understand the intended structure

### Requirement: ADR naming and template are enforced
Architecture Decision Records SHALL follow the naming pattern `ADR-[NNN]-[short-title].md` and the template defined in `decisions/README.md`.

#### Scenario: New ADR is created
- **WHEN** an ADR is added to `openspec/decisions/`
- **THEN** it MUST include Status, Context, Decision, and Consequences sections

#### Scenario: A previous decision is revisited
- **WHEN** an existing ADR is superseded by a new decision
- **THEN** the old ADR's Status field SHALL be updated to `Superseded by ADR-XXX` and a new ADR SHALL be created for the new decision
