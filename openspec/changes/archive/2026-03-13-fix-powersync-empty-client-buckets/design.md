## Context

Ingexpert already has a working PowerSync transport path (service health, websocket upgrade, JWT verification), but clients still receive no data and local `ps_buckets` stays empty. This indicates a sync-assignment/configuration issue rather than connectivity.

Current sync rules use a global bucket with broad `SELECT` queries. While valid in principle, current diagnostics show no effective bucket assignment on the client. The frontend provider also exposes `window.db`, which is useful for debugging but not intended for production behavior.

## Goals / Non-Goals

**Goals:**

- Ensure authenticated clients receive bucket assignments and replicated rows.
- Keep the existing baseline scope (`items`, `kit_details`, `movements`, `movement_details`, `projects`, `staff`, `users`, `work_areas`).
- Align sync rule output fields and frontend schema so rows can be applied consistently.
- Remove debug-only global database exposure from provider bootstrap.

**Non-Goals:**

- Replacing Sync Rules with Sync Streams.
- Redesigning authorization/tenant isolation beyond current local baseline.
- Introducing new backend API endpoints.

## Decisions

### 1) Replace implicit global assignment with explicit auth-parameter bucket

- Use `parameters: SELECT request.user_id() AS user_id` in bucket definitions.
- Keep data scope broad, but make bucket creation explicitly user-addressable.
- Rationale: this creates deterministic per-user bucket assignment and eliminates ambiguity when diagnosing empty `ps_buckets`.

Alternative considered:

- Keep global bucket and only adjust data queries.
- Rejected because it does not directly address missing bucket assignment visibility and leaves diagnostics less deterministic.

### 2) Enforce schema/query contract parity for all synced tables

- Keep table names and column aliases aligned with client `AppSchema`.
- Validate required `id` output and stable aliases (for example `has_auth`).
- Rationale: schema/query drift can produce silent row-application failures even when transport is healthy.

Alternative considered:

- Let client transform fields after sync.
- Rejected because PowerSync table schemas are contract-first and should match sync output at source.

### 3) Remove provider-level debug global exposure

- Delete `window.db` assignment in `PowerSyncProvider`.
- Preserve init/connect/disconnect lifecycle behavior.
- Rationale: avoids leaking internal database object globally while keeping debugging available through explicit tooling.

## Risks / Trade-offs

- **[Risk]** Per-user bucket assignment increases bucket cardinality compared to a single global bucket.  
  **Mitigation:** Scope remains local-dev baseline; monitor bucket/storage growth and revisit production auth model later.

- **[Risk]** Tight schema/query alignment may surface pre-existing data inconsistencies.  
  **Mitigation:** Add verification steps against `ps_buckets`, `ps_oplog`, and representative synced tables after config update.

- **[Risk]** Removing `window.db` may slow ad-hoc manual debugging.  
  **Mitigation:** document supported debug workflow using PowerSync logs and targeted in-app diagnostics.

## Migration Plan

1. Update `ops/powersync/powersync.yaml` bucket definition to include explicit auth parameter query and validated data query outputs.
2. Update frontend provider to remove debug global database exposure.
3. Restart local PowerSync service and reconnect client.
4. Verify bucket assignment (`ps_buckets`) and table population in local SQLite.
5. Rollback by restoring previous YAML/provider files if regression is observed.

## Open Questions

- Should Ingexpert keep user-scoped broad buckets for local development only, or carry this model into production baseline?
- Do we want a dedicated developer-only debug flag (instead of hardcoded `window.db`) for controlled local introspection?
