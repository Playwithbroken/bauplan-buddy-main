/**
 * Virtualized List Component
 * Performance-optimized list for rendering large datasets
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface VirtualizedListProps<T> {
  /** Items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Total height of the container */
  containerHeight: number;
  /** Number of items to render beyond visible area */
  overscan?: number;
  /** Render function for each item */
  renderItem: (item: T, index: number, style: React.CSSProperties) => ReactNode;
  /** Key extractor function */
  getItemKey: (item: T, index: number) => string | number;
  /** Optional class name */
  className?: string;
  /** Called when scrolling near the end */
  onEndReached?: () => void;
  /** Threshold for end reached callback (pixels from end) */
  endReachedThreshold?: number;
  /** Empty state component */
  emptyComponent?: ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Loading component */
  loadingComponent?: ReactNode;
  /** Header component (sticky) */
  headerComponent?: ReactNode;
  /** Footer component */
  footerComponent?: ReactNode;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  getItemKey,
  className,
  onEndReached,
  endReachedThreshold = 100,
  emptyComponent,
  isLoading,
  loadingComponent,
  headerComponent,
  footerComponent,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [hasCalledEndReached, setHasCalledEndReached] = useState(false);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(
      items.length - 1,
      startIndex + visibleCount + overscan * 2
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);

      // Check if near end
      if (onEndReached && !hasCalledEndReached) {
        const scrollBottom = newScrollTop + containerHeight;
        if (scrollBottom >= totalHeight - endReachedThreshold) {
          setHasCalledEndReached(true);
          onEndReached();
        }
      }
    },
    [
      containerHeight,
      totalHeight,
      endReachedThreshold,
      onEndReached,
      hasCalledEndReached,
    ]
  );

  // Reset end reached flag when items change
  useEffect(() => {
    setHasCalledEndReached(false);
  }, [items.length]);

  // Scroll to item
  const scrollToItem = useCallback(
    (index: number, align: "start" | "center" | "end" = "start") => {
      if (!containerRef.current) return;

      let targetScroll = index * itemHeight;

      if (align === "center") {
        targetScroll -= containerHeight / 2 - itemHeight / 2;
      } else if (align === "end") {
        targetScroll -= containerHeight - itemHeight;
      }

      containerRef.current.scrollTop = Math.max(0, targetScroll);
    },
    [itemHeight, containerHeight]
  );

  // Get visible items
  const visibleItems = useMemo(() => {
    const result: { item: T; index: number; style: React.CSSProperties }[] = [];

    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          style: {
            position: "absolute",
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          },
        });
      }
    }

    return result;
  }, [items, visibleRange, itemHeight]);

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <p className="text-muted-foreground">Keine Einträge vorhanden</p>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height: containerHeight }}
      >
        {loadingComponent || (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Laden...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto relative", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Header */}
      {headerComponent && (
        <div className="sticky top-0 z-10 bg-background">{headerComponent}</div>
      )}

      {/* Virtual container */}
      <div
        style={{
          height: totalHeight,
          position: "relative",
        }}
      >
        {visibleItems.map(({ item, index, style }) => (
          <div key={getItemKey(item, index)} style={style}>
            {renderItem(item, index, style)}
          </div>
        ))}
      </div>

      {/* Footer */}
      {footerComponent && <div>{footerComponent}</div>}

      {/* Loading indicator at bottom */}
      {isLoading && items.length > 0 && (
        <div className="flex items-center justify-center py-4">
          {loadingComponent || (
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for virtualized list scrolling
 */
export function useVirtualizedScroll(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + 1);

  const scrollToIndex = useCallback(
    (index: number) => {
      setScrollTop(Math.max(0, index * itemHeight));
    },
    [itemHeight]
  );

  return {
    scrollTop,
    setScrollTop,
    startIndex,
    endIndex,
    visibleCount,
    scrollToIndex,
    totalHeight: itemCount * itemHeight,
  };
}

export default VirtualizedList;
