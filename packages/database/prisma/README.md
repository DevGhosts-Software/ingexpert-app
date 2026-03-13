# Prisma SQL setup notes

Run these SQL scripts in this order when preparing Supabase for offline inventory ledger sync:

1. `powersync pubilcation.sql`
2. `inventory-ledger-trigger.sql`
3. `powersync-upload-permissions.sql`

Why order matters:

- Publication setup enables replication of inventory/movement tables to PowerSync.
- Trigger setup then enforces authoritative stock reconciliation on `movement_details` (`INSERT`, `UPDATE`, `DELETE`) so `items.stock` converges to ledger truth.
- Upload permission setup grants `authenticated` role access required by PowerSync connector writes and aligns RLS policies for movement inserts.

## PowerSync upload permission remediation

If debug output shows errors like:

- `permission denied for schema public`
- `permission denied for table movements`
- `duplicate key value violates unique constraint "movements_pkey"`
- `new row violates row-level security policy for table "movements"`

apply `powersync-upload-permissions.sql` in Supabase SQL Editor.

For duplicate-key movement errors, this usually means the row already exists in cloud and the local queue replayed the same ID after a prior partial upload. The connector now uses idempotent create writes (`upsert` with conflict handling) so replayed IDs can converge without manual cleanup.

If you started seeing RLS errors right after running the remediation script and your project previously worked without RLS, you likely enabled RLS unintentionally. Recover with:

```sql
ALTER TABLE public.movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_details DISABLE ROW LEVEL SECURITY;
```

Then retry upload.

The script is idempotent and includes:

- `USAGE` grant on schema `public` for role `authenticated`
- table write grants for `movements`, `movement_details`, `items`, `projects`
- sequence grants in `public`
- guarded RLS insert policies for `movements` and `movement_details`
- verification queries (commented) to confirm grants/policies

Minimum role/privilege expectation for client uploads:

- role: `authenticated`
- schema privilege: `USAGE` on `public`
- table privileges:
  - `movements`: `SELECT`, `INSERT`, `UPDATE`
  - `movement_details`: `SELECT`, `INSERT`, `UPDATE`
  - `items`: `SELECT`, `INSERT`, `UPDATE`
  - `projects`: `SELECT`, `INSERT`, `UPDATE`
