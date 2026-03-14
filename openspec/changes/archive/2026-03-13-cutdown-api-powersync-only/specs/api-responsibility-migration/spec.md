## ADDED Requirements

### Requirement: Finalized cutover SHALL remove runtime read fallbacks

After a read procedure is accepted as migrated, the frontend MUST remove runtime API fallback branches for that procedure and operate local-first only.

#### Scenario: Read cutover is finalized

- **WHEN** parity acceptance is complete for a migrated read procedure
- **THEN** runtime flags/branches that switch that read back to API MUST be removed from active frontend code
- **THEN** the local PowerSync/SQLite path MUST be the only supported runtime path for that read

### Requirement: Cutdown completion SHALL retire migrated API read procedures

When a procedure is finalized as local-first and no longer consumed, the corresponding API read procedure MUST be removed from router/service layers.

#### Scenario: Procedure is approved for retirement

- **WHEN** a procedure is marked remove-ready by the retention matrix
- **THEN** maintainers MUST delete the router procedure and tightly-coupled service logic
- **THEN** OpenAPI output MUST no longer expose the retired operation

## REMOVED Requirements

### Requirement: Per-procedure rollback SHALL be immediately available

**Reason**: The finalized cutdown model removes runtime fallback controls for migrated reads and replaces them with release-level rollback.
**Migration**: Use controlled revert/redeploy rollback playbooks instead of per-procedure runtime fallback toggles.
