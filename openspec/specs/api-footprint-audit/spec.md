## ADDED Requirements

### Requirement: Phase-2 audit SHALL classify auth and non-admin endpoints for retirement

The API footprint audit MUST include explicit classification for remaining auth and non-admin endpoints as `retain`, `remove-ready`, or `remove-after-cutover`.

#### Scenario: Phase-2 cutdown inventory is generated

- **WHEN** maintainers run the phase-2 audit
- **THEN** auth/session and non-admin endpoint candidates MUST be explicitly tagged for migration state
- **THEN** admin-management endpoints MUST be explicitly tagged as retained for this phase

### Requirement: Endpoint retirement SHALL require active-usage verification

Any endpoint proposed for removal in phase-2 MUST have verified zero active runtime frontend dependency at removal time.

#### Scenario: Endpoint reaches remove-ready state

- **WHEN** a candidate endpoint is marked remove-ready
- **THEN** call-site evidence MUST show no active runtime usage in frontend application paths
- **THEN** retirement MUST be blocked if active usage still exists

### Requirement: Final retirement set MUST have zero frontend runtime usage evidence

The final retirement set (`users.me`, `users.updateMe`, `users.updateMyPassword`, `projects.create`, `projects.update`, `projects.remove`, `items.remove`, `kits.setComponents`, `kits.clearKit`) MUST be backed by repository evidence showing no active runtime call-sites.

#### Scenario: Retirement evidence is generated

- **WHEN** maintainers mark the final endpoint set as remove-ready
- **THEN** repository scans MUST show zero active `trpc.*` runtime usage for each listed procedure
- **THEN** all replacements MUST map to local-write/Supabase-authorized paths in the matrix artifact
