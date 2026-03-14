## ADDED Requirements

### Requirement: PowerSync final-run audit MUST remove online blockers from local-first flows

The system MUST audit auth, inventory, and movements local-first flows and remove blocking dependencies on online tRPC responses for primary UX completion.

#### Scenario: Audit identifies blocking network waits

- **WHEN** the final-run audit inspects local-first paths
- **THEN** each path MUST identify whether any `await` or loading state depends on remote tRPC completion
- **THEN** each identified blocker MUST be either removed or justified as non-blocking to core local UX

#### Scenario: Audit confirms local-first completion behavior

- **WHEN** the audited flows are executed offline or under unstable network
- **THEN** user actions MUST complete from local SQLite state transitions
- **THEN** remote synchronization MUST proceed asynchronously without preventing success feedback

### Requirement: PowerSync debug surface SHALL be right-aligned

The PowerSync debug component MUST render on the right side of the application layout.

#### Scenario: Debug surface no longer occupies left rail

- **WHEN** the user opens a screen with the debug component enabled
- **THEN** the debug component MUST appear on the right side
- **THEN** left-side primary navigation and content affordances MUST remain unobstructed
