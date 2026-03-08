export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  announcements: boolean;
  captions: boolean;
  colorBlindnessSupport: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
}

export interface AccessibilityAudit {
  passed: boolean;
  issues: AccessibilityIssue[];
  score: number;
  lastChecked: Date;
}

export interface AccessibilityIssue {
  id: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  type: 'color-contrast' | 'keyboard-nav' | 'screen-reader' | 'focus-management' | 'semantic-markup';
  element: string;
  description: string;
  solution: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private settings: AccessibilitySettings;
  private observers: MutationObserver[] = [];
  private announcer: HTMLElement | null = null;

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  constructor() {
    this.settings = this.loadSettings();
    this.initialize();
  }

  private initialize(): void {
    this.createLiveRegion();
    this.setupKeyboardNavigation();
    this.applySettings();
    this.monitorAccessibility();
  }

  private loadSettings(): AccessibilitySettings {
    try {
      const stored = localStorage.getItem('accessibility_settings');
      if (stored) {
        return { ...this.getDefaultSettings(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
    return this.getDefaultSettings();
  }

  private getDefaultSettings(): AccessibilitySettings {
    return {
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      keyboardNavigation: true,
      focusVisible: true,
      announcements: true,
      captions: false,
      colorBlindnessSupport: 'none'
    };
  }

  private createLiveRegion(): void {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.style.position = 'absolute';
    this.announcer.style.left = '-10000px';
    this.announcer.style.width = '1px';
    this.announcer.style.height = '1px';
    this.announcer.style.overflow = 'hidden';
    document.body.appendChild(this.announcer);
  }

  private setupKeyboardNavigation(): void {
    // Skip links for main content
    this.addSkipLinks();
    
    // Focus management
    this.setupFocusManagement();
    
    // Keyboard shortcuts
    this.setupAccessibilityShortcuts();
  }

  private addSkipLinks(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      border-radius: 4px;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  private setupFocusManagement(): void {
    let lastFocusedElement: HTMLElement | null = null;
    
    document.addEventListener('focusin', (event) => {
      if (this.settings.focusVisible) {
        const target = event.target as HTMLElement;
        target.classList.add('focus-visible');
        lastFocusedElement = target;
      }
    });

    document.addEventListener('focusout', (event) => {
      const target = event.target as HTMLElement;
      target.classList.remove('focus-visible');
    });

    // Trap focus in modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) {
          this.trapFocus(event, modal as HTMLElement);
        }
      }
    });
  }

  private trapFocus(event: KeyboardEvent, container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        event.preventDefault();
      }
    }
  }

  private setupAccessibilityShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Alt + 1: Skip to main content
      if (event.altKey && event.key === '1') {
        const main = document.getElementById('main-content');
        if (main) {
          main.focus();
          this.announce('Navigated to main content');
        }
      }
      
      // Alt + 2: Skip to navigation
      if (event.altKey && event.key === '2') {
        const nav = document.querySelector('nav');
        if (nav) {
          nav.focus();
          this.announce('Navigated to navigation');
        }
      }
    });
  }

  private applySettings(): void {
    const root = document.documentElement;
    
    // Font size
    root.setAttribute('data-font-size', this.settings.fontSize);
    
    // High contrast
    const prefersDark = root.classList.contains('dark');
    const nextThemeAttribute = this.settings.highContrast
      ? (prefersDark ? 'high-contrast-dark' : 'high-contrast')
      : null;

    root.classList.toggle('hc', this.settings.highContrast);

    if (nextThemeAttribute) {
      root.setAttribute('data-theme', nextThemeAttribute);
    } else if (root.getAttribute('data-theme')?.startsWith('high-contrast')) {
      root.removeAttribute('data-theme');
    }
    
    // Reduced motion
    root.classList.toggle('reduced-motion', this.settings.reducedMotion);
    
    // Color blindness support
    root.setAttribute('data-color-filter', this.settings.colorBlindnessSupport);
    
    this.addAccessibilityStyles();
  }

  private addAccessibilityStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Font size scaling */
      [data-font-size="small"] { font-size: 14px; }
      [data-font-size="medium"] { font-size: 16px; }
      [data-font-size="large"] { font-size: 18px; }
      [data-font-size="extra-large"] { font-size: 20px; }
      
      /* High contrast mode */
      .hc {
        filter: contrast(150%);
      }
      
      .hc button, .hc a {
        border: 2px solid currentColor !important;
      }
      
      /* Reduced motion */
      .reduced-motion *, .reduced-motion *::before, .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      /* Focus indicators */
      .focus-visible {
        outline: 3px solid #005fcc !important;
        outline-offset: 2px !important;
      }
      
      /* Screen reader only content */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      /* Color blindness filters */
      [data-color-filter="deuteranopia"] {
        filter: url('#deuteranopia-filter');
      }
      
      [data-color-filter="protanopia"] {
        filter: url('#protanopia-filter');
      }
      
      [data-color-filter="tritanopia"] {
        filter: url('#tritanopia-filter');
      }
      
      /* Improved button accessibility */
      button, [role="button"] {
        min-height: 44px;
        min-width: 44px;
        cursor: pointer;
      }
      
      button:disabled, [role="button"][aria-disabled="true"] {
        cursor: not-allowed;
        opacity: 0.6;
      }
      
      /* Form accessibility */
      input:invalid {
        border-color: #dc2626;
      }
      
      .error-message {
        color: #dc2626;
        font-size: 0.875rem;
      }
      
      /* Link accessibility */
      a:not(.button) {
        text-decoration: underline;
      }
      
      a:focus {
        outline: 3px solid #005fcc;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  private monitorAccessibility(): void {
    // Monitor for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.auditElement(node as HTMLElement);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(observer);
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.settings.announcements || !this.announcer) return;
    
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
  }

  public updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('accessibility_settings', JSON.stringify(this.settings));
    this.applySettings();
  }

  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  public auditAccessibility(): AccessibilityAudit {
    const issues: AccessibilityIssue[] = [];
    
    // Check color contrast
    this.checkColorContrast(document.body, issues);
    
    // Check keyboard navigation
    this.checkKeyboardNavigation(issues);
    
    // Check ARIA labels
    this.checkAriaLabels(issues);
    
    // Check semantic markup
    this.checkSemanticMarkup(issues);
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const seriousIssues = issues.filter(i => i.severity === 'serious').length;
    
    const score = Math.max(0, 100 - (criticalIssues * 25) - (seriousIssues * 10) - (issues.length * 2));
    
    return {
      passed: criticalIssues === 0 && seriousIssues === 0,
      issues,
      score,
      lastChecked: new Date()
    };
  }

  private checkColorContrast(element: HTMLElement, issues: AccessibilityIssue[]): void {
    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;
    
    // Simple contrast check (in real implementation, use proper contrast calculation)
    if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const contrast = this.calculateContrast(color, backgroundColor);
      if (contrast < 4.5) {
        issues.push({
          id: `contrast-${Date.now()}`,
          severity: 'serious',
          type: 'color-contrast',
          element: element.tagName,
          description: `Insufficient color contrast ratio: ${contrast.toFixed(2)}`,
          solution: 'Increase color contrast to at least 4.5:1',
          wcagLevel: 'AA',
          wcagCriterion: '1.4.3'
        });
      }
    }
  }

  private calculateContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In real implementation, use proper color parsing and luminance calculation
    return Math.random() * 10 + 1; // Mock value
  }

  private checkKeyboardNavigation(issues: AccessibilityIssue[]): void {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
    
    interactiveElements.forEach((element) => {
      if (element.getAttribute('tabindex') === '-1' && element.getAttribute('role') !== 'presentation') {
        issues.push({
          id: `keyboard-${Date.now()}`,
          severity: 'moderate',
          type: 'keyboard-nav',
          element: element.tagName,
          description: 'Interactive element not keyboard accessible',
          solution: 'Remove tabindex="-1" or add proper keyboard event handlers',
          wcagLevel: 'A',
          wcagCriterion: '2.1.1'
        });
      }
    });
  }

  private checkAriaLabels(issues: AccessibilityIssue[]): void {
    const elementsNeedingLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby]), button:empty');
    
    elementsNeedingLabels.forEach((element) => {
      issues.push({
        id: `aria-${Date.now()}`,
        severity: 'serious',
        type: 'screen-reader',
        element: element.tagName,
        description: 'Missing accessible name',
        solution: 'Add aria-label, aria-labelledby, or visible text content',
        wcagLevel: 'A',
        wcagCriterion: '4.1.2'
      });
    });
  }

  private checkSemanticMarkup(issues: AccessibilityIssue[]): void {
    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        issues.push({
          id: `heading-${Date.now()}`,
          severity: 'moderate',
          type: 'semantic-markup',
          element: heading.tagName,
          description: 'Heading level skipped',
          solution: 'Use proper heading hierarchy without skipping levels',
          wcagLevel: 'AA',
          wcagCriterion: '1.3.1'
        });
      }
      lastLevel = level;
    });
  }

  private auditElement(element: HTMLElement): void {
    // Add accessibility attributes to dynamically added elements
    if (element.tagName === 'BUTTON' && !element.hasAttribute('aria-label') && !element.textContent?.trim()) {
      console.warn('Button without accessible name:', element);
    }
    
    if (element.tagName === 'IMG' && !element.hasAttribute('alt')) {
      element.setAttribute('alt', '');
    }
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    if (this.announcer) {
      document.body.removeChild(this.announcer);
      this.announcer = null;
    }
  }
}

export default AccessibilityService.getInstance();
