## Why

PowerSync now handles most local-first data flows, but we lack a precise inventory of which frontend tRPC calls still require the API. Without that map, we cannot safely decide whether to keep a 24/7 API or replace parts with serverless functions.

## What Changes

- Audit every frontend `trpc.*` usage and classify each call as: auth/session-critical, server-compute-critical, write-path-critical, or migration-candidate.
- Produce a call-by-call API usage matrix (feature, procedure, hook type, online/offline behavior, replacement feasibility).
- Define explicit decision criteria for “must stay in API” vs “can move to serverless/Supabase Edge Functions”.
- Identify current dashboard/stats calls that can be computed from local SQLite/PowerSync data and which ones still need remote authority.
- Propose a phased migration plan that minimizes risk (observe, dual-run/verify, cutover).

## Capabilities

### New Capabilities

- `api-footprint-audit`: A repeatable audit and decision framework to map frontend tRPC dependencies and determine the minimum backend responsibilities after PowerSync adoption.

### Modified Capabilities

- `core-architecture`: Add a requirement to maintain a documented API responsibility matrix when local-first architecture changes materially reduce tRPC read dependence.

## Impact

- Frontend: all files under `apps/frontend/src/**` that call `trpc.*` (queries, mutations, and utility fetch/invalidation paths).
- API: no immediate endpoint additions/removals; this change establishes a migration decision baseline using current OpenAPI contracts.
- Architecture docs/specs: new `api-footprint-audit` capability spec and a core-architecture delta for governance of API responsibility boundaries.
- Operations/cost: enables an evidence-based decision on reducing always-on API runtime to only essential services (if feasible).
