import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 dark:bg-secondary/80 dark:text-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "text-foreground border-border bg-muted/50 hover:bg-muted dark:border-border dark:bg-muted/30 dark:text-foreground",
        success:
          "border-transparent bg-green-600 text-white shadow-sm hover:bg-green-700 dark:bg-green-700 dark:text-white",
        warning:
          "border-transparent bg-yellow-600 text-white shadow-sm hover:bg-yellow-700 dark:bg-yellow-600 dark:text-white",
        info:
          "border-transparent bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
