# `@ingexpert/database` Commands

Simple guide for day-to-day usage of database scripts.

## 1) Prisma with explicit env profile

Use these when you want full control of `.env.development` vs `.env`.

- Dev profile (`.env.development`)
  - `pnpm db:generate:dev`
  - `pnpm db:migrate:dev`
  - `pnpm db:push:dev`
  - `pnpm db:reset:dev`
  - `pnpm db:studio:dev`
- Prod profile (`.env`)
  - `pnpm db:generate:prod`
  - `pnpm db:migrate:prod`
  - `pnpm db:push:prod`
  - `pnpm db:reset:prod`
  - `pnpm db:studio:prod`

Convenience defaults (currently point to dev):

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:push`
- `pnpm db:reset`
- `pnpm db:studio`

## 2) Supabase target selection

Link is manual/interactive:

- `pnpm supabase:link`

This opens Supabase CLI project selection (or you can pass flags manually).

## 3) Supabase deploy flow

- `pnpm supabase:deploy`

This command does:

1. `supabase link` (you choose/select target manually)
2. `supabase db push`
3. `supabase functions deploy`

## 4) Common safe workflow

1. `pnpm supabase:link`
2. Make SQL/function changes
3. `pnpm supabase:deploy`
4. If needed, relink and repeat for another project

## 5) Validation commands

- `pnpm lint`
- `pnpm type-check`

From repo root:

- `pnpm --filter @ingexpert/database lint`
- `pnpm --filter @ingexpert/database type-check`
