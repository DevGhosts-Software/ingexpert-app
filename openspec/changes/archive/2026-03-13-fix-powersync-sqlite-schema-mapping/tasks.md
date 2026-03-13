## 1. Align frontend PowerSync SQLite schema with synchronized tables

- [x] 1.1 Update `apps/frontend/src/lib/powersync/schema.ts` to define table entries for `items`, `kit_details`, `movement_details`, `movements`, `projects`, `staff`, `users`, and `work_ares`.
- [x] 1.2 Update `apps/frontend/src/lib/powersync/schema.ts` field keys to match synced payload naming conventions (including snake_case fields where emitted by PowerSync).

## 2. Keep sync contract and frontend schema consistent

- [x] 2.1 Validate `ops/powersync/powersync.yaml` sync output/table identifiers against the frontend schema and update config if aliases/table names differ.
- [x] 2.2 Update `openspec/specs/powersync/spec.md` (if needed during apply) to reflect final verified synchronized table identifiers and schema contract.

## 3. Verify sync behavior and project health

- [x] 3.1 Run local PowerSync verification (containers + diagnostics/logs) to confirm rows replicate into the updated SQLite tables and sync is operational.
- [x] 3.2 Run `pnpm check` from repository root to confirm formatting, linting, type-checking, and frontend build remain healthy.
