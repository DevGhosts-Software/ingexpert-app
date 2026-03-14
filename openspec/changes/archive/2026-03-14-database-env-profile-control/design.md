## Context

`packages/database` currently exposes direct Prisma and Supabase CLI scripts, but environment selection is implicit and error-prone across `.env` and `.env.development`. Prisma requires explicit env-file control (`DATABASE_URL` source), while Supabase deployment targeting is controlled by `supabase link` state. The change needs a consistent operator model that reduces accidental cross-environment execution.

## Goals / Non-Goals

**Goals:**

- Define explicit profile-aware Prisma command entry points for development and production.
- Define explicit Supabase target-link and deploy macro scripts that separate target selection from execution.
- Normalize `packages/database` scripts so day-to-day flows are predictable and safe.
- Preserve existing migration/function behavior while improving control ergonomics.

**Non-Goals:**

- Introducing new DB schema models or changing data contracts.
- Replacing Supabase CLI target-link semantics.
- Redesigning monorepo-wide env management outside `packages/database`.

## Decisions

1. **Use env-profile wrappers for Prisma commands.**  
   Add script wrappers that execute Prisma via explicit env-file injection (`.env.development` for dev profile and `.env` for prod profile), rather than relying on whichever file happens to be active in shell context.

2. **Keep Supabase environment targeting explicit and stateful.**  
   Provide distinct `link:dev` and `link:prod` scripts plus deploy macros (`deploy:dev`, `deploy:prod`) so target selection is visible and repeatable.

3. **Preserve existing base scripts and add profile-oriented aliases.**  
   Keep compatible low-level scripts for flexibility, but document and prioritize safe profile-driven scripts as default operator paths.

4. **Adopt minimal tooling for env injection.**  
   Add a lightweight CLI dependency only if needed to guarantee deterministic env-file selection across platforms.

## Risks / Trade-offs

- **[Risk]** Operator may deploy to the wrong Supabase target if link state is stale.  
  **Mitigation:** Provide explicit `link:*` commands and deploy flow guidance that includes re-link validation.

- **[Risk]** Additional scripts increase package.json complexity.  
  **Mitigation:** Group scripts by concern and keep naming conventions consistent.

- **[Risk]** Tooling differences across environments can break wrapper behavior.  
  **Mitigation:** Use commonly adopted env-injection tooling and validate via existing lint/type-check workflow.

## Migration Plan

1. Add/normalize `packages/database` scripts for profile-driven Prisma and Supabase flows.
2. Add required env-injection dependency in `packages/database` if not already present.
3. Validate script resolution and command integrity through repository checks.
4. Communicate recommended usage pattern (`link -> deploy -> relink dev`) in script naming and docs/comments where appropriate.

## Open Questions

- Should production deploy macros automatically relink back to development at the end, or remain explicit/manual?
- Should profile wrappers be added for all Prisma subcommands or only core commands currently used by the team?
