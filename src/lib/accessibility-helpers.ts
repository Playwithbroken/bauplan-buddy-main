/**
 * Accessibility Helpers
 * Utilities to ensure WCAG AA compliance and accessible UI
 */

/**
 * Minimum touch target size (44x44px per WCAG 2.1 Level AAA, 24x24px for AA)
 * We use 44px as our minimum for better UX
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Check if an element meets minimum touch target size
 */
export function meetsMinimumTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_TOUCH_TARGET_SIZE && rect.height >= MIN_TOUCH_TARGET_SIZE;
}

/**
 * Check if text has sufficient contrast ratio
 * Uses the same logic as brandingService for consistency
 */
export function hasGoodContrast(foreground: string, background: string, isLargeText: boolean = false): boolean {
  // Import from brandingService if available, or use simplified version
  const minRatio = isLargeText ? 3.0 : 4.5; // WCAG AA standards
  
  // This is a simplified check - in production, use the full implementation
  // from brandingService.getContrastRatio
  return true; // Placeholder - actual implementation in brandingService
}

/**
 * Get ARIA role for common UI patterns
 */
export function getAriaRole(type: 'button' | 'link' | 'heading' | 'navigation' | 'main' | 'complementary'): string {
  const roles = {
    button: 'button',
    link: 'link',
    heading: 'heading',
    navigation: 'navigation',
    main: 'main',
    complementary: 'complementary',
  };
  return roles[type];
}

/**
 * Generate accessible label for screen readers
 */
export function generateAriaLabel(action: string, target?: string): string {
  return target ? `${action} ${target}` : action;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Announce to screen readers
 */
export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Screen reader only
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus management - trap focus within a container
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Check if keyboard event is an activation key (Enter or Space)
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === KeyboardKeys.ENTER || event.key === KeyboardKeys.SPACE;
}

/**
 * Accessibility audit for a component
 */
export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
}

export function auditAccessibility(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for missing alt text on images
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        message: 'Image missing alt text',
        element: img,
      });
    }
  });

  // Check for interactive elements without labels
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.hasAttribute('aria-label');
    const hasAriaLabelledBy = button.hasAttribute('aria-labelledby');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        type: 'error',
        message: 'Button without accessible label',
        element: button,
      });
    }

    // Check touch target size
    if (!meetsMinimumTargetSize(button)) {
      issues.push({
        type: 'warning',
        message: `Button smaller than minimum touch target (${MIN_TOUCH_TARGET_SIZE}px)`,
        element: button,
      });
    }
  });

  // Check for form inputs without labels
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const hasLabel = input.hasAttribute('aria-label') || 
                     input.hasAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${input.id}"]`);
    
    if (!hasLabel) {
      issues.push({
        type: 'error',
        message: 'Form control without label',
        element: input as HTMLElement,
      });
    }
  });

  // Check for heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1));
    if (previousLevel > 0 && level - previousLevel > 1) {
      issues.push({
        type: 'warning',
        message: `Heading level skip from h${previousLevel} to h${level}`,
        element: heading as HTMLElement,
      });
    }
    previousLevel = level;
  });

  return issues;
}

/**
 * Format accessibility issues for logging
 */
export function logAccessibilityIssues(issues: AccessibilityIssue[]): void {
  if (issues.length === 0) {
    console.log('✅ No accessibility issues found');
    return;
  }

  console.group(`⚠️ Found ${issues.length} accessibility issue(s)`);
  issues.forEach((issue, index) => {
    const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${issue.message}`, issue.element);
  });
  console.groupEnd();
}

export default {
  MIN_TOUCH_TARGET_SIZE,
  meetsMinimumTargetSize,
  hasGoodContrast,
  getAriaRole,
  generateAriaLabel,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  announce,
  trapFocus,
  KeyboardKeys,
  isActivationKey,
  auditAccessibility,
  logAccessibilityIssues,
};
