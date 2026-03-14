## MODIFIED Requirements

### Requirement: Topbar MUST display last successful sync reference

The frontend MUST show a last successful sync reference in the status area so users can evaluate the freshness of visible data, and it MUST expose sync detail fields through a structured shadcn/Radix hover surface instead of relying on the browser-native `title` tooltip.

#### Scenario: Last sync exists

- **WHEN** at least one successful sync has completed
- **THEN** the topbar status MUST display the last sync timestamp/reference

#### Scenario: Last sync is not yet available

- **WHEN** no successful sync has occurred in the session
- **THEN** the topbar status MUST display a clear “no sync yet” fallback state

#### Scenario: Sync details are shown via structured hover surface

- **WHEN** a user hovers or focuses the sync status indicator in the topbar
- **THEN** the UI MUST show structured detail content (status, last successful sync reference, and pending uploads) using a shadcn/Radix-based component
- **THEN** the implementation MUST NOT rely on a multiline browser-native `title` tooltip as the primary detail surface
