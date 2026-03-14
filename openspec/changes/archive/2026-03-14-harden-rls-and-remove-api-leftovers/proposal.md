## Why

The local-first migration removed the API runtime, but RLS coverage is still incomplete for immutable movement ledger tables and repo/workspace config still appears to include API-era leftovers. We need to harden DB guarantees and remove stale dependencies/config so the current architecture is consistent, secure, and maintainable.

## What Changes

- Add strict RLS policies for `movements` and `movement_details` aligned with immutable-ledger behavior (insert allowed, update/delete denied).
- Tighten read/write constraints around movement data to minimize privilege surface while preserving current app behavior.
- Audit and clean API leftovers across workspace/package dependencies and Turbo tasks now that API runtime is removed.
- Update relevant specs and implementation guidance to reflect Supabase/RLS-first responsibility for these flows.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `movements`: enforce immutable movement-ledger access model through explicit RLS policy requirements.
- `supabase-rls-write-governance`: extend governance rules to require movement-table immutability and stricter policy scoping.
- `api-responsibility-migration`: finalize migration expectations by removing no-longer-needed API runtime leftovers in workspace/tooling.
- `api-footprint-audit`: strengthen audit requirements for detecting/removing stale API dependencies and task graph entries.

## Impact

- `packages/database/supabase/migrations/04_powersync-rls.sql` (new/updated movement policies).
- Workspace and build orchestration files (e.g., `pnpm-workspace.yaml`, `turbo.json`, package manifests) for dependency/task cleanup.
- No intended API contract expansion; behavior should remain compatible with existing local-first flows.
