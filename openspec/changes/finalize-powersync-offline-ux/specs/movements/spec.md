## ADDED Requirements

### Requirement: Movement reads SHALL render from local PowerSync data first

Movement list and detail/open experiences MUST render from local PowerSync SQL-backed data without blocking on online tRPC reads.

#### Scenario: Movement list opens without remote wait

- **WHEN** the movements screen initializes with synchronized local records available
- **THEN** the list MUST render from local SQLite data immediately
- **THEN** any remote refresh must occur in background without blocking initial render

#### Scenario: Movement detail opens instantly from local row

- **WHEN** a user opens a movement detail that exists locally
- **THEN** detail data MUST load from local tables without awaiting tRPC
- **THEN** the UI MUST avoid server-wait loading states for primary detail content

### Requirement: Movement read/write flow MUST avoid residual tRPC blocking

Movement-related user flows MUST remove residual awaited tRPC dependencies that delay local-first UX.

#### Scenario: Local-first movement workflows under unstable network

- **WHEN** network latency is high or connectivity is intermittent
- **THEN** movement open/list/save interactions MUST remain responsive based on local state
- **THEN** connector upload/reconciliation MUST run asynchronously with explicit pending/error status
