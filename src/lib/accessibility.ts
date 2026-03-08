/**
 * Accessibility Helpers
 * Utilities for improving accessibility across the application
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Focus trap hook - keeps focus within a container
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute('aria-hidden')
  );
}

/**
 * Hook for roving tab index (keyboard navigation within a group)
 */
export function useRovingTabIndex<T extends HTMLElement>(
  itemCount: number,
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemsRef = useRef<(T | null)[]>([]);

  const setItemRef = useCallback(
    (index: number) => (el: T | null) => {
      itemsRef.current[index] = el;
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = focusedIndex;
      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      if (isVertical && e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (focusedIndex + 1) % itemCount;
      } else if (isVertical && e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (focusedIndex - 1 + itemCount) % itemCount;
      } else if (isHorizontal && e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = (focusedIndex + 1) % itemCount;
      } else if (isHorizontal && e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = (focusedIndex - 1 + itemCount) % itemCount;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = itemCount - 1;
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        itemsRef.current[newIndex]?.focus();
      }
    },
    [focusedIndex, itemCount, orientation]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: setItemRef(index),
      tabIndex: index === focusedIndex ? 0 : -1,
      onKeyDown: handleKeyDown,
      onFocus: () => setFocusedIndex(index),
    }),
    [focusedIndex, handleKeyDown, setItemRef]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    getItemProps,
  };
}

/**
 * Hook for announcing content to screen readers
 */
export function useAnnounce() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer element if it doesn't exist
    let announcer = document.getElementById('sr-announcer') as HTMLDivElement;
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(announcer);
    }

    announcerRef.current = announcer;

    return () => {
      // Don't remove on cleanup, other components might need it
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) return;

    announcerRef.current.setAttribute('aria-live', priority);
    announcerRef.current.textContent = '';
    
    // Use setTimeout to ensure the change is announced
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    }, 100);
  }, []);

  return announce;
}

/**
 * Hook for skip link functionality
 */
export function useSkipLink(targetId: string) {
  const skipToContent = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.addEventListener(
        'blur',
        () => target.removeAttribute('tabindex'),
        { once: true }
      );
    }
  }, [targetId]);

  return skipToContent;
}

/**
 * Hook for managing live regions
 */
export function useLiveRegion(mode: 'polite' | 'assertive' = 'polite') {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((text: string, clearAfter = 5000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(text);

    if (clearAfter > 0) {
      timeoutRef.current = setTimeout(() => setMessage(''), clearAfter);
    }
  }, []);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage('');
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const regionProps = {
    'aria-live': mode,
    'aria-atomic': true,
    role: mode === 'assertive' ? 'alert' : 'status',
  };

  return { message, announce, clear, regionProps };
}

/**
 * Hook for detecting reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/**
 * Hook for detecting high contrast mode
 */
export function useHighContrast(): boolean {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(forced-colors: active)');
    setHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return highContrast;
}

/**
 * Generate unique IDs for accessibility attributes
 */
let idCounter = 0;
export function useUniqueId(prefix = 'bb'): string {
  const idRef = useRef<string>();

  if (!idRef.current) {
    idRef.current = `${prefix}-${++idCounter}`;
  }

  return idRef.current;
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (modifiers.ctrl && !e.ctrlKey) return;
      if (modifiers.shift && !e.shiftKey) return;
      if (modifiers.alt && !e.altKey) return;

      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target.isContentEditable) return;

      e.preventDefault();
      callback();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, callback, modifiers]);
}

/**
 * ARIA props helper for common patterns
 */
export const ariaProps = {
  // For expandable content
  expandable: (isExpanded: boolean, controlsId: string) => ({
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  }),

  // For selected items in a list
  selected: (isSelected: boolean) => ({
    'aria-selected': isSelected,
  }),

  // For current item in navigation
  current: (isCurrent: boolean, type: 'page' | 'step' | 'location' | 'true' = 'page') => ({
    'aria-current': isCurrent ? type : undefined,
  }),

  // For busy/loading states
  busy: (isBusy: boolean) => ({
    'aria-busy': isBusy,
  }),

  // For invalid form fields
  invalid: (isInvalid: boolean, errorId?: string) => ({
    'aria-invalid': isInvalid,
    'aria-describedby': isInvalid && errorId ? errorId : undefined,
  }),

  // For required form fields
  required: (isRequired: boolean) => ({
    'aria-required': isRequired,
  }),

  // For disabled elements
  disabled: (isDisabled: boolean) => ({
    'aria-disabled': isDisabled,
  }),

  // For progress indicators
  progress: (value: number, min = 0, max = 100) => ({
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuetext': `${Math.round((value / max) * 100)}%`,
  }),

  // For modals/dialogs
  modal: (labelId: string, descriptionId?: string) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': labelId,
    'aria-describedby': descriptionId,
  }),
};

export default {
  useFocusTrap,
  getFocusableElements,
  useRovingTabIndex,
  useAnnounce,
  useSkipLink,
  useLiveRegion,
  useReducedMotion,
  useHighContrast,
  useUniqueId,
  useKeyboardShortcut,
  ariaProps,
};
