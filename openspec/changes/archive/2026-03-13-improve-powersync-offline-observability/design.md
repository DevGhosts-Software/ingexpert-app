## Context

Current PowerSync integration is partially local-first: inventory reads and movement writes are local, but several critical dependencies still require live network/session access. `powersync-debug.tsx` only reports basic connectivity/counters, which makes offline failures hard to diagnose. Projects and several lookup flows remain tRPC-first and fail offline. SQL field aliasing is inconsistent, creating avoidable mapping churn.

## Goals / Non-Goals

**Goals:**

- Provide actionable PowerSync debug observability for runtime diagnosis (session, sync, queue, table availability, errors).
- Ensure Supabase session state is persisted/reused so PowerSync can continue local operation while offline and resume sync/upload when connectivity returns.
- Define local-first read requirements for projects and movement dependencies needed for offline operation.
- Standardize SQL mapping rules to avoid unnecessary aliasing, especially around `image_url`/`imageUrl`.
- Keep compatibility with existing OpenAPI contracts (`/items`, `/movements`, `/projects`, `/auth/*`) and avoid new backend routes.

**Non-Goals:**

- Redesigning RBAC or introducing new server-side authorization models.
- Adding Prisma schema changes or new tables.
- Replacing all tRPC reads in one step beyond the capabilities required for offline-critical flows in this change.

## Decisions

1. **PowerSync debug panel becomes operational telemetry, not just status text.**
   - Include connectivity, `hasSynced`, per-table row counts, upload queue depth, last credential refresh state, and surfaced connector/query errors.
   - Alternative considered: rely on console logs only. Rejected because field debugging in Tauri/offline mode needs in-app visibility.

2. **Session persistence remains Supabase-native, with explicit offline handling in connector flow.**
   - Keep `persistSession: true` as baseline and add explicit behavior requirements for `fetchCredentials` and `uploadData` when offline or session refresh is unavailable.
   - Alternative considered: custom token cache outside Supabase client. Rejected to avoid duplicate auth state and drift risks.

3. **Offline reads for projects/movement dependencies must come from local PowerSync SQLite where feasible.**
   - Project list and movement form dependency data (projects/users where already synced) should read from local tables for offline continuity.
   - Alternative considered: keep remote tRPC and add retries. Rejected because retries do not satisfy no-network operation.

4. **SQL mapping strategy is contract-driven and minimal.**
   - Use raw DB names in local query row types by default; map only at boundary points where frontend entities/contracts require camelCase.
   - Avoid broad SQL aliasing for convenience-only transformations (e.g., alias only when required by consumer shape).
   - Alternative considered: always alias to camelCase in SQL. Rejected due to repetitive query churn and harder maintenance.

## Risks / Trade-offs

- **[Risk]** Cached/offline session may expire while disconnected → **Mitigation:** require graceful read-only continuation locally, explicit upload deferral, and clear debug state indicating token/session recovery is required.
- **[Risk]** Moving more reads to local tables can diverge from remote filters/pagination semantics → **Mitigation:** define deterministic local filter/sort behavior and document where parity is required.
- **[Risk]** More debug metrics can increase noise/perf overhead → **Mitigation:** keep lightweight aggregate queries and gate panel visibility to debug mode/developer context.
- **[Risk]** Mixed snake_case/camelCase conventions can confuse contributors → **Mitigation:** codify one mapping policy in specs and apply consistently in affected queries/components.
