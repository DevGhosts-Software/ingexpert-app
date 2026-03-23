# movement-filtering Specification

## Purpose
TBD - created by archiving change fix-mvp-table-display-issues. Update Purpose after archive.
## Requirements
### Requirement: Date range filter SHALL use UTC-aware bounds

The date range filter for movements SHALL convert local date selections to UTC bounds before querying Supabase, ensuring all records from the selected day are included regardless of timezone offset between local UI and UTC storage.

#### Scenario: Date filter from date includes all records from that day

- **WHEN** a user sets dateFrom to "15/03/2026" in local timezone (e.g., ART -3)
- **THEN** the query SHALL filter for records with UTC date >= "2026-03-15T00:00:00Z"

#### Scenario: Date filter to date includes all records from that day

- **WHEN** a user sets dateTo to "15/03/2026" in local timezone (e.g., ART -3)
- **THEN** the query SHALL filter for records with UTC date <= "2026-03-15T23:59:59.999Z"

#### Scenario: Date filter uses same conversion as UI display

- **WHEN** a movement date is stored as "2026-03-15T22:00:00Z" (UTC)
- **THEN** the UI displays it as "16/03/2026 01:00" (ART, UTC-3)
- **THEN** if user filters for "16/03/2026", the movement SHALL be included in results

