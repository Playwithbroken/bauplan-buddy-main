import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium tracking-tight transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 data-[loading=true]:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 motion-reduce:transition-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus-visible:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md focus-visible:shadow-none",
        outline:
          "border border-border bg-card text-foreground shadow-sm hover:border-ring hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md",
        ghost:
          "text-foreground shadow-none hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-0 focus-visible:ring-offset-0",
        subtle:
          "border border-border/70 bg-muted/50 text-foreground shadow-none hover:bg-muted hover:border-border/80 focus-visible:ring-1 focus-visible:ring-border",
        success:
          "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-sm hover:bg-[hsl(var(--success)/0.9)] hover:shadow-md focus-visible:shadow-none",
        warning:
          "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] shadow-sm hover:bg-[hsl(var(--warning)/0.9)] hover:shadow-md focus-visible:shadow-none",
        info: "bg-[hsl(var(--info))] text-[hsl(var(--info-foreground))] shadow-sm hover:bg-[hsl(var(--info)/0.9)] hover:shadow-md focus-visible:shadow-none",
        gradient:
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm hover:shadow-md hover:from-primary/90 hover:to-primary/70 focus-visible:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        compact: "h-8.5 rounded-md px-3 text-sm",
        xs: "h-8 rounded-md px-2.5 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10 gap-0",
        xl: "h-12 rounded-lg px-8 text-base font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  haptic?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      haptic = true,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const spinnerClasses = "motion-safe:animate-spin";

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (haptic && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10); // Subtle 10ms vibration
      }
      if (onClick) onClick(e);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        data-loading={loading ? "true" : undefined}
        aria-busy={loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <>
            <Loader2
              className={cn("h-4 w-4", spinnerClasses)}
              aria-hidden="true"
            />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
