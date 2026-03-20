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
- `pnpm supabase:secrets:set -- --env-file packages/database/supabase/.env.local`

Or directly from package:

- `pnpm --filter @ingexpert/database supabase:start`
- `pnpm --filter @ingexpert/database supabase:stop`
- `pnpm --filter @ingexpert/database supabase:link -- --project-ref <project-ref>`
- `pnpm --filter @ingexpert/database supabase:db:push`
- `pnpm --filter @ingexpert/database supabase:functions:deploy`
- `pnpm --filter @ingexpert/database supabase:functions:deploy:all`
- `pnpm --filter @ingexpert/database supabase:functions:serve`
- `pnpm --filter @ingexpert/database supabase:secrets:set -- --env-file supabase/.env.local`

You can also set secrets inline, for example:

- `pnpm supabase:secrets:set -- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`

## SQL execution order

Migration files use ISO timestamp prefixes (YYYYMMDDHHMMSS) for proper Supabase CLI change detection. Run migrations in filename order:

1. `20240101000000_core-functions.sql`
2. `20240101000001_inventory-ledger-trigger.sql`
3. `20240101000002_powersync-publication.sql`
4. `20240101000003_powersync-upload-permissions.sql`
5. `20240101000004_powersync-rls.sql`
6. `20240101000005_app-data-bucket-policies.sql`

**Note:** When creating new migrations, use `supabase migration new <name>` to generate files with proper timestamp prefixes.
