## ADDED Requirements

### Requirement: Item delete and kit component writes SHALL not depend on API mutations

Inventory mutation paths for item delete and kit component edits MUST execute through local PowerSync write transactions governed by Supabase RLS, and replay through connector upload handlers that support every emitted `kit_details` CRUD operation.

#### Scenario: User deletes an item

- **WHEN** an item delete action is confirmed in UI
- **THEN** the item removal MUST be persisted through local-write + sync path
- **THEN** no runtime request to `trpc.items.remove` may execute

#### Scenario: User edits kit components

- **WHEN** kit component assignments are saved or cleared
- **THEN** writes to `kit_details` MUST execute through local-write + sync path under RLS
- **THEN** no runtime requests to `trpc.kits.setComponents` or `trpc.kits.clearKit` may execute

#### Scenario: Kit detail sync replay succeeds

- **WHEN** local kit component edits emit `kit_details` CRUD entries for upload replay
- **THEN** connector upload processing MUST handle those entries without throwing unsupported-table errors
- **THEN** the remote `kit_details` state MUST converge with the local transaction result
