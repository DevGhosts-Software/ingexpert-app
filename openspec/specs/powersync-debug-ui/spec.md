# PowerSync Debug UI Spec — Ingexpert

## Requirement: PowerSync debug panel uses supported SDK APIs

The frontend SHALL implement the PowerSync debug panel with currently supported `@powersync/react` APIs and SHALL NOT call unsupported listener/status methods.

#### Scenario: Panel renders with live sync status

- **WHEN** the application runs with PowerSync provider initialized
- **THEN** the panel reads connection/sync state through supported hooks and displays current values without runtime errors

#### Scenario: Panel renders local table diagnostics reactively

- **WHEN** local SQLite data changes for tracked tables
- **THEN** the panel updates tracked counters using reactive query hooks without manual polling loops

## Requirement: PowerSync debug panel is globally visible for debugging

The frontend SHALL mount the PowerSync debug panel in a global UI location that remains visible across routes while the PowerSync provider context is active.

#### Scenario: Route changes preserve debug visibility

- **WHEN** a user navigates between frontend routes during a debug session
- **THEN** the debug panel remains available and continues reporting current status

## Requirement: PowerSync debug panel is gated for safe environments

The frontend SHALL gate debug panel rendering to approved debug contexts (for example development and/or explicit environment flag).

#### Scenario: Production-safe default

- **WHEN** the app runs outside approved debug context
- **THEN** the debug panel is not rendered
