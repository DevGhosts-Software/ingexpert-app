## 1. Tooltip Component Fix

- [x] 1.1 Update `apps/frontend/src/components/ui/tooltip.tsx` to use `bg-popover` and `text-popover-foreground` for `TooltipContent`.
- [x] 1.2 Update the `TooltipPrimitive.Arrow` in `apps/frontend/src/components/ui/tooltip.tsx` to use `fill-popover` and ensure it matches the background color.
- [x] 1.3 Add `border` and `shadow-md` to the `TooltipContent` in `apps/frontend/src/components/ui/tooltip.tsx` for consistency with other floating UI elements.

## 2. Movements Table Fix

- [x] 2.1 Update `NotesCell` in `apps/frontend/src/features/movements/components/movement-table.columns.tsx` to set `side="bottom"` on the `TooltipContent`.

## 3. Validation

- [x] 3.1 Run `pnpm check` in `apps/frontend` to ensure formatting, linting, and type-checking pass.
