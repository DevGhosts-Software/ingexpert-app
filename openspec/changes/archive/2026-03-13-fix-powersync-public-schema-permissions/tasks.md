## 1. Supabase Permission Remediation Script

- [x] 1.1 Add `packages/database/prisma/powersync-upload-permissions.sql` with idempotent grants for schema `public` and required upload tables (`movements`, `movement_details`, and other connector-uploaded tables as applicable).
- [x] 1.2 Include RLS policy checks/creation logic in `packages/database/prisma/powersync-upload-permissions.sql` for roles used by PowerSync client uploads.
- [x] 1.3 Add inline verification queries in `packages/database/prisma/powersync-upload-permissions.sql` (or paired DB setup note) to validate grants/policies before runtime.

## 2. Connector Diagnostics

- [x] 2.1 Update `apps/frontend/src/lib/powersync/connector.ts` to classify permission-denied database errors and append actionable remediation guidance referencing the SQL script.
- [x] 2.2 Ensure connector diagnostics remain explicit (no silent fallback) and preserve current queue defer/retry semantics.

## 3. Operational Documentation

- [x] 3.1 Update existing DB/PowerSync setup documentation in `packages/database/prisma/README` or current team setup notes with script apply instructions and verification steps.
- [x] 3.2 Document minimum required Supabase roles/privileges for PowerSync uploads and failure symptoms (including `permission denied for schema public`).

## 4. Validation

- [x] 4.1 Run `pnpm check` at repository root and address any regressions introduced by connector/docs/script updates.
- [x] 4.2 Run `pnpm format` at repository root.
