import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { popVariants } from "@/lib/animations";
import { useDialogManager } from "@/contexts/DialogManagerContext";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

// Multi-window wrapper that allows multiple dialogs to be open simultaneously
const MultiWindowDialog = ({
  modal = false,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> & {
  modal?: boolean;
}) => <DialogPrimitive.Root modal={modal} {...props} />;

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
      "fixed inset-0 z-[100] bg-[hsl(var(--background)/0.75)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentPosition = { x: number; y: number };

const MIN_DIALOG_WIDTH = 320;
const MIN_DIALOG_HEIGHT = 240;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1200;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideDefaultClose?: boolean;
    preventOutsideClose?: boolean;
    draggable?: boolean;
    resizable?: boolean;
    initialPosition?: DialogContentPosition;
    disableMotionTransform?: boolean;
    modal?: boolean;
  }
>(
  (
    {
      className,
      children,
      hideDefaultClose,
      preventOutsideClose = true,
      draggable = true,
      resizable,
      initialPosition,
      disableMotionTransform,
      onMouseDown,
      style,
      modal,
      ...props
    },
    ref
  ) => {
    const dialogId = React.useId();
    const {
      registerDialog,
      unregisterDialog,
      focusDialog,
      getZIndex,
      activeDialogId,
    } = useDialogManager();

    const isActive = activeDialogId === dialogId;

    React.useEffect(() => {
      registerDialog(dialogId);
      return () => unregisterDialog(dialogId);
    }, [dialogId, registerDialog, unregisterDialog]);

    const zIndex = getZIndex(dialogId);

    const [position, setPosition] = React.useState<DialogContentPosition>(
      initialPosition ?? { x: 0, y: 0 }
    );
    const [dimensions, setDimensions] = React.useState<{
      width?: number;
      height?: number;
    }>({});
    const [interactionMode, setInteractionMode] = React.useState<
      "drag" | "resize" | null
    >(null);
    const dragOriginRef = React.useRef({ screenX: 0, screenY: 0, x: 0, y: 0 });
    const resizeOriginRef = React.useRef({
      screenX: 0,
      screenY: 0,
      width: 0,
      height: 0,
      positionX: 0,
      positionY: 0,
      direction: "se",
    });
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        contentRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    React.useEffect(() => {
      if (initialPosition) {
        setPosition(initialPosition);
      }
    }, [initialPosition?.x, initialPosition?.y]);

    const startDrag = React.useCallback(
      (event: React.MouseEvent) => {
        if (!draggable) return;
        dragOriginRef.current = {
          screenX: event.screenX,
          screenY: event.screenY,
          x: position.x,
          y: position.y,
        };
        setInteractionMode("drag");
      },
      [draggable, position]
    );

    const startResize = React.useCallback(
      (event: React.MouseEvent, direction: string) => {
        if (!resizable || !contentRef.current) return;
        const rect = contentRef.current.getBoundingClientRect();
        resizeOriginRef.current = {
          screenX: event.screenX,
          screenY: event.screenY,
          width: rect.width,
          height: rect.height,
          positionX: position.x,
          positionY: position.y,
          direction,
        };
        setDimensions({ width: rect.width, height: rect.height });
        setInteractionMode("resize");
      },
      [position, resizable]
    );

    React.useEffect(() => {
      if (!interactionMode) return;

      const handleMouseMove = (event: MouseEvent) => {
        if (interactionMode === "drag" && draggable) {
          const deltaX = event.screenX - dragOriginRef.current.screenX;
          const deltaY = event.screenY - dragOriginRef.current.screenY;
          setPosition({
            x: dragOriginRef.current.x + deltaX,
            y: dragOriginRef.current.y + deltaY,
          });
          return;
        }

        if (interactionMode === "resize" && resizable) {
          const {
            screenX,
            screenY,
            width,
            height,
            positionX,
            positionY,
            direction,
          } = resizeOriginRef.current;
          const deltaX = event.screenX - screenX;
          const deltaY = event.screenY - screenY;

          let nextWidth = width;
          let nextHeight = height;

          if (direction.includes("e")) nextWidth = width + deltaX;
          if (direction.includes("w")) nextWidth = width - deltaX;
          if (direction.includes("s")) nextHeight = height + deltaY;
          if (direction.includes("n")) nextHeight = height - deltaY;

          const maxWidth =
            typeof window !== "undefined"
              ? Math.max(MIN_DIALOG_WIDTH, window.innerWidth - 32)
              : DEFAULT_MAX_WIDTH;
          const maxHeight =
            typeof window !== "undefined"
              ? Math.max(MIN_DIALOG_HEIGHT, window.innerHeight - 32)
              : DEFAULT_MAX_HEIGHT;

          nextWidth = Math.max(MIN_DIALOG_WIDTH, Math.min(nextWidth, maxWidth));
          nextHeight = Math.max(
            MIN_DIALOG_HEIGHT,
            Math.min(nextHeight, maxHeight)
          );

          const widthDelta = nextWidth - width;
          const heightDelta = nextHeight - height;

          let nextX = positionX;
          let nextY = positionY;

          if (direction.includes("e")) {
            nextX = positionX + widthDelta / 2;
          } else if (direction.includes("w")) {
            nextX = positionX - widthDelta / 2;
          }

          if (direction.includes("s")) {
            nextY = positionY + heightDelta / 2;
          } else if (direction.includes("n")) {
            nextY = positionY - heightDelta / 2;
          }

          setDimensions({ width: nextWidth, height: nextHeight });
          setPosition({ x: nextX, y: nextY });
        }
      };

      const handleMouseUp = () => {
        setInteractionMode(null);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor =
        interactionMode === "drag"
          ? "move"
          : resizeOriginRef.current.direction.includes("n") ||
            resizeOriginRef.current.direction.includes("s")
          ? resizeOriginRef.current.direction.includes("e") ||
            resizeOriginRef.current.direction.includes("w")
            ? "nwse-resize"
            : "ns-resize"
          : "ew-resize";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
    }, [interactionMode, draggable, resizable]);

    const handleContentMouseDown = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        onMouseDown?.(event);
        if (event.defaultPrevented || !draggable) return;
        const target = event.target as HTMLElement;
        const handle = target?.closest("[data-dialog-drag-handle]");
        const isDialogBackground = target === event.currentTarget;

        if (!handle && !isDialogBackground) return;
        event.preventDefault();
        startDrag(event);
      },
      [draggable, onMouseDown, startDrag]
    );

    const shouldDisableTransformAnimation =
      disableMotionTransform || draggable || resizable;

    const isDefaultPosition = position.x === 0 && position.y === 0;

    const transformValue = isDefaultPosition
      ? "translate(-50%, -50%)"
      : `translate3d(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px), 0)`;

    const combinedStyle: React.CSSProperties = {
      ...(style ?? {}),
      ...((draggable || resizable) && !disableMotionTransform
        ? {
            transform: transformValue,
          }
        : {}),
      ...(resizable && typeof dimensions.width === "number"
        ? { width: `${dimensions.width}px` }
        : {}),
      ...(resizable && typeof dimensions.height === "number"
        ? { height: `${dimensions.height}px` }
        : {}),
    };

    return (
      <DialogPortal>
        {modal && <DialogOverlay />}
        <DialogPrimitive.Content
          ref={setRefs}
          className={cn(
            "fixed left-1/2 z-[101] grid w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-0 rounded-[calc(var(--radius)*1.5)] border border-border/50 bg-card/95 backdrop-blur-xl shadow-layered-xl transition-all duration-300 ease-out max-h-[95vh] overflow-hidden",
            isActive
              ? "border-primary/50 ring-1 ring-primary/20 shadow-primary/10"
              : "opacity-90 grayscale-[0.2]",
            shouldDisableTransformAnimation ? "top-1/2" : "top-[40%]",
            shouldDisableTransformAnimation
              ? "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
              : "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-[38%] data-[state=closed]:slide-out-to-top-[38%]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background motion-reduce:transition-none sm:max-w-xl sm:rounded-[calc(var(--radius)*1.5)]",
            interactionMode && "transition-none",
            className
          )}
          onInteractOutside={
            preventOutsideClose ? (e) => e.preventDefault() : undefined
          }
          onEscapeKeyDown={
            preventOutsideClose ? (e) => e.preventDefault() : undefined
          }
          onMouseDown={(e) => {
            handleContentMouseDown(e);
            focusDialog(dialogId);
          }}
          style={{ ...combinedStyle, zIndex }}
          {...props}
        >
          {children}
          {!hideDefaultClose && (
            <DialogPrimitive.Close
              aria-label="Dialog schliessen"
              className="absolute right-4 top-4 rounded-[var(--radius)] border border-transparent p-1.5 text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:pointer-events-none"
              data-dialog-drag-ignore
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Schliessen</span>
            </DialogPrimitive.Close>
          )}

          {resizable && (
            <>
              <span
                aria-hidden="true"
                className="absolute top-0 left-4 right-4 h-1 cursor-ns-resize hover:bg-primary/20 transition-colors"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize(event, "n");
                }}
              />
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-4 right-4 h-1 cursor-ns-resize hover:bg-primary/20 transition-colors"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize(event, "s");
                }}
              />
              <span
                aria-hidden="true"
                className="absolute left-0 top-4 bottom-4 w-1 cursor-ew-resize hover:bg-primary/20 transition-colors"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize(event, "w");
                }}
              />
              <span
                aria-hidden="true"
                className="absolute right-0 top-4 bottom-4 w-1 cursor-ew-resize hover:bg-primary/20 transition-colors"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize(event, "e");
                }}
              />
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize(event, "nw");
                }}
              />
              <span
                aria-hidden="true"
                className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize(event, "ne");
                }}
              />
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize(event, "sw");
                }}
              />
              <span
                aria-hidden="true"
                className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startResize(event, "se");
                }}
              />
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left cursor-move",
      className
    )}
    data-dialog-drag-handle
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
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
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
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    data-dialog-drag-handle
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
  MultiWindowDialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
