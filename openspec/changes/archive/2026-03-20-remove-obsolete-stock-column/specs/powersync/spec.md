## MODIFIED Requirements

### Requirement: Frontend SDK Integration

The frontend SHALL define `apps/frontend/src/lib/powersync/schema.ts` with `AppSchema` including:

- `items`
- `kit_details`
- `movements`
- `movement_details`
- `projects`
- `staff`
- `users`
- `work_areas`

The schema contract MUST remain aligned with Prisma-backed entity fields for those tables.

The `items` table schema MUST NOT include a `stock` column—stock is now derived from movements ledger at query time.

#### Scenario: Items schema has no stock column

- **WHEN** the PowerSync schema defines the `items` table
- **THEN** the schema MUST NOT include a `stock` field
- **THEN** stock values MUST be computed from movement_details aggregation

## REMOVED Requirements

### Requirement: Connector MUST ignore movement-originated optimistic item stock updates

**Reason:** With no persisted stock column, there are no optimistic stock updates to filter.

**Migration:** Remove `MOVEMENT_OPTIMISTIC_SOURCE` constant and filtering logic from connector.ts.
