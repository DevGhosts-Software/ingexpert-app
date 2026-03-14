## 1. Prepare profile-driven database script tooling

- [x] 1.1 Update `packages/database/package.json` to add explicit profile wrappers for Prisma commands that target `.env.development` and `.env`.
- [x] 1.2 Add or update `packages/database/package.json` dev dependencies (for example `dotenv-cli`) required to guarantee deterministic env-file injection.

## 2. Normalize Supabase target and deploy flows

- [x] 2.1 Update `packages/database/package.json` with explicit target-link scripts (`link:dev`, `link:prod`) and ensure `--workdir supabase` usage is consistent.
- [x] 2.2 Update `packages/database/package.json` deploy macros (`deploy:dev`, `deploy:prod`) to chain link, `supabase:db:push`, and `supabase:functions:deploy` in a predictable order.
- [x] 2.3 Clean up ambiguous or overlapping database scripts in `packages/database/package.json` so profile/target intent is explicit.

## 3. Validate script integrity

- [x] 3.1 Run `pnpm --filter @ingexpert/database lint` and `pnpm --filter @ingexpert/database type-check` to validate package-level script/config changes.
- [x] 3.2 Run `pnpm check` from repository root and resolve any failures related to database script/tooling changes.
