## ADDED Requirements

### Requirement: Inventory reads SHALL use PowerSync SQL subscriptions

Inventory-facing frontend screens MUST replace tRPC read hooks with PowerSync `useQuery` SQL reads against local SQLite tables synchronized by PowerSync.

#### Scenario: Inventory list loads from local SQLite

- **WHEN** the inventory list screen initializes
- **THEN** it MUST execute a PowerSync `useQuery` statement instead of `trpc.inventory.*.useQuery`
- **THEN** it MUST render data from the local SQLite result set without requiring network availability

### Requirement: Inventory SQL projections MUST preserve frontend entity shape

Inventory SQL queries MUST project snake_case database columns using the camelCase aliases defined by PowerSync sync rules.

#### Scenario: Aliases are mapped in query projection

- **WHEN** inventory rows are selected from local SQLite
- **THEN** fields such as `image_url` MUST be selected as `image_url AS "imageUrl"`
- **THEN** fields such as `created_by_id` MUST be selected as `created_by_id AS "createdById"`

### Requirement: Local-first writes SHALL remove blocking write spinners

Inventory/movement write interactions that execute fully in local SQLite MUST not block user flow on network round-trips.

#### Scenario: Movement save no longer shows server-wait spinner

- **WHEN** the user submits a movement and local DB writes succeed
- **THEN** the UI MUST reflect success and updated stock immediately
- **THEN** legacy loading spinners tied to remote mutation completion MUST be removed
