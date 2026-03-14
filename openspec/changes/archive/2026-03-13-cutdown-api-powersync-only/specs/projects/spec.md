## ADDED Requirements

### Requirement: Project form dependencies SHALL use local-only synchronized reads after cutover

Project create/edit forms MUST resolve manager selection from synchronized local user rows once migration is finalized, without runtime API fallback branches.

#### Scenario: Project form opens in finalized migration mode

- **WHEN** a user opens project create/edit form
- **THEN** manager options MUST load from local synchronized data
- **THEN** no runtime `users.listNames` API fallback branch may execute

### Requirement: Project migrated read paths SHALL be local-only at runtime

Project list and stats reads that have passed migration acceptance MUST run from local data only.

#### Scenario: Projects dashboard cards and lists render

- **WHEN** projects list or stats data is requested in migrated flows
- **THEN** values MUST come from local synchronized data with parity-preserved semantics
- **THEN** retired project read/stats API endpoints MUST not be called

## REMOVED Requirements

### Requirement: Project form dependencies SHALL support local-first reads

**Reason**: Transitional fallback wording is replaced by finalized local-only runtime behavior.
**Migration**: Remove fallback-enabled dependency loaders and keep local synchronized manager-source path.

### Requirement: Project read migration SHALL keep UX parity

**Reason**: Candidate-stage requirement is superseded by finalized local-only runtime requirement.
**Migration**: Preserve parity guarantees while deleting runtime fallback behavior and obsolete API read usage.
