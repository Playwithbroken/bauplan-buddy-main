import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Draggable from "react-draggable";
import { X, Minus, Square, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DraggableDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  title?: string;
  noPadding?: boolean;
}

const DraggableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DraggableDialogContentProps
>(({ className, children, title, noPadding = false, ...props }, ref) => {
  const nodeRef = React.useRef(null);

  return (
    <DialogPortal>
      <DialogOverlay />
      <Draggable handle=".window-title-bar" nodeRef={nodeRef}>
        <DialogPrimitive.Content
          ref={nodeRef}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-0 border shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl overflow-hidden",
            "border-border/50 bg-background/95 backdrop-blur-xl dark:bg-slate-900/95 dark:border-white/10", // Premium glass look adapting to theme
            className
          )}
          {...props}
        >
          <div className="window-title-bar flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/50 cursor-grab active:cursor-grabbing select-none">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
              </div>
              {title && (
                <span className="ml-3 text-sm font-medium text-muted-foreground">
                  {title}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <button className="p-1 hover:bg-muted rounded transition-colors">
                <Minus className="w-3 h-3" />
              </button>
              <button className="p-1 hover:bg-muted rounded transition-colors">
                <Square className="w-3 h-3" />
              </button>
              <DialogPrimitive.Close className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors focus:outline-none">
                <X className="w-3 h-3" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Content Area */}
          <div className={cn("p-6", noPadding && "p-0")}>{children}</div>
        </DialogPrimitive.Content>
      </Draggable>
    </DialogPortal>
  );
});
DraggableDialogContent.displayName = "DraggableDialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DraggableDialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
