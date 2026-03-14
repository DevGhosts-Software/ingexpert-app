## ADDED Requirements

### Requirement: Connector uploadData SHALL upload canonical movement entities

The PowerSync Supabase connector MUST iterate through `uploadQueue` entries and upload `movements` and `movement_details` operations to Supabase using `supabase.from(...).insert(...)` with preserved operation ordering.

#### Scenario: Queue entry for movements is uploaded

- **WHEN** `uploadQueue` contains a pending insert for `movements`
- **THEN** `uploadData` MUST call `supabase.from('movements').insert(...)`
- **THEN** the queue item MUST be marked as processed only after a successful Supabase response

#### Scenario: Queue entry for movement_details is uploaded

- **WHEN** `uploadQueue` contains a pending insert for `movement_details`
- **THEN** `uploadData` MUST call `supabase.from('movement_details').insert(...)`
- **THEN** the queue item MUST be marked as processed only after a successful Supabase response

### Requirement: Connector MUST ignore movement-originated optimistic item stock updates

The connector MUST discard or skip upload-queue `UPDATE` operations on `items` when those operations originate from movement optimistic stock adjustments, because server trigger reconciliation is authoritative.

#### Scenario: Optimistic movement-side items update is skipped

- **WHEN** `uploadQueue` contains an `UPDATE` on `items` tagged as movement-originated optimistic stock
- **THEN** `uploadData` MUST ignore the entry and MUST NOT issue `supabase.from('items').update(...)`

#### Scenario: Canonical admin item update is allowed

- **WHEN** `uploadQueue` contains an `UPDATE` on `items` originating from the explicit admin item edit flow
- **THEN** `uploadData` MUST upload the change using Supabase client calls
