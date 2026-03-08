import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, GripVertical, Settings2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  isEditable?: boolean;
  onRemove?: () => void;
  onConfig?: () => void;
  isLoading?: boolean;
  compact?: boolean;
  dragHandleProps?: any;
  innerRef?: (element: HTMLElement | null) => void;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  children,
  className,
  isEditable = false,
  onRemove,
  onConfig,
  isLoading = false,
  compact = false,
  dragHandleProps,
  innerRef,
}) => {
  return (
    <div ref={innerRef} className={cn("relative group", className)}>
      {isEditable && (
        <div className="absolute -top-3 -right-3 z-30 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onConfig && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full shadow-lg border border-slate-200 dark:border-slate-800"
              onClick={onConfig}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
          {onRemove && (
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full shadow-lg"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {isEditable && (
        <div
          {...dragHandleProps}
          className="absolute left-1/2 -top-3 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 flex items-center shadow-sm">
            <GripVertical className="h-3 w-3 text-muted-foreground mr-1" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {title}
            </span>
          </div>
        </div>
      )}

      <div
        className={cn(
          "h-full transition-all duration-300",
          compact ? "p-3" : "p-0",
          isEditable &&
            "ring-2 ring-primary/20 ring-offset-2 dark:ring-offset-slate-950 scale-[0.98] blur-[0.5px] grayscale-[0.2]"
        )}
      >
        {children}
      </div>
    </div>
  );
};
