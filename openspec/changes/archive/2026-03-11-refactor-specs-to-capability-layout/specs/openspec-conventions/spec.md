## REMOVED Requirements

### Requirement: Flat spec files are the canonical layout for openspec/specs/
**Reason**: The flat layout (`openspec/specs/<name>.md`) slices the workspace horizontally by technical layer, requiring agents working on a single domain to read fragments from multiple files. The capability-based subdirectory layout (`openspec/specs/<capability>/spec.md`) co-locates all rules for a domain in one file, aligning the spec workspace with how the code is structured and how agents are tasked.
**Migration**: The five flat concern files (`api.md`, `architecture.md`, `database.md`, `frontend.md`, `schema.md`) are deleted. Their content is redistributed into `core-architecture/spec.md`, `auth/spec.md`, `inventory/spec.md`, `movements/spec.md`, and `projects/spec.md`. Update any references to the old paths.

### Requirement: Existing flat specs must not be migrated to subdirectories
**Reason**: This rule was written to protect the flat layout. The flat layout itself is now superseded.
**Migration**: No migration needed — this rule is simply removed.

## MODIFIED Requirements

### Requirement: Spec file naming and structure conventions are defined
The `openspec/specs/` directory SHALL use a capability-based subdirectory layout. Each capability has its own folder containing a `spec.md` file: `openspec/specs/<capability>/spec.md`. File names are kebab-case. Every new capability MUST be linked in the entry-point spec (`core-architecture/spec.md` domain inventory) so agents can discover it.

#### Scenario: A new cross-cutting capability spec is needed
- **WHEN** a new domain capability is introduced (via `openspec propose`)
- **THEN** a new kebab-case subdirectory is created in `openspec/specs/` and a `spec.md` is placed inside it, linked from `core-architecture/spec.md`

#### Scenario: An existing capability spec is modified
- **WHEN** an existing capability rule is changed or a new rule is added
- **THEN** the change is made directly to `openspec/specs/<capability>/spec.md` for minor edits, or via a new `openspec propose` change for significant additions

### Requirement: The openspec conventions spec is the entry point for workspace maintenance
The file `openspec/specs/openspec-conventions/spec.md` SHALL be the single place documenting how the openspec workspace is maintained. It supersedes any previous README or flat file instructions.

#### Scenario: AI agent is asked to restructure the docs
- **WHEN** an AI agent receives a request to reorganize or improve documentation
- **THEN** the agent SHALL read `openspec/specs/openspec-conventions/spec.md` before making changes to understand the intended structure

## ADDED Requirements

### Requirement: Workspace folder roles are updated for capability-based layout
The `openspec/specs/` folder SHALL contain ONLY subdirectories (`<capability>/`), each with a `spec.md`. Flat `.md` files directly under `openspec/specs/` are prohibited after this migration.

#### Scenario: Agent adds a new spec file
- **WHEN** an agent or developer needs to add a new architectural spec
- **THEN** it SHALL create `openspec/specs/<new-capability>/spec.md` — never a flat `.md` file directly under `openspec/specs/`

### Requirement: openspec/features/ directory is removed
The `openspec/features/` directory is deleted. Its intended role (feature-level documentation) is fully covered by `openspec/changes/` (active) and `openspec/changes/archive/` (historical).

#### Scenario: Agent looks for feature documentation
- **WHEN** an agent needs to understand a completed feature's rationale
- **THEN** it SHALL look in `openspec/changes/archive/` — not in a `features/` folder
