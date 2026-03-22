## Context

The Movements module displays observations (notes) in a table cell. These notes are truncated and revealed in full via a tooltip when hovered. Currently, the tooltip's visual presentation is broken:

- The box has a white background (likely inheriting from a theme variable or hardcoded), but the arrow is black (default SVG fill).
- The tooltip is positioned to the left, which can be obscured by the sidebar or other UI elements, and is not the preferred "bottom" placement.

## Goals / Non-Goals

**Goals:**

- Fix the tooltip positioning to `side="bottom"`.
- Ensure the tooltip's background and arrow colors match perfectly.
- Use theme-compliant colors (`bg-popover`, `fill-popover`) to ensure consistency across light and dark modes.

**Non-Goals:**

- Modifying any business logic, table selection, or backend functionality.
- Changing the content or trigger logic of the tooltip.

## Decisions

### 1. Update `TooltipContent` in `tooltip.tsx`

- **Rationale**: The black arrow issue is a global problem for any tooltip that doesn't manually override its background and arrow colors. By updating the base `TooltipContent` component, we ensure that all tooltips in the application have a consistent, themed look.
- **Change**: Change `bg-foreground text-background` to `bg-popover text-popover-foreground`. Add `border` and `shadow-md` for better visibility against the main content. Update the arrow to use `fill-popover`.

### 2. Update `NotesCell` in `movement-table.columns.tsx`

- **Rationale**: Fix the specific placement reported by the user.
- **Change**: Set `side="bottom"` on `TooltipContent`.

## Risks / Trade-offs

- **[Risk] Global style change** → Since we are modifying `apps/frontend/src/components/ui/tooltip.tsx`, all tooltips using this component will change their background from "dark" (foreground) to "light/themed" (popover). However, this aligns with the user's report that the current white box (in their theme/state) is desired but the arrow is broken.
- **[Mitigation]** → Verify that other tooltips (like in the sidebar or sync status) still look correct. Given `sync-status-indicator.tsx` already uses `bg-popover`, this change actually moves the global default closer to the already established patterns in the project.
