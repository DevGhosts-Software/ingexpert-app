# Supabase workspace (`@ingexpert/database`)

All Supabase project assets must live under this directory.

- `migrations/` → SQL migration/setup scripts
- `functions/` → Deno Edge Functions
- `config.toml` → Supabase CLI project config

## Current function

- `functions/admin-control/` replaces runtime `adminUsers.*` API ownership.
- Function code uses Deno runtime (`Deno.serve(...)`) and is managed by Supabase CLI.

## Operational scripts

Run from repo root:

- `pnpm supabase:start`
- `pnpm supabase:stop`
- `pnpm supabase:link -- --project-ref <project-ref>`
- `pnpm supabase:db:push`
- `pnpm supabase:functions:deploy`
- `pnpm supabase:functions:deploy:all`
- `pnpm supabase:functions:serve`
- `pnpm supabase:secrets:set`

Or directly from package:

- `pnpm --filter @ingexpert/database supabase:start`
- `pnpm --filter @ingexpert/database supabase:stop`
- `pnpm --filter @ingexpert/database supabase:link -- --project-ref <project-ref>`
- `pnpm --filter @ingexpert/database supabase:db:push`
- `pnpm --filter @ingexpert/database supabase:functions:deploy`
- `pnpm --filter @ingexpert/database supabase:functions:deploy:all`
- `pnpm --filter @ingexpert/database supabase:functions:serve`
- `pnpm --filter @ingexpert/database supabase:secrets:set`

`supabase:secrets:set` reads `supabase/.env.functions` (not committed). Copy from `supabase/.env.functions.example` and fill values before running it.

## SQL execution order

Run migrations in filename order:

1. `00_core-functions.sql`
2. `01_inventory-ledger-trigger.sql`
3. `02_powersync pubilcation.sql`
4. `03_powersync-upload-permissions.sql`
5. `04_powersync-rls.sql`
6. `05_app-data bucket policies.sql`
