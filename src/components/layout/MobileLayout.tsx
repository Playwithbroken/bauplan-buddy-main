import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileUI, useResponsiveBreakpoint, useOrientation, useSafeArea } from '@/hooks/useMobileUI';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronLeft } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  headerActions?: React.ReactNode;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  onBackClick,
  showMenuButton = true,
  onMenuClick,
  headerActions,
  enablePullToRefresh = false,
  onRefresh,
  className
}) => {
  const { 
    elementRef, 
    isMobile, 
    isTablet, 
    triggerHapticFeedback 
  } = useMobileUI({
    enablePullToRefresh,
    onRefresh,
    optimizeElement: true,
    enableTouchFeedback: true
  });

  const { breakpoint } = useResponsiveBreakpoint();
  const { orientation } = useOrientation();
  const safeArea = useSafeArea();

  const handleBackClick = () => {
    triggerHapticFeedback(10);
    onBackClick?.();
  };

  const handleMenuClick = () => {
    triggerHapticFeedback(10);
    onMenuClick?.();
  };

  return (
    <div 
      ref={elementRef}
      className={cn(
        'min-h-screen bg-background',
        'flex flex-col',
        orientation === 'landscape' && isMobile && 'landscape-optimize',
        className
      )}
      style={{
        paddingTop: safeArea.top,
        paddingLeft: safeArea.left,
        paddingRight: safeArea.right,
        paddingBottom: safeArea.bottom
      }}
    >
      {/* Mobile Header */}
      {(isMobile || isTablet) && (
        <header className={cn(
          'sticky top-0 z-50',
          'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          'border-b border-border',
          'px-4 py-3',
          'flex items-center justify-between',
          'min-h-[56px]'
        )}>
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="mobile-button p-2 h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            
            {showMenuButton && !showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMenuClick}
                className="mobile-button p-2 h-10 w-10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            {title && (
              <h1 className="text-lg font-semibold truncate">{title}</h1>
            )}
          </div>
          
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </header>
      )}

      {/* Main Content */}
      <main className={cn(
        'flex-1',
        isMobile && 'mobile-scroll',
        orientation === 'landscape' && isMobile && 'landscape-content'
      )}>
        {children}
      </main>
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = '4',
  className
}) => {
  const { breakpoint } = useResponsiveBreakpoint();
  
  const getGridCols = () => {
    switch (breakpoint) {
      case 'mobile':
        return `grid-cols-${cols.mobile}`;
      case 'tablet':
        return `grid-cols-${cols.tablet}`;
      default:
        return `grid-cols-${cols.desktop}`;
    }
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  );
};

interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  className?: string;
  interactive?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  subtitle,
  action,
  onTap,
  onLongPress,
  className,
  interactive = false
}) => {
  const { addTouchFeedback, triggerHapticFeedback } = useMobileUI();
  const cardRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (card && interactive) {
      addTouchFeedback(card);
    }
  }, [addTouchFeedback, interactive]);

  const handleClick = () => {
    if (onTap) {
      triggerHapticFeedback(10);
      onTap();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      triggerHapticFeedback([10, 100, 10]);
      onLongPress();
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-card text-card-foreground rounded-lg border shadow-sm',
        'p-4 mobile-spacing',
        interactive && 'cursor-pointer touch-target card-interactive',
        interactive && 'hover:shadow-md transition-shadow',
        className
      )}
      onClick={handleClick}
      onContextMenu={handleLongPress}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {title && (
              <h3 className="font-semibold text-base leading-none tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="ml-2 flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.3, 0.7, 0.95],
  initialSnap = 1
}) => {
  const { isMobile, triggerHapticFeedback } = useMobileUI();
  const [currentSnap, setCurrentSnap] = React.useState(initialSnap);
  
  if (!isMobile) return null;

  const handleClose = () => {
    triggerHapticFeedback(10);
    onClose();
  };

  const snapHeight = `${snapPoints[currentSnap] * 100}vh`;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleClose}
        />
      )}
      
      {/* Bottom Sheet */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background rounded-t-xl border-t',
        'transform transition-transform duration-300 ease-out',
        isOpen ? 'translate-y-0' : 'translate-y-full'
      )} style={{ height: snapHeight }}>
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">{title}</h2>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-auto mobile-scroll p-4">
          {children}
        </div>
      </div>
    </>
  );
};

interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  leftActions,
  rightActions,
  onSwipeLeft,
  onSwipeRight,
  className
}) => {
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const { onSwipe, triggerHapticFeedback } = useMobileUI();

  onSwipe((direction) => {
    if (direction.direction === 'left' && onSwipeLeft) {
      triggerHapticFeedback(10);
      onSwipeLeft();
    } else if (direction.direction === 'right' && onSwipeRight) {
      triggerHapticFeedback(10);
      onSwipeRight();
    }
  });

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left Actions */}
      {leftActions && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center bg-red-500 text-white px-4">
          {leftActions}
        </div>
      )}
      
      {/* Right Actions */}
      {rightActions && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center bg-green-500 text-white px-4">
          {rightActions}
        </div>
      )}
      
      {/* Main Content */}
      <div 
        className="relative bg-background transition-transform duration-200"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;