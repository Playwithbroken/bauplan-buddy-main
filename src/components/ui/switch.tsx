import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input/60",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-14",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const thumbSizes = {
  sm: "h-4 w-4 data-[state=checked]:translate-x-4 group-active:w-5 data-[state=checked]:group-active:-ml-1",
  md: "h-5 w-5 data-[state=checked]:translate-x-5 group-active:w-6 data-[state=checked]:group-active:-ml-1",
  lg: "h-6 w-6 data-[state=checked]:translate-x-7 group-active:w-7 data-[state=checked]:group-active:-ml-1",
} as const;

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  thumbIcon?: React.ReactNode;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = "md", thumbIcon, ...props }, ref) => {
  // Safe resolution of size
  const thumbClass =
    thumbSizes[size as keyof typeof thumbSizes] || thumbSizes.md;

  return (
    <SwitchPrimitives.Root
      className={cn(switchVariants({ size, className }), "group")}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none rounded-full bg-background shadow-lg ring-0 transition-transform flex items-center justify-center p-0.5 data-[state=unchecked]:translate-x-0",
          thumbClass,
          // Custom bezier for springy effect
          "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        )}
      >
        {thumbIcon && (
          <span className="opacity-0 data-[state=checked]:opacity-100 transition-opacity duration-200">
            {thumbIcon}
          </span>
        )}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
