## ADDED Requirements

### Requirement: Inventory local-computable reads SHALL run without runtime API fallback

Inventory reads already accepted for local-first execution MUST use PowerSync/SQLite as the only runtime read source.

#### Scenario: Kit component composition is requested

- **WHEN** the UI requests kit component data for an existing kit
- **THEN** the client MUST resolve data from local synchronized tables
- **THEN** no runtime API fallback branch may execute for this read path

### Requirement: Inventory dashboard aggregates SHALL be computed locally after cutover

Lightweight inventory card metrics in dashboard and inventory surfaces MUST be derived locally once parity acceptance has been completed.

#### Scenario: Inventory cards render after migration finalization

- **WHEN** the dashboard or inventory cards request aggregate counts
- **THEN** totals MUST be computed from local SQLite synchronized data
- **THEN** removed API aggregate endpoints MUST not be called

## REMOVED Requirements

### Requirement: Inventory local-computable reads SHALL use local-first with API fallback control

**Reason**: Finalized migration policy removes runtime fallback controls for approved local-first inventory reads.
**Migration**: Replace fallback-enabled read hooks with local-only PowerSync/SQLite hooks and delete fallback branches.

### Requirement: Inventory read candidates SHALL cut over to local-first execution

**Reason**: Candidate-stage behavior is superseded by finalized cutover behavior in this change.
**Migration**: Keep only finalized local-only requirements and retire transitional fallback language.
