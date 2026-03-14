## Context

Ingexpert is local-first, but users currently lack a persistent, user-facing status signal showing whether data is connected, syncing, or offline and when the last successful sync occurred. This creates uncertainty about data freshness. Additionally, several user-visible strings remain in English, creating mixed-language UX in a Spanish product.

## Goals / Non-Goals

**Goals:**

- Add a topbar status surface that communicates connection state, sync activity, and last sync timestamp.
- Provide explicit “syncing/loading” UX messaging to reduce risky user actions during transitions.
- Standardize affected frontend user-facing strings to Spanish (including auth error states).
- Keep behavior compatible with current local-first sync architecture.

**Non-Goals:**

- Backend/API contract changes.
- New database schema or RLS changes.
- Full i18n framework introduction in this change.

## Decisions

1. **Topbar placement for sync status**  
   Implement status in topbar (not floating pill) to ensure constant visibility and consistent placement across screens.

2. **Single source for sync-state presentation**  
   Use existing PowerSync/client connection and sync metadata sources and expose a small shared UI state model for rendering status labels (connected/offline/syncing/loading/last sync).

3. **Incremental Spanish copy normalization**  
   Replace remaining English user-visible strings in scope (starting with auth/login failure and other visible status/error labels) without waiting for full translation infrastructure.

## Risks / Trade-offs

- **[Risk]** Status labels can be inaccurate if state derivation is fragmented.  
  **Mitigation:** Centralize mapping from sync engine signals to UI states.

- **[Risk]** Overly noisy status updates can distract users.  
  **Mitigation:** Keep labels concise and stable; prioritize meaningful transitions only.

- **[Risk]** Broad string replacement may unintentionally alter developer-only text.  
  **Mitigation:** Limit replacements to user-visible UI copy and error messages surfaced to end users.

## Migration Plan

1. Add topbar status UI component and wire it to existing sync/connection signals.
2. Add “last sync” display with fallback text for first-run/no-sync cases.
3. Audit and replace in-scope English user-visible strings with Spanish equivalents.
4. Validate key flows (login errors, online/offline transitions, active sync) and run `pnpm check`.

## Open Questions

- Should last-sync display use absolute datetime or relative format (“hace X min”) as default?
- Should some actions be disabled while syncing, or only show warning status in this phase?
