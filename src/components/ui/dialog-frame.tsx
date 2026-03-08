import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Minus, X, Move } from "lucide-react";
import { cn } from "@/lib/utils";

type WidthVariant =
  | "max-w-sm"
  | "max-w-xl"
  | "max-w-2xl"
  | "max-w-3xl"
  | "max-w-4xl"
  | "max-w-5xl"
  | "max-w-6xl"
  | "max-w-7xl"
  | "max-w-[95vw]"
  | "max-w-[98vw]"
  | "fit-content"
  | "auto";
type WindowState = "normal" | "minimized" | "maximized";

interface DialogFrameProps {
  title: React.ReactNode;
  width?: WidthVariant;
  description?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  fullscreen?: boolean;
  showFullscreenToggle?: boolean;
  showMinimizeToggle?: boolean;
  defaultFullscreen?: boolean;
  resizable?: boolean;
  onClose?: () => void;
  minWidth?: number;
  maxWidth?: number;
  preventOutsideClose?: boolean;
  storageKey?: string; // Key for localStorage persistence
  modal?: boolean;
}

export function DialogFrame({
  title,
  width = "max-w-5xl",
  description,
  headerActions,
  children,
  footer,
  fullscreen,
  showFullscreenToggle = true,
  showMinimizeToggle = true,
  defaultFullscreen,
  resizable = true,
  onClose,
  minWidth = 320,
  maxWidth,
  preventOutsideClose = true,
  storageKey,
  modal = false,
}: DialogFrameProps) {
  // Generate a storage key from title if not provided, but only if it's a string
  const finalStorageKey =
    storageKey ||
    (typeof title === "string"
      ? `dialog-state-${title.replace(/\s+/g, "-").toLowerCase()}`
      : undefined);

  const [windowState, setWindowState] = useState<WindowState>(
    defaultFullscreen ? "maximized" : "normal"
  );

  // Initialize state from localStorage or defaults
  const [size, setSize] = useState(() => {
    if (typeof window !== "undefined" && finalStorageKey) {
      const saved = localStorage.getItem(finalStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.width && parsed.height)
            return { width: parsed.width, height: parsed.height };
        } catch (e) {
          console.error("Failed to parse dialog state", e);
        }
      }
    }
    return { width: 0, height: 0 };
  });

  const [position, setPosition] = useState(() => {
    if (typeof window !== "undefined" && finalStorageKey) {
      const saved = localStorage.getItem(finalStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Validate position is somewhat on screen
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            return { x: parsed.x, y: parsed.y };
          }
        } catch (e) {
          console.error("Failed to parse dialog state", e);
        }
      }
    }
    return { x: 0, y: 0 };
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const isMaximized = fullscreen ?? windowState === "maximized";
  const isMinimized = windowState === "minimized";
  const isResizing = useRef(false);
  const isDragging = useRef(false);
  const resizeDirection = useRef<string>("");
  const startPos = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
  });
  const isFitContent = width === "fit-content" || width === "auto";

  // Persist state changes
  useEffect(() => {
    if (
      finalStorageKey &&
      !isMaximized &&
      !isMinimized &&
      (size.width > 0 || position.x !== 0)
    ) {
      const stateToSave = {
        width: size.width,
        height: size.height,
        x: position.x,
        y: position.y,
      };
      localStorage.setItem(finalStorageKey, JSON.stringify(stateToSave));
    }
  }, [finalStorageKey, size, position, isMaximized, isMinimized]);

  // Auto-calculate size for fit-content mode ONLY if no saved size exists
  useEffect(() => {
    if (
      isFitContent &&
      contentRef.current &&
      !isMaximized &&
      !isMinimized &&
      size.width === 0
    ) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // If we have user-resized dimensions, don't auto-resize
          if (size.width > 0 && size.height > 0) return;

          const { width: contentWidth, height: contentHeight } =
            entry.contentRect;

          // Calculate optimal size based on content
          const optimalWidth = Math.min(
            Math.max(contentWidth + 48, minWidth), // Add padding
            maxWidth || window.innerWidth * 0.9
          );
          const optimalHeight = Math.min(
            contentHeight + 200, // Add space for header/footer
            window.innerHeight * 0.85
          );

          setSize({ width: optimalWidth, height: optimalHeight });
        }
      });

      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFitContent, isMaximized, isMinimized, size.width]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === "Escape" && onClose) {
        // Only close if not maximized/minimized to prevent accidental closes?
        // Standard behavior is close on escape usually.
        onClose();
      } else if (modifier && e.key === "m") {
        e.preventDefault();
        toggleMaximize();
      } else if (modifier && e.key === "-") {
        e.preventDefault();
        toggleMinimize();
      } else if (modifier && e.key === "w") {
        e.preventDefault();
        if (onClose) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Resize functionality with multi-monitor support
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      if (isMaximized) return;

      e.preventDefault();
      e.stopPropagation();

      isResizing.current = true;
      resizeDirection.current = direction;

      const rect = contentRef.current?.getBoundingClientRect();
      if (rect) {
        startPos.current = {
          x: e.screenX, // Use screenX for multi-monitor support
          y: e.screenY, // Use screenY for multi-monitor support
          width: rect.width,
          height: rect.height,
          posX: position.x,
          posY: position.y,
        };
      }
    },
    [isMaximized, position]
  );

  // Drag-to-move functionality with multi-monitor support
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized || isMinimized) return;

      // Prevent dragging if clicking buttons/inputs
      if (
        (e.target as HTMLElement).closest("button, input, select, textarea")
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      isDragging.current = true;

      const rect = contentRef.current?.getBoundingClientRect();
      if (rect) {
        startPos.current = {
          x: e.screenX, // Use screenX for multi-monitor support
          y: e.screenY, // Use screenY for multi-monitor support
          width: rect.width,
          height: rect.height,
          posX: position.x,
          posY: position.y,
        };
      }
    },
    [isMaximized, isMinimized, position]
  );

  const handleContentMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Check if clicking directly on the DialogContent background (padding area)
      if (e.target === e.currentTarget) {
        handleDragStart(e);
      }
    },
    [handleDragStart]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Handle dragging (move) with multi-monitor support
      if (isDragging.current && contentRef.current) {
        const deltaX = e.screenX - startPos.current.x; // Use screenX
        const deltaY = e.screenY - startPos.current.y; // Use screenY

        const newX = startPos.current.posX + deltaX;
        const newY = startPos.current.posY + deltaY;

        setPosition({ x: newX, y: newY });

        // Snap-to-edge detection (using clientX for viewport detection)
        const snapThreshold = 20;
        if (
          e.clientX < snapThreshold ||
          e.clientX > window.innerWidth - snapThreshold ||
          e.clientY < snapThreshold
        ) {
          document.body.style.cursor = "nwse-resize";
        } else {
          document.body.style.cursor = "move";
        }
      }

      // Handle resizing with multi-monitor support
      if (!isResizing.current || !contentRef.current) return;

      const deltaX = e.screenX - startPos.current.x; // Use screenX
      const deltaY = e.screenY - startPos.current.y; // Use screenY
      const dir = resizeDirection.current;

      let newWidth = startPos.current.width;
      let newHeight = startPos.current.height;

      if (dir.includes("e")) newWidth = startPos.current.width + deltaX;
      if (dir.includes("w")) newWidth = startPos.current.width - deltaX;
      if (dir.includes("s")) newHeight = startPos.current.height + deltaY;
      if (dir.includes("n")) newHeight = startPos.current.height - deltaY;

      // Apply min/max constraints
      newWidth = Math.max(
        minWidth,
        Math.min(newWidth, maxWidth || window.innerWidth - 40)
      );
      newHeight = Math.max(320, Math.min(newHeight, window.innerHeight - 40));

      const widthDelta = newWidth - startPos.current.width;
      const heightDelta = newHeight - startPos.current.height;

      let nextX = startPos.current.posX;
      let nextY = startPos.current.posY;

      if (dir.includes("e")) {
        nextX = startPos.current.posX + widthDelta / 2;
      } else if (dir.includes("w")) {
        nextX = startPos.current.posX - widthDelta / 2;
      }

      if (dir.includes("s")) {
        nextY = startPos.current.posY + heightDelta / 2;
      } else if (dir.includes("n")) {
        nextY = startPos.current.posY - heightDelta / 2;
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Snap-to-edge auto-maximize
      if (isDragging.current) {
        const snapThreshold = 10;
        if (e.clientY < snapThreshold) {
          setWindowState("maximized");
          setPosition({ x: 0, y: 0 }); // Reset drag offset
        }
      }

      isResizing.current = false;
      isDragging.current = false;
      resizeDirection.current = "";
    };

    if (isResizing.current || isDragging.current) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      if (isResizing.current) {
        document.body.style.cursor =
          resizeDirection.current.includes("n") ||
          resizeDirection.current.includes("s")
            ? resizeDirection.current.includes("e") ||
              resizeDirection.current.includes("w")
              ? "nwse-resize"
              : "ns-resize"
            : "ew-resize";
      } else if (isDragging.current) {
        document.body.style.cursor = "move";
      }

      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const toggleMinimize = () => {
    setWindowState((prev) => (prev === "minimized" ? "normal" : "minimized"));
  };

  const toggleMaximize = () => {
    setWindowState((prev) => (prev === "maximized" ? "normal" : "maximized"));
  };

  return (
    <DialogContent
      ref={contentRef}
      hideDefaultClose
      preventOutsideClose={preventOutsideClose}
      disableMotionTransform
      draggable={false} // CRITICAL: Disable inner drag to prevent double drift
      resizable={false} // CRITICAL: Disable inner resize
      onMouseDown={handleContentMouseDown}
      modal={modal}
      className={cn(
        "flex flex-col p-0 transition-all duration-300 ease-out overflow-hidden",
        "bg-background/90 backdrop-blur-2xl shadow-layered-xl", // Ultra-premium glass
        "border-border/40",
        isMaximized
          ? "w-screen max-w-none h-[100dvh] max-h-none rounded-none"
          : isFitContent && size.width === 0
          ? "w-fit"
          : width,
        isMaximized ? "" : "max-h-[85vh]",
        isMinimized ? "h-auto w-[300px]" : ""
      )}
      style={{
        transform: isMaximized
          ? "translate3d(-50%, -50%, 0)"
          : `translate3d(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px), 0)`,
        width: !isMaximized && size.width > 0 ? `${size.width}px` : undefined,
        height:
          !isMaximized && !isMinimized && size.height > 0
            ? `${Math.min(size.height, window.innerHeight * 0.95)}px`
            : undefined,
        minWidth: isMaximized ? undefined : `${minWidth}px`,
        maxWidth: !isMaximized && maxWidth ? `${maxWidth}px` : undefined,
        minHeight: isMinimized ? "auto" : isMaximized ? undefined : "320px",
        maxHeight: isMaximized ? undefined : "95vh",
      }}
    >
      {/* Window Header - Always visible, draggable */}
      <DialogHeader
        className="flex-shrink-0 border-b border-border/50 pb-3 pl-4 sm:pl-6 pr-2 sm:pr-3 cursor-move select-none glass-header bg-background/40"
        data-dialog-drag-handle
        onMouseDown={handleDragStart}
        onDoubleClick={toggleMaximize}
      >
        <div className="flex items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Move className="h-4 w-4 text-muted-foreground/70 flex-shrink-0" />
            <DialogTitle className="truncate font-semibold tracking-tight">
              {title}
            </DialogTitle>
            {headerActions}
          </div>

          {/* Window Controls: Close (×), Minimize (—), Maximize (▢) */}
          <div
            className="flex items-center gap-1 flex-shrink-0"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {showMinimizeToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                aria-label={isMinimized ? "Restore window" : "Minimize window"}
                title={isMinimized ? "Restore (Ctrl+-)" : "Minimize (Ctrl+-)"}
                onClick={toggleMinimize}
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}

            {showFullscreenToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                aria-label={isMaximized ? "Exit fullscreen" : "Maximize window"}
                title={isMaximized ? "Restore (Ctrl+M)" : "Maximize (Ctrl+M)"}
                onClick={toggleMaximize}
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}

            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Close window"
                title="Close (Esc)"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>
        {description && !isMinimized && (
          <div className="mt-1 text-xs text-muted-foreground/80">
            {description}
          </div>
        )}
      </DialogHeader>

      {/* Window Body - Hidden when minimized */}
      {!isMinimized && (
        <>
          <ScrollArea className="flex-1 overflow-auto bg-card/50">
            <div className="px-4 sm:px-6 py-4">{children}</div>
          </ScrollArea>

          {/* Window Footer - Hidden when minimized */}
          {footer && (
            <DialogFooter className="flex-shrink-0 border-t border-border/50 bg-muted/20 pt-4 px-4 sm:px-6 pb-4">
              {footer}
            </DialogFooter>
          )}
        </>
      )}

      {/* Resize Handles - Firefox-style */}
      {resizable && !isMaximized && !isMinimized && (
        <>
          {/* Corner handles */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 hover:opacity-100 transition-opacity z-50"
            onMouseDown={(e) => handleResizeStart(e, "se")}
            style={{
              background:
                "linear-gradient(135deg, transparent 50%, rgba(var(--primary), 0.2) 50%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize opacity-0 hover:opacity-100 transition-opacity z-50"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute top-0 right-0 w-6 h-6 cursor-nesw-resize opacity-0 hover:opacity-100 transition-opacity z-50"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize opacity-0 hover:opacity-100 transition-opacity z-50"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />

          {/* Edge handles */}
          <div
            className="absolute top-0 left-4 right-4 h-1.5 cursor-ns-resize hover:bg-primary/20 transition-colors z-40"
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="absolute bottom-0 left-4 right-4 h-1.5 cursor-ns-resize hover:bg-primary/20 transition-colors z-40"
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            className="absolute left-0 top-4 bottom-4 w-1.5 cursor-ew-resize hover:bg-primary/20 transition-colors z-40"
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
          <div
            className="absolute right-0 top-4 bottom-4 w-1.5 cursor-ew-resize hover:bg-primary/20 transition-colors z-40"
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
        </>
      )}
    </DialogContent>
  );
}

export default DialogFrame;
