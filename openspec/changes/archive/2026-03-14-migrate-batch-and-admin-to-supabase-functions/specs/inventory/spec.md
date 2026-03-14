## ADDED Requirements

### Requirement: Batch import flows SHALL execute through local SQLite writes

Item and kit batch import runtime flows MUST execute through local SQLite write transactions and synchronize via PowerSync upload replay instead of API batch import procedures.

#### Scenario: Item batch import is submitted

- **WHEN** a user submits an item batch import
- **THEN** the frontend MUST persist the batch through local SQLite writes
- **THEN** no runtime request to `trpc.items.createBatch` or `trpc.items.importMany` may execute

#### Scenario: Kit batch import is submitted

- **WHEN** a user submits a kit/components batch import
- **THEN** the frontend MUST persist the batch through local SQLite writes compatible with existing kit and `kit_details` sync behavior
- **THEN** no runtime request to `trpc.kits.importMany` may execute
