## Why

PowerSync uploads are currently failing with `permission denied for schema public` when inserting `movements`, which blocks offline queue convergence. We need an explicit, repeatable Supabase privilege setup so client-side upload operations can write required tables safely.

## What Changes

- Add an idempotent SQL remediation script for Supabase/PostgreSQL privileges and RLS compatibility required by PowerSync uploads.
- Define operator run steps for applying/verifying grants and policies in local/dev/prod Supabase environments.
- Strengthen connector-side error guidance for permission failures so operators can quickly identify missing grants/policies.
- Keep API/OpenAPI contracts unchanged; this is infrastructure/permission hardening for existing upload flow.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `powersync`: Add requirements for required DB grants/policies, a canonical SQL remediation artifact, and actionable permission-failure diagnostics for upload flows.

## Impact

- **Database ops:** New SQL script under `packages/database/prisma/` for grant/policy remediation.
- **Frontend PowerSync connector:** Improved permission error diagnostics in `apps/frontend/src/lib/powersync/connector.ts`.
- **Docs/runbook:** Update existing DB/PowerSync setup notes with apply/verify commands.
- **APIs:** No new endpoints and no OpenAPI contract changes (`/movements`, `/items`, `/projects`, `/auth/*` remain unchanged).
