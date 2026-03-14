## Why

The frontend no longer performs runtime `trpc.*` procedure calls, but it still mounts tRPC provider wiring, imports API router types, and depends on `apps/api` through workspace and env leftovers. This blocks safe deletion of `apps/api` and keeps dead integration points in production code.

## What Changes

- Remove frontend tRPC bootstrap wiring that is no longer used (`TRPCProvider`, tRPC client singleton, and API URL env plumbing).
- Remove frontend package dependency on `@ingexpert/api` and related config that exists only to support tRPC wiring.
- Remove `apps/api` folder and workspace/package references after the frontend no longer imports backend router types.
- Clean up repository-level API references that become invalid once `apps/api` is removed (build scripts, workspace wiring, and stale integration code).
- **BREAKING**: NestJS/tRPC API runtime (`apps/api`) is fully retired from this monorepo for app runtime behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `core-architecture`: retire remaining API/tRPC ownership from runtime and remove API package/workspace coupling.
- `api-responsibility-migration`: extend retirement completion criteria to include deletion of frontend tRPC infrastructure and `apps/api` source tree.

## Impact

- Affected code: `apps/frontend/src/app/layout.tsx`, `apps/frontend/src/components/providers/*`, `apps/frontend/src/lib/*`, `apps/frontend/package.json`, frontend env files, root workspace/build wiring, and `apps/api/**`.
- Affected dependencies: removal of frontend dependency on `@ingexpert/api`; potential removal of now-unused tRPC client packages.
- Affected systems: monorepo build graph and startup flow no longer include API service runtime.
