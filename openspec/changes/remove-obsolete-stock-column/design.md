## Context

Ingexpert previously used a `items.stock` column maintained by PostgreSQL triggers. The system now calculates stock on-the-fly from the `movements` ledger using SQL queries. This eliminates:

- Denormalized stock state that can drift from actual movement records
- Complex trigger logic for INSERT/UPDATE/DELETE reconciliation
- Optimistic stock updates in the frontend that must be filtered from sync

The trigger migration(`20240101000001_inventory-ledger-trigger.sql`) still exists and updates a non-existent column. The PowerSync local schema still references `stock`. Frontend forms still write stock values.

## Goals / Non-Goals

**Goals:**

- Remove obsolete trigger migration and provide revert SQL for existing deployments
- Remove stock column references from PowerSync schema
- Remove stock field from Zod schema definitions
- Remove optimistic stock UPDATE logic from movement and inventory forms
- Update/remove obsolete spec requirements

**Non-Goals:**

- This change does NOT add new stock calculation views or queries—those already exist
- No changes to movement creation flow beyond removing stock adjustments

## Decisions

### Decision 1: Delete vs Revert Trigger Migration

**Choice:** Provide a revert migration SQL and delete the trigger file.

**Rationale:** Existing deployments may have the trigger function installed. A revert migration ensures clean state. The file can be deleted since it's no longer needed for new deployments.

**Alternative considered:** Keep the file but mark as deprecated. Rejected—adds maintenance burden for code that serves no purpose.

### Decision 2: Spec Modification Approach

**Choice:** Mark `offline-inventory-ledger-sync` spec as obsolete rather than delete.

**Rationale:** The spec documents an architectural pattern that was implemented and then superseded. Preserving the file with an "obsolete" header provides historical context and prevents confusion if someone searches for the trigger logic.

**Alternative considered:** Delete the spec entirely. Rejected—loses context for future maintainers.

### Decision 3: PowerSync Schema Column Removal

**Choice:** Remove `stock` column from local PowerSync schema entirely.

**Rationale:** The server-side `items` table no longer has a stock column (per Prisma schema). Keeping it in local schema would cause sync errors.

## Risks / Trade-offs

| Risk                                                     | Mitigation                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| Existing deployments may have residual stock column data | Revert migration includes `ALTER TABLE items DROP COLUMN IF EXISTS stock` |
| Frontend code may have stock-related display logic       | Grep for stock references; remove or replace with derived queries         |
| Offline-only code may expect stock field                 | Verify all stock reads use derived queries, not direct column access      |

## Migration Plan

1. **Revert migration:** Create `20240101000006_revert-stock-trigger.sql` that:
   - Drops the trigger if exists
   - Drops the trigger function if exists
   - Drops the stock column from items if exists

2. **Code cleanup:** Remove stock references from:
   - PowerSync schema
   - Zod schemas
   - Frontend forms

3. **Spec cleanup:** Mark `offline-inventory-ledger-sync` as obsolete
