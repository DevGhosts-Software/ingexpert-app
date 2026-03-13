## 1. PowerSync Sync Rule Fix

- [x] 1.1 Update `ops/powersync/powersync.yaml` to use an explicit auth parameter query (`request.user_id()`) for bucket assignment while preserving baseline data scope.
- [x] 1.2 Validate each data query output in `ops/powersync/powersync.yaml` matches client schema table/field naming (`apps/frontend/src/lib/powersync/schema.ts`), including required `id` and stable aliases.

## 2. Frontend Provider Hardening

- [x] 2.1 Remove debug-only global database exposure from `apps/frontend/src/components/providers/powersync-provider.tsx` (no `window.db` assignment), preserving connect/disconnect lifecycle.
- [x] 2.2 Confirm `apps/frontend/src/lib/powersync/db.ts` and `apps/frontend/src/lib/powersync/connector.ts` still satisfy provider initialization contract after the provider cleanup.

## 3. Verification

- [x] 3.1 Restart local PowerSync stack and verify client bucket assignment/data flow (`ps_buckets`, representative synced tables) with the updated configuration.
- [x] 3.2 Run `pnpm check` and `pnpm format` at repository root to verify code quality and build health.
