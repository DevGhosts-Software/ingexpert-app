## ADDED Requirements

### Requirement: Endpoint retention matrix SHALL define removal eligibility

The audit process MUST maintain an endpoint retention matrix that marks each procedure as `retain` or `remove-ready` with explicit evidence.

#### Scenario: Procedure is reviewed for deletion

- **WHEN** maintainers evaluate an API procedure for removal
- **THEN** the matrix MUST include current frontend usage status and local replacement status
- **THEN** deletion MUST remain blocked until the procedure is marked `remove-ready`

### Requirement: Removal-ready procedures SHALL be backed by zero-usage proof

Any procedure marked `remove-ready` MUST have verified zero active frontend call sites and no active runtime fallback path.

#### Scenario: Team marks read procedure as remove-ready

- **WHEN** a read procedure is proposed as removable
- **THEN** repository scan evidence MUST show no active `trpc.<procedure>` usage in frontend runtime paths
- **THEN** fallback branch evidence MUST show no runtime API fallback remains for that behavior
