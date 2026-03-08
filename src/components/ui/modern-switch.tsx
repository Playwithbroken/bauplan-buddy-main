import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

type ModernSwitchSize = "compact" | "standard" | "large"
type ModernSwitchVariant = "default" | "success" | "warning" | "danger" | "info"

interface ModernSwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: ModernSwitchSize
  variant?: ModernSwitchVariant
  animated?: boolean
  glowing?: boolean
  showStatus?: boolean
  label?: string
}

const ModernSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  ModernSwitchProps
>(({ 
  className, 
  size = "standard", 
  variant = "default", 
  animated = true,
  glowing = true,
  showStatus = false,
  label,
  disabled,
  checked,
  onCheckedChange,
  ...props 
}, ref) => {
  const [isHovered, setIsHovered] = React.useState(false)
  const [isPressed, setIsPressed] = React.useState(false)

  // Size configurations
  const sizeConfig = {
    compact: {
      root: "h-[30px] w-[60px]",
      thumb: "h-[22px] w-[22px]",
      translateChecked: "translate-x-[30px]",
      translateUnchecked: "translate-x-[4px]"
    },
    standard: {
      root: "h-[40px] w-[80px]",
      thumb: "h-[32px] w-[32px]",
      translateChecked: "translate-x-[40px]",
      translateUnchecked: "translate-x-[4px]"
    },
    large: {
      root: "h-[50px] w-[100px]",
      thumb: "h-[42px] w-[42px]",
      translateChecked: "translate-x-[50px]",
      translateUnchecked: "translate-x-[4px]"
    }
  }

  // Variant configurations with theme-aware colors
  const variantConfig = {
    default: {
      unchecked: "bg-gradient-to-r from-red-400 to-red-500",
      checked: "bg-gradient-to-r from-primary to-blue-500",
      shadow: checked ? "shadow-primary/40" : "shadow-red-400/40",
      glow: checked ? "shadow-lg shadow-primary/30" : "shadow-lg shadow-red-400/30"
    },
    success: {
      unchecked: "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700",
      checked: "bg-gradient-to-r from-green-400 to-emerald-500",
      shadow: checked ? "shadow-green-400/40" : "shadow-gray-400/20",
      glow: checked ? "shadow-lg shadow-green-400/30" : "shadow-lg shadow-gray-400/20"
    },
    warning: {
      unchecked: "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700",
      checked: "bg-gradient-to-r from-yellow-400 to-orange-500",
      shadow: checked ? "shadow-yellow-400/40" : "shadow-gray-400/20",
      glow: checked ? "shadow-lg shadow-yellow-400/30" : "shadow-lg shadow-gray-400/20"
    },
    danger: {
      unchecked: "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700",
      checked: "bg-gradient-to-r from-red-400 to-red-600",
      shadow: checked ? "shadow-red-400/40" : "shadow-gray-400/20",
      glow: checked ? "shadow-lg shadow-red-400/30" : "shadow-lg shadow-gray-400/20"
    },
    info: {
      unchecked: "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700",
      checked: "bg-gradient-to-r from-blue-400 to-cyan-500",
      shadow: checked ? "shadow-blue-400/40" : "shadow-gray-400/20",
      glow: checked ? "shadow-lg shadow-blue-400/30" : "shadow-lg shadow-gray-400/20"
    }
  }

  const currentSize = sizeConfig[size]
  const currentVariant = variantConfig[variant]

  const rootClasses = cn(
    // Base styles
    "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-all duration-500 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    
    // Size
    currentSize.root,
    
    // Gradient backgrounds
    checked ? currentVariant.checked : currentVariant.unchecked,
    
    // Shadows and glow effects
    glowing && !disabled && currentVariant.glow,
    animated && "transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    
    // Hover and press effects
    !disabled && "hover:scale-105 active:scale-95",
    isHovered && !disabled && "brightness-110",
    isPressed && !disabled && "scale-95",
    
    className
  )

  const thumbClasses = cn(
    // Base styles
    "pointer-events-none absolute bg-white rounded-full shadow-xl transition-all duration-500 ease-out",
    "flex items-center justify-center",
    
    // Size
    currentSize.thumb,
    
    // Position based on state
    checked ? currentSize.translateChecked : currentSize.translateUnchecked,
    
    // Enhanced shadows for depth
    checked 
      ? "shadow-xl shadow-primary/20 dark:shadow-primary/30" 
      : "shadow-xl shadow-gray-600/20 dark:shadow-gray-900/40",
    
    // Animation
    animated && "transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    
    // Disabled state
    disabled && "bg-gray-200 dark:bg-gray-700"
  )

  return (
    <div className="flex flex-col items-start gap-2">
      <SwitchPrimitives.Root
        className={rootClasses}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb className={thumbClasses}>
          {/* Optional icon or indicator inside thumb */}
          {animated && (
            <div className={cn(
              "transition-all duration-300",
              checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}>
              <div className="w-2 h-2 bg-primary/30 rounded-full" />
            </div>
          )}
        </SwitchPrimitives.Thumb>
      </SwitchPrimitives.Root>
      
      {/* Status text */}
      {showStatus && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={cn(
            "transition-all duration-300",
            checked ? "text-primary" : "text-muted-foreground"
          )}>
            {checked ? (
              <>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                {label ? `${label} Activated` : "Activated"}
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2" />
                {label ? `${label} Deactivated` : "Deactivated"}
              </>
            )}
          </span>
        </div>
      )}
    </div>
  )
})

ModernSwitch.displayName = "ModernSwitch"

export { ModernSwitch }
export type { ModernSwitchProps, ModernSwitchSize, ModernSwitchVariant }