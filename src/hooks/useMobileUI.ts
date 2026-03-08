import { useEffect, useState, useRef, useCallback } from 'react';
import MobileUIService, { TouchGesture, MobileViewport, SwipeDirection } from '@/services/mobileUIService';

export interface UseMobileUIOptions {
  enableSwipe?: boolean;
  enableLongPress?: boolean;
  enableTouchFeedback?: boolean;
  optimizeElement?: boolean;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
}

export interface UseMobileUIReturn {
  viewport: MobileViewport;
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  elementRef: React.RefObject<HTMLDivElement>;
  triggerHapticFeedback: (pattern?: number | number[]) => void;
  addTouchFeedback: (element: HTMLElement) => void;
  onSwipe: (callback: (direction: SwipeDirection) => void) => void;
  onTap: (callback: (position: { x: number; y: number }) => void) => void;
  onLongPress: (callback: (position: { x: number; y: number }) => void) => void;
}

export function useMobileUI(options: UseMobileUIOptions = {}): UseMobileUIReturn {
  const {
    enableSwipe = true,
    enableLongPress = true,
    enableTouchFeedback = true,
    optimizeElement = true,
    enablePullToRefresh = false,
    onRefresh
  } = options;

  const [viewport, setViewport] = useState<MobileViewport>(MobileUIService.getViewport());
  const elementRef = useRef<HTMLDivElement>(null);
  const swipeCallbackRef = useRef<((direction: SwipeDirection) => void) | null>(null);
  const tapCallbackRef = useRef<((position: { x: number; y: number }) => void) | null>(null);
  const longPressCallbackRef = useRef<((position: { x: number; y: number }) => void) | null>(null);

  // Update viewport state when it changes
  useEffect(() => {
    const handleViewportChange = (event: CustomEvent) => {
      setViewport(event.detail);
    };

    window.addEventListener('viewportChange', handleViewportChange as EventListener);
    return () => {
      window.removeEventListener('viewportChange', handleViewportChange as EventListener);
    };
  }, []);

  // Setup element optimization and touch handling
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Optimize element for mobile if requested
    if (optimizeElement && viewport.isMobile) {
      MobileUIService.optimizeForMobile(element);
    }

    // Add touch feedback if requested
    if (enableTouchFeedback && viewport.isTouch) {
      MobileUIService.addTouchFeedback(element);
    }

    // Setup pull-to-refresh if requested
    if (enablePullToRefresh && onRefresh && viewport.isTouch) {
      MobileUIService.enablePullToRefresh(element, onRefresh);
    }
  }, [viewport, optimizeElement, enableTouchFeedback, enablePullToRefresh, onRefresh]);

  // Setup gesture handlers
  useEffect(() => {
    const handleSwipe = (gesture: TouchGesture) => {
      if (swipeCallbackRef.current && gesture.type === 'swipe') {
        const deltaX = gesture.endX - gesture.startX;
        const deltaY = gesture.endY - gesture.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / gesture.duration;

        let direction: SwipeDirection['direction'];
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        swipeCallbackRef.current({
          direction,
          velocity,
          distance
        });
      }
    };

    const handleTap = (gesture: TouchGesture) => {
      if (tapCallbackRef.current && gesture.type === 'tap') {
        tapCallbackRef.current({
          x: gesture.startX,
          y: gesture.startY
        });
      }
    };

    const handleLongPress = (gesture: TouchGesture) => {
      if (longPressCallbackRef.current && gesture.type === 'long-press') {
        longPressCallbackRef.current({
          x: gesture.startX,
          y: gesture.startY
        });
      }
    };

    if (enableSwipe) {
      MobileUIService.onGesture('swipe', handleSwipe);
    }
    
    MobileUIService.onGesture('tap', handleTap);
    
    if (enableLongPress) {
      MobileUIService.onGesture('long-press', handleLongPress);
    }

    return () => {
      if (enableSwipe) {
        MobileUIService.offGesture('swipe', handleSwipe);
      }
      MobileUIService.offGesture('tap', handleTap);
      if (enableLongPress) {
        MobileUIService.offGesture('long-press', handleLongPress);
      }
    };
  }, [enableSwipe, enableLongPress]);

  const triggerHapticFeedback = useCallback((pattern?: number | number[]) => {
    MobileUIService.triggerHapticFeedback(pattern);
  }, []);

  const addTouchFeedback = useCallback((element: HTMLElement) => {
    MobileUIService.addTouchFeedback(element);
  }, []);

  const onSwipe = useCallback((callback: (direction: SwipeDirection) => void) => {
    swipeCallbackRef.current = callback;
  }, []);

  const onTap = useCallback((callback: (position: { x: number; y: number }) => void) => {
    tapCallbackRef.current = callback;
  }, []);

  const onLongPress = useCallback((callback: (position: { x: number; y: number }) => void) => {
    longPressCallbackRef.current = callback;
  }, []);

  return {
    viewport,
    isMobile: viewport.isMobile,
    isTablet: viewport.isTablet,
    isTouch: viewport.isTouch,
    elementRef,
    triggerHapticFeedback,
    addTouchFeedback,
    onSwipe,
    onTap,
    onLongPress
  };
}

// Hook for responsive breakpoints
export function useResponsiveBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop'
  };
}

// Hook for orientation detection
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    updateOrientation();
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation);

    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
}

// Hook for safe area insets (iOS notch, etc.)
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
      });
    };

    updateSafeArea();
    
    // Update on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(updateSafeArea, 100);
    });

    return () => {
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

export default useMobileUI;