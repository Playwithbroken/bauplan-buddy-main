export interface TouchGesture {
  type: 'tap' | 'long-press' | 'swipe' | 'pinch' | 'pan';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  force?: number;
  target: HTMLElement;
}

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  velocity: number;
  distance: number;
}

export interface MobileViewport {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
}

export interface TouchInteractionConfig {
  enableSwipeGestures: boolean;
  enableLongPress: boolean;
  enablePinchZoom: boolean;
  longPressDelay: number;
  swipeThreshold: number;
  preventIOSBounce: boolean;
  enableTouchFeedback: boolean;
}

export class MobileUIService {
  private static instance: MobileUIService;
  private config: TouchInteractionConfig;
  private viewport: MobileViewport;
  private touchStartTime: number = 0;
  private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 };
  private longPressTimer: NodeJS.Timeout | null = null;
  private isLongPressing: boolean = false;
  private gestureListeners: Map<string, ((gesture: TouchGesture) => void)[]> = new Map();

  static getInstance(): MobileUIService {
    if (!MobileUIService.instance) {
      MobileUIService.instance = new MobileUIService();
    }
    return MobileUIService.instance;
  }

  constructor() {
    this.config = {
      enableSwipeGestures: true,
      enableLongPress: true,
      enablePinchZoom: false,
      longPressDelay: 800,
      swipeThreshold: 50,
      preventIOSBounce: true,
      enableTouchFeedback: true
    };

    this.viewport = this.detectViewport();
    this.initializeTouchHandlers();
    this.setupResponsiveUtilities();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.viewport = this.detectViewport();
        this.broadcastViewportChange();
      }, 100);
    });

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.viewport = this.detectViewport();
      this.broadcastViewportChange();
    });
  }

  private detectViewport(): MobileViewport {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const devicePixelRatio = window.devicePixelRatio || 1;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    return {
      width,
      height,
      orientation,
      devicePixelRatio,
      isTouch,
      isMobile,
      isTablet
    };
  }

  private initializeTouchHandlers(): void {
    if (!this.viewport.isTouch) return;

    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Prevent iOS bounce effect if enabled
    if (this.config.preventIOSBounce && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) e.preventDefault();
      }, { passive: false });
    }

    // Add touch feedback styles
    if (this.config.enableTouchFeedback) {
      this.addTouchFeedbackStyles();
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
    this.isLongPressing = false;

    if (this.config.enableLongPress) {
      this.longPressTimer = setTimeout(() => {
        this.isLongPressing = true;
        this.triggerGesture({
          type: 'long-press',
          startX: touch.clientX,
          startY: touch.clientY,
          endX: touch.clientX,
          endY: touch.clientY,
          duration: Date.now() - this.touchStartTime,
          target: event.target as HTMLElement
        });
      }, this.config.longPressDelay);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Add haptic feedback for supported devices
    if ('vibrate' in navigator && this.config.enableTouchFeedback) {
      navigator.vibrate(1);
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (this.isLongPressing) {
      this.isLongPressing = false;
      return;
    }

    const touch = event.changedTouches[0];
    const duration = Date.now() - this.touchStartTime;
    const deltaX = touch.clientX - this.touchStartPosition.x;
    const deltaY = touch.clientY - this.touchStartPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < 10 && duration < 300) {
      // This is a tap
      this.triggerGesture({
        type: 'tap',
        startX: this.touchStartPosition.x,
        startY: this.touchStartPosition.y,
        endX: touch.clientX,
        endY: touch.clientY,
        duration,
        target: event.target as HTMLElement
      });
    } else if (this.config.enableSwipeGestures && distance > this.config.swipeThreshold) {
      // This is a swipe
      const swipeDirection = this.determineSwipeDirection(deltaX, deltaY);
      const velocity = distance / duration;

      this.triggerGesture({
        type: 'swipe',
        startX: this.touchStartPosition.x,
        startY: this.touchStartPosition.y,
        endX: touch.clientX,
        endY: touch.clientY,
        duration,
        target: event.target as HTMLElement
      });
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.isLongPressing = false;
  }

  private determineSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / 100; // Simplified velocity calculation

    if (absX > absY) {
      return {
        direction: deltaX > 0 ? 'right' : 'left',
        velocity,
        distance
      };
    } else {
      return {
        direction: deltaY > 0 ? 'down' : 'up',
        velocity,
        distance
      };
    }
  }

  private triggerGesture(gesture: TouchGesture): void {
    const listeners = this.gestureListeners.get(gesture.type) || [];
    listeners.forEach(listener => listener(gesture));
  }

  private addTouchFeedbackStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .touch-feedback {
        position: relative;
        overflow: hidden;
      }
      
      .touch-feedback::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.3s ease, height 0.3s ease;
        pointer-events: none;
      }
      
      .touch-feedback:active::after {
        width: 200px;
        height: 200px;
      }
      
      /* Mobile-optimized button styles */
      .mobile-button {
        min-height: 44px;
        min-width: 44px;
        padding: 12px 16px;
        font-size: 16px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Mobile-optimized input styles */
      .mobile-input {
        min-height: 44px;
        font-size: 16px; /* Prevents zoom on iOS */
        padding: 12px 16px;
        border-radius: 8px;
        touch-action: manipulation;
      }
      
      /* Improved scrolling on mobile */
      .mobile-scroll {
        -webkit-overflow-scrolling: touch;
        overflow-y: auto;
        scroll-behavior: smooth;
      }
      
      /* Better touch targets for mobile */
      @media (max-width: 768px) {
        .touch-target {
          min-height: 44px;
          min-width: 44px;
          padding: 8px;
        }
        
        .sidebar-menu-item {
          padding: 16px 20px;
          min-height: 48px;
        }
        
        .card-interactive {
          padding: 20px;
          margin: 8px 0;
        }
        
        /* Optimize spacing for mobile */
        .mobile-spacing {
          padding: 16px;
          margin: 8px 0;
        }
        
        /* Better text sizing for mobile */
        h1 { font-size: 1.75rem; }
        h2 { font-size: 1.5rem; }
        h3 { font-size: 1.25rem; }
        
        /* Improved form elements */
        select, input, textarea {
          font-size: 16px;
          min-height: 44px;
        }
        
        /* Better table handling on mobile */
        .mobile-table {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .mobile-table table {
          min-width: 600px;
        }
      }
      
      /* Tablet-specific optimizations */
      @media (min-width: 768px) and (max-width: 1024px) {
        .tablet-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .tablet-sidebar {
          width: 280px;
        }
      }
      
      /* Landscape mobile optimizations */
      @media (max-width: 768px) and (orientation: landscape) {
        .landscape-optimize {
          height: 100vh;
          overflow: hidden;
        }
        
        .landscape-content {
          height: calc(100vh - 60px);
          overflow-y: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private setupResponsiveUtilities(): void {
    // Add utility classes to body based on device type
    document.body.classList.toggle('is-mobile', this.viewport.isMobile);
    document.body.classList.toggle('is-tablet', this.viewport.isTablet);
    document.body.classList.toggle('is-touch', this.viewport.isTouch);
    document.body.classList.toggle('is-landscape', this.viewport.orientation === 'landscape');
  }

  private broadcastViewportChange(): void {
    const event = new CustomEvent('viewportChange', {
      detail: this.viewport
    });
    window.dispatchEvent(event);
  }

  // Public API methods
  public onGesture(type: TouchGesture['type'], callback: (gesture: TouchGesture) => void): void {
    if (!this.gestureListeners.has(type)) {
      this.gestureListeners.set(type, []);
    }
    this.gestureListeners.get(type)!.push(callback);
  }

  public offGesture(type: TouchGesture['type'], callback: (gesture: TouchGesture) => void): void {
    const listeners = this.gestureListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public getViewport(): MobileViewport {
    return { ...this.viewport };
  }

  public isMobile(): boolean {
    return this.viewport.isMobile;
  }

  public isTablet(): boolean {
    return this.viewport.isTablet;
  }

  public isTouch(): boolean {
    return this.viewport.isTouch;
  }

  public addTouchFeedback(element: HTMLElement): void {
    element.classList.add('touch-feedback');
  }

  public optimizeForMobile(element: HTMLElement): void {
    if (this.viewport.isMobile) {
      element.classList.add('mobile-optimize');
      
      // Add mobile-specific classes
      const buttons = element.querySelectorAll('button, [role="button"]');
      buttons.forEach(btn => btn.classList.add('mobile-button'));
      
      const inputs = element.querySelectorAll('input, select, textarea');
      inputs.forEach(input => input.classList.add('mobile-input'));
      
      const scrollContainers = element.querySelectorAll('[data-scroll]');
      scrollContainers.forEach(container => container.classList.add('mobile-scroll'));
    }
  }

  public enablePullToRefresh(container: HTMLElement, onRefresh: () => Promise<void>): void {
    if (!this.viewport.isTouch) return;

    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    container.addEventListener('touchstart', (e) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    });

    container.addEventListener('touchmove', (e) => {
      if (!isPulling) return;
      
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 100) {
        container.style.transform = `translateY(${Math.min(diff - 100, 50)}px)`;
        container.style.opacity = `${Math.max(0.5, 1 - (diff - 100) / 200)}`;
      }
    });

    container.addEventListener('touchend', async () => {
      if (!isPulling) return;
      
      const diff = currentY - startY;
      if (diff > 100) {
        try {
          await onRefresh();
        } finally {
          container.style.transform = '';
          container.style.opacity = '';
        }
      } else {
        container.style.transform = '';
        container.style.opacity = '';
      }
      
      isPulling = false;
    });
  }

  public updateConfig(newConfig: Partial<TouchInteractionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): TouchInteractionConfig {
    return { ...this.config };
  }

  // Utility method to check if device supports haptic feedback
  public supportsHapticFeedback(): boolean {
    return 'vibrate' in navigator;
  }

  // Utility method to trigger haptic feedback
  public triggerHapticFeedback(pattern: number | number[] = 10): void {
    if (this.supportsHapticFeedback() && this.config.enableTouchFeedback) {
      navigator.vibrate(pattern);
    }
  }
}

// Export singleton instance
export default MobileUIService.getInstance();