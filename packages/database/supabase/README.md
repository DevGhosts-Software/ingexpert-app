# Supabase workspace (`@ingexpert/database`)

All Supabase project assets must live under this directory.

- `migrations/` → SQL migration/setup scripts
- `functions/` → Deno Edge Functions
- `config.toml` → Supabase CLI project config

## Current function

- `functions/admin-control/` replaces runtime `adminUsers.*` API ownership.

## SQL execution order

Run migrations in filename order:

1. `00_core-functions.sql`
2. `01_inventory-ledger-trigger.sql`
3. `02_powersync pubilcation.sql`
4. `03_powersync-upload-permissions.sql`
5. `04_powersync-rls.sql`
6. `05_app-data bucket policies.sql`
