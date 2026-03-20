"use client"

import * as React from "react"
import { CheckIcon, MinusIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  checked,
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const indicatorIcon =
    checked === "indeterminate" ? <MinusIcon className="size-4" /> : <CheckIcon className="size-4" />

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={checked}
      className={cn(
        "peer border-input bg-background dark:bg-input/30 data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:border-foreground data-[state=indeterminate]:bg-foreground data-[state=indeterminate]:text-background data-[state=indeterminate]:border-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-5 shrink-0 rounded-[6px] border shadow-xs transition-[box-shadow,background-color,border-color,color] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        {indicatorIcon}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
