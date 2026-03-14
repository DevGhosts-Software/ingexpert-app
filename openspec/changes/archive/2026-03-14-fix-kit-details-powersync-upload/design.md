## Context

`kit_details` is part of the local PowerSync schema and is written by inventory kit-edit flows. The connector upload pipeline currently handles `items`, `projects`, `movements`, and `movement_details`, but not `kit_details`, so replay throws `Unsupported CRUD table "kit_details" in PowerSync uploadData`. This is a blocking sync defect in the API-removal phase where kit composition updates are expected to be fully local-write + sync.

## Goals / Non-Goals

**Goals:**

- Ensure PowerSync upload replay supports `kit_details` entries produced by local inventory flows.
- Define deterministic behavior for the common replacement pattern (delete existing kit rows, insert new component rows).
- Add validation coverage so unsupported table regressions are caught before release.

**Non-Goals:**

- Introducing new API/tRPC endpoints for kit component writes.
- Changing Prisma schema or Supabase table structure.
- Redesigning broader PowerSync connector architecture beyond `kit_details` replay support.

## Decisions

- Extend connector table routing with explicit `kit_details` handling in `uploadCrudEntry`.
  - Rationale: this keeps behavior aligned with current per-table mapping strategy and avoids cross-cutting refactors.
  - Alternative considered: generic table-to-handler map with shared operation logic. Deferred because this change is narrowly scoped and urgent.
- Support both canonical and legacy table-name variants where applicable (`kit_details` and `KitDetail`) to avoid casing/model-name drift issues.
  - Rationale: existing connector already follows this compatibility pattern for other tables.
- Add explicit handling for delete semantics on `kit_details` replay instead of failing all deletes globally.
  - Rationale: kit replacement emits deletes by design; failing deletes breaks sync consistency.
  - Alternative considered: suppress delete replay. Rejected because it risks stale component rows server-side.
- Add/extend connector validation tests for success and error branches for `kit_details` operations.
  - Rationale: this bug is a routing gap and is best prevented with focused connector validation.

## Risks / Trade-offs

- [Risk] Delete replay could remove wrong rows if row identity assumptions are incorrect. → Mitigation: require id-targeted delete behavior and add validation tests for expected SQL mutation semantics.
- [Risk] Supporting extra table aliases can hide naming drift over time. → Mitigation: keep aliases explicit and document accepted names in connector tests/spec.
- [Trade-off] Connector remains table-branch based rather than fully abstracted. → Mitigation: keep this scoped fix small and safe; revisit abstraction in a dedicated refactor change.
