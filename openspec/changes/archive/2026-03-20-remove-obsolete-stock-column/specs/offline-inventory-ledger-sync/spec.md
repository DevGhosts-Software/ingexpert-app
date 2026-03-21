## REMOVED Requirements

### Requirement: Movement detail trigger SHALL reconcile item stock on all row changes

**Reason:** Stock is now calculated on-the-fly from movements ledger. The trigger-based approach is deprecated in favor of derived SQL views.

**Migration:** Remove the trigger migration file and apply revert migration to drop the trigger function and stock column.

### Requirement: Trigger-based stock reconciliation MUST be authoritative

**Reason:** No persisted stock column exists to reconcile. Stock values are derived at query time.

**Migration:** Remove optimistic stock filtering from PowerSync connector (no longer needed).

### Requirement: Item model SHALL include stock field for trigger reconciliation

**Reason:** The Prisma Item model no longer includes a stock field. Stock is derived from movement calculations.

**Migration:** Remove stock field from all schemas and frontend code.
