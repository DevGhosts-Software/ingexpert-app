## Context

The current sync indicator uses a native HTML `title` tooltip containing multiline status details (state, last successful sync, pending uploads). Native tooltips render inconsistently, are difficult to scan, and do not align with the existing shadcn/Radix interaction model used in the frontend.

This change is a frontend-only UX refinement in `apps/frontend/src/components/sync-status-indicator.tsx`. Existing sync state derivation (`useSyncStatus`, queue count query, localStorage last complete sync timestamp) remains the source of truth and should not change behavior.

## Goals / Non-Goals

**Goals:**
- Replace the native tooltip with a shadcn-based hover surface (Radix-backed) that shows sync details in a structured layout.
- Preserve current sync semantics, copy language (Spanish-first), badge tones, and icon behavior.
- Keep the interaction non-blocking and lightweight for topbar usage.
- Maintain accessibility for hover/focus interactions in desktop contexts.

**Non-Goals:**
- No changes to sync algorithm, queue logic, or persistence keys.
- No API, backend, or Prisma schema modifications.
- No redesign of topbar layout beyond the sync indicator interaction affordance.

## Decisions

1. **Use a shadcn hover primitive around the existing badge trigger**
   - Decision: Wrap the `Badge` in a shadcn/Radix hover-capable primitive (e.g., `HoverCard` or equivalent approved tooltip/popover pattern) instead of relying on `title`.
   - Rationale: Provides richer layout, consistent styling, and better control over interaction timing and positioning.
   - Alternative considered: Keep native `title` with shorter text. Rejected because it still lacks consistent rendering and structured formatting.

2. **Keep status computation logic unchanged**
   - Decision: Reuse existing `getReadableStatus`, queue count parsing, and last complete sync timestamp logic exactly as-is.
   - Rationale: The change target is presentation, not behavior; preserving logic minimizes risk.
   - Alternative considered: Refactor status computation into a new hook. Rejected as unnecessary scope for this UX change.

3. **Render details as explicit rows**
   - Decision: Show detail content as separate lines/rows (estado, última sincronización completa, pendientes por subir) in the hover surface body.
   - Rationale: Improves readability over newline-joined plain text and aligns with shadcn composition patterns.
   - Alternative considered: Keep single concatenated string in a custom tooltip component. Rejected due to poorer readability and maintainability.

## Risks / Trade-offs

- **[Risk] Hover surface can occlude nearby topbar controls** → **Mitigation:** use compact content width and side/align configuration consistent with existing topbar spacing.
- **[Risk] Hover-only interaction may reduce discoverability on non-hover devices** → **Mitigation:** ensure trigger still communicates current state inline and supports focus behavior.
- **[Trade-off] Slightly more UI component complexity** → **Mitigation:** keep implementation isolated to one component and reuse existing shadcn primitives.

## Migration Plan

1. Replace `title` attribute usage in `sync-status-indicator.tsx` with shadcn hover/popover composition.
2. Keep current strings and computed values, but map them into structured hover content.
3. Validate visual and interaction behavior in the topbar.
4. Run `pnpm check` and `pnpm format`.
5. Rollback strategy: restore `title` attribute path in the same component if regression is detected.

## Open Questions

- Preferred primitive for this repository’s UX conventions: `HoverCard` vs `Tooltip` with rich content.
- Whether to include additional metadata (e.g., upload error message) in the first iteration or keep parity with current tooltip payload only.
