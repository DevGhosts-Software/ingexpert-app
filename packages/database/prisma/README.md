# Prisma SQL setup notes

Run these SQL scripts in this order when preparing Supabase for offline inventory ledger sync:

1. `powersync pubilcation.sql`
2. `inventory-ledger-trigger.sql`

Why order matters:

- Publication setup enables replication of inventory/movement tables to PowerSync.
- Trigger setup then enforces authoritative stock reconciliation on `movement_details` (`INSERT`, `UPDATE`, `DELETE`) so `items.stock` converges to ledger truth.
