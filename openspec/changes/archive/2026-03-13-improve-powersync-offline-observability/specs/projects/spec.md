## ADDED Requirements

### Requirement: Projects list SHALL be readable from local PowerSync state

Project-facing screens used in dashboard workflows MUST support loading from local PowerSync SQLite data so project information remains available without internet access.

#### Scenario: Projects page loads while offline

- **WHEN** the user opens the projects dashboard page without network connectivity
- **THEN** the page MUST read project rows from local `projects` table via PowerSync query
- **THEN** previously synchronized projects MUST render without requiring a live tRPC request

#### Scenario: Local project list supports UI filtering/sorting

- **WHEN** the user applies search, sorting, or pagination controls on projects page
- **THEN** the UI MUST apply those controls against local query results consistently while offline
