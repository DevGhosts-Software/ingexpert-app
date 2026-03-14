## Context

The frontend has already completed runtime behavior migration away from `trpc.*` procedure calls, but repository wiring still assumes API existence through provider mounting, type imports, env variables, and workspace dependencies. This residual coupling keeps `apps/api` as a hard build/runtime dependency even though no remaining frontend feature requires it.

The change must complete final retirement safely by removing stale frontend integration points first, then removing the API app and monorepo references in a controlled sequence that preserves build integrity.

## Goals / Non-Goals

**Goals:**

- Remove all frontend tRPC bootstrap artifacts that are no longer used.
- Eliminate frontend/package/workspace dependencies that require `apps/api`.
- Delete `apps/api` and related repository references once imports and scripts are clean.
- Keep frontend runtime behavior unchanged for active user flows.

**Non-Goals:**

- Re-introducing replacement backend runtime APIs.
- Domain behavior changes in auth, inventory, movements, or projects.
- Schema or data-model redesign unrelated to API retirement cleanup.

## Decisions

1. Remove frontend integration points before deleting API sources.
   - Rationale: this avoids broken imports/types while preserving incremental verifiability.
   - Alternative considered: delete `apps/api` first and fix compile errors afterward; rejected due to noisy, high-risk breakage.

2. Treat residual tRPC provider/env/dependency wiring as architecture-level requirements, not implementation leftovers.
   - Rationale: deletion readiness must be testable as a repo-wide invariant, not an implicit cleanup task.
   - Alternative considered: documenting only tasks without spec deltas; rejected because archive-time requirements would miss retirement completeness criteria.

3. Validate retirement by repository evidence (no frontend tRPC runtime wiring + no API workspace app).
   - Rationale: these checks are deterministic and map directly to deletion safety.
   - Alternative considered: relying solely on manual review; rejected due to regression risk.

## Risks / Trade-offs

- [Risk] Hidden build scripts or tools still reference `apps/api` indirectly.  
  → Mitigation: include workspace/script cleanup in scoped tasks and run full `pnpm check`.

- [Risk] Removing env variables may break local docs or developer setup assumptions.  
  → Mitigation: update `.env.example` and related docs in the same change.

- [Risk] Orphaned package dependencies remain after provider deletion.  
  → Mitigation: explicitly remove tRPC client dependencies that become unused and verify lock/workspace consistency.

## Migration Plan

1. Remove frontend tRPC provider/client/type import/env usage.
2. Remove frontend dependency on `@ingexpert/api` and any now-unused tRPC client packages.
3. Remove `apps/api` source tree and root references (workspace/build scripts/config paths).
4. Run formatting and full repository verification.
5. Publish retirement evidence via changed files and passing checks.

Rollback path: restore removed wiring and workspace references from VCS if a critical downstream dependency is discovered during verification.

## Open Questions

None. Scope is constrained to deletion-readiness cleanup and retirement completion.
