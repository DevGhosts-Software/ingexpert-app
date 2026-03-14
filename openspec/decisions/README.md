# Architecture Decision Records (ADRs)

One file per significant architectural decision that was consciously made and should not be revisited without good reason.

## Naming

`ADR-[NNN]-[short-title].md`  
Example: `ADR-001-trpc-over-rest.md`, `ADR-002-offline-first-powersync.md`

## Template

```markdown
# ADR-NNN: [Title]

## Status

Accepted | Superseded by ADR-XXX

## Context

What problem were we solving? What were the constraints?

## Decision

What did we decide?

## Consequences

What are the trade-offs? What becomes easier or harder?
```

## Current decisions recorded here

| ADR                                    | Title                         | Status   |
| -------------------------------------- | ----------------------------- | -------- |
| [ADR-001](./ADR-001-trpc-over-rest.md) | tRPC Over Plain REST API      | Accepted |
| [ADR-002](./ADR-002-supabase-auth.md)  | Supabase Auth with RS256 JWKS | Accepted |
| [ADR-003](./ADR-003-tauri-desktop.md)  | Tauri 2 for Desktop Packaging | Accepted |
| [ADR-004](./ADR-004-prisma-orm.md)     | Prisma as the ORM             | Accepted |
