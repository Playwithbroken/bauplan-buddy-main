import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full rounded-[calc(var(--radius)+2px)] border border-border bg-card text-foreground transition-[background-color,border-color,color,box-shadow] duration-150 ease-out ring-offset-background placeholder:text-muted-foreground/70 placeholder:transition-opacity focus-visible:outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background hover:border-ring/60 disabled:cursor-not-allowed disabled:opacity-60 dark:placeholder:text-muted-foreground/70 motion-reduce:transition-none resize-y",
  {
    variants: {
      size: {
        sm: "min-h-[72px] px-2.5 py-2 text-sm",
        default: "min-h-[96px] px-3 py-3 text-sm",
        lg: "min-h-[120px] px-4 py-4 text-base",
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

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
