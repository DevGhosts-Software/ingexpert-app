## Context

Ingexpert needs a local offline-first development stack but currently has no PowerSync runtime in-repo. The existing Prisma schema defines business entities (`Item`, `Movement`, `MovementDetail`, `Project`) with database table mappings (`items`, `movements`, `movement_details`, `projects`), while the publication helper SQL references PascalCase model names. This change introduces reproducible local infrastructure under `ops/powersync` and a new capability spec to standardize setup and sync-rule expectations.

## Goals / Non-Goals

**Goals:**

- Provide a local PowerSync Open Edition runtime using Docker Compose.
- Document required environment variables and configuration contract for local runs.
- Define baseline sync rules that expose `Item`, `Movement`, `MovementDetail`, and `Project` to authenticated users.
- Capture the infrastructure standard in a new long-lived capability spec (`openspec/specs/powersync/spec.md`).

**Non-Goals:**

- Implement tenant- or role-scoped sync buckets in this change.
- Modify tRPC routers, frontend hooks, or API contracts.
- Introduce production deployment manifests for PowerSync.

## Decisions

### Decision: Use `ops/powersync` as the local infra root

- **Rationale:** Keeps operational assets isolated from app code and aligns with monorepo conventions for environment tooling.
- **Alternative considered:** Place files in project root. Rejected because it mixes operational and product artifacts.

### Decision: Run two containers only (PowerSync + MongoDB)

- **Rationale:** Matches minimum local PowerSync Open Edition requirements while keeping the setup simple.
- **Alternative considered:** Add Postgres container in compose. Rejected because Ingexpert already uses external Supabase/Postgres and this change only documents `PS_DATA_SOURCE_URI`.

### Decision: Start with global authenticated sync rules

- **Rationale:** Fastest path to unblock offline-first development and QA; authorization tightening can follow as iterative spec updates.
- **Alternative considered:** Per-user/per-project bucket partitioning now. Rejected due higher complexity and missing product scoping decisions.

### Decision: Validate publication/sql table mapping explicitly

- **Rationale:** `powersync pubilcation.sql` references `"Item"`, `"Movement"`, `"MovementDetail"`, `"Project"` while Prisma models map to lowercase plural table names. The design requires explicit review to ensure publication targets actual DB tables used by sync.
- **Alternative considered:** Assume publication file is already correct. Rejected because mismatched table identifiers would silently break replication.

## Risks / Trade-offs

- **[Risk]** Over-broad global bucket rules may expose more data than needed.  
  **Mitigation:** Mark as baseline-only in spec and plan follow-up for scoped buckets.

- **[Risk]** Publication table-name mismatch may prevent replication for one or more entities.  
  **Mitigation:** Include explicit analysis and alignment step against Prisma `@@map` table names.

- **[Risk]** Local setup drift between developers.  
  **Mitigation:** Version-control `docker-compose.yml`, `powersync.yaml`, and `.env.example` with required variables.

## Migration Plan

1. Add `ops/powersync` with compose, PowerSync config, and env template.
2. Validate that config references the intended replicated entities.
3. Add `openspec/specs/powersync/spec.md` as the long-term capability contract.
4. Run local stack using copied `.env` and verify PowerSync service boot.

Rollback strategy: remove `ops/powersync` assets and the new capability spec if integration must be deferred.

## Open Questions

- Should initial bucket rules include all authenticated users or be restricted by role/project from day one?
- For now include all, but add the pending spec
- Should publication SQL be updated in this same change to mapped table names (`items`, `movements`, `movement_details`, `projects`) if mismatch is confirmed?
- Yes, in this change fix the sql, its a boilerplate as of now
