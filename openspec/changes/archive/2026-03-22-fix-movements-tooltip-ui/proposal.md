## Why

The floating description note (tooltip) in the Movements module currently has visual regressions:

1. Mismatching colors (white box with a black arrow), which breaks the visual consistency and theme of the application.
2. Incorrect positioning (appearing on the left instead of below the trigger), which is inconsistent with standard UI patterns and the user's expectation.

## What Changes

- **Movements Table Notes Tooltip Positioning**: Change the placement of the observations tooltip in the movements table from `left` to `bottom`.
- **Tooltip Component Color Consistency**: Update the `TooltipContent` component to ensure the background and the pointing arrow use consistent colors derived from the application's theme (`bg-popover` and `fill-popover`).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None (This is a styling-only fix that doesn't change business requirements or specs).

## Impact

- **`apps/frontend/src/features/movements/components/movement-table.columns.tsx`**: Update the `NotesCell` tooltip configuration.
- **`apps/frontend/src/components/ui/tooltip.tsx`**: Update the global `TooltipContent` component styling to fix the arrow color and background theme consistency.
