import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-[calc(var(--radius)+2px)] border border-border bg-card text-foreground transition-[background-color,border-color,color,box-shadow] duration-150 ease-out ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground/70 placeholder:transition-opacity focus-visible:outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background hover:border-ring/60 disabled:cursor-not-allowed disabled:opacity-60 dark:placeholder:text-muted-foreground/70 motion-reduce:transition-none",
  {
    variants: {
      size: {
        sm: "h-9 px-2.5 py-1.5 text-sm file:text-xs",
        default: "h-11 px-3 py-2 text-base md:text-sm file:text-sm",
        lg: "h-12 px-4 py-3 text-base file:text-sm",
      },
      variant: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
