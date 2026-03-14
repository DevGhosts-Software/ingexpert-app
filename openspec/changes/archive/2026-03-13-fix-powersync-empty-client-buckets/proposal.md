## Why

PowerSync transport is healthy (container, websocket, and auth), but clients still receive zero synced data and `ps_buckets` remains empty. This blocks offline-first behavior and makes the current PowerSync integration unusable for core inventory workflows.

## What Changes

- Fix the PowerSync sync-rule configuration so authenticated clients are assigned at least one bucket and replicated rows are emitted to local SQLite.
- Align sync-rule output fields and client schema expectations to avoid silent row drops caused by field/type mismatches.
- Remove debug-only global database exposure from the frontend PowerSync provider while preserving initialization and connection behavior.
- Add targeted verification steps for bucket creation and local table population in the local PowerSync stack.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `powersync`: Tighten and validate sync rule + client contract requirements so healthy connections also produce bucket assignments and synced data.

## Impact

- `ops/powersync/powersync.yaml` sync rules and bucket behavior.
- Frontend PowerSync integration in `apps/frontend/src/lib/powersync/*` and `apps/frontend/src/components/providers/powersync-provider.tsx`.
- Local developer verification flow for PowerSync bucket/data diagnostics.
