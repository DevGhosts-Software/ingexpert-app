## Why

`packages/database` currently mixes Prisma and Supabase CLI workflows without explicit environment-profile controls, which makes it easy to run commands against the wrong database. A standardized profile-driven script model is needed now to support safe day-to-day local development and production operations.

## What Changes

- Add profile-aware script conventions for `packages/database` to explicitly select `.env` or `.env.development` when running Prisma commands.
- Introduce clear Supabase targeting workflow scripts (`link`, `db push`, function deploy, deploy macros) that separate environment selection from execution.
- Clean up/normalize database package scripts so Prisma and Supabase responsibilities are explicit and predictable.
- Define guardrails for safe operator workflow (switch target, deploy, return to dev target) without manual env file renaming.

## Capabilities

### New Capabilities

- `database-env-profile-control`: Standardized environment-profile execution model for Prisma and Supabase workflows in `packages/database`.

### Modified Capabilities

- None.

## Impact

- `packages/database/package.json` scripts and related local operational docs/conventions.
- Possible addition of lightweight tooling dependency for env injection (for example `dotenv-cli`) in `packages/database`.
- No new API routes or OpenAPI contract changes.
- No Prisma schema model changes required.
