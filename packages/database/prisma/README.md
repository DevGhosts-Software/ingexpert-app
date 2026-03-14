# Prisma seed notes

`prisma/seed.ts` is data-only. It should only insert/update application data used for local development and testing.

It does **not** execute Supabase SQL files.

Supabase schema and function operations are managed from `packages/database/supabase/` via:

- `pnpm supabase:db:push`
- `pnpm supabase:functions:deploy`
- `pnpm supabase:functions:serve`
