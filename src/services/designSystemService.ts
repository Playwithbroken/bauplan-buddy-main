/**
 * Design System Initialization Service
 * Initializes all design system services on app load
 * Ensures consistent theming, branding, and UX across the application
 */

import brandingService from './brandingService';
import densityService from './densityService';

/**
 * Initialize all design system services
 * Call this once when the app loads
 */
export function initializeDesignSystem(): void {
  // Initialize branding (theme colors, logo, company name)
  brandingService.initializeBranding();

  // Initialize content density mode
  densityService.initializeDensity();

  // Set up theme change listener for re-applying contrast-safe colors
  const handleThemeChange = () => {
    const config = brandingService.loadBranding();
    brandingService.saveBranding(config); // Re-apply with contrast checking
  };

  // Listen for theme changes (light/dark mode)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        handleThemeChange();
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // Auto-adjust density based on screen size on first load
  if (!localStorage.getItem('bauplan_content_density')) {
    const recommended = densityService.getRecommendedDensity();
    densityService.setDensityMode(recommended);
  }

  // Handle window resize for responsive density suggestions
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Don't auto-change if user has explicitly set a preference
      if (!localStorage.getItem('bauplan_density_user_set')) {
        const recommended = densityService.getRecommendedDensity();
        const current = densityService.getDensityMode();
        
        if (recommended !== current) {
          // Show a subtle notification that density could be adjusted
          console.log(`Recommended density for current screen size: ${recommended}`);
        }
      }
    }, 500);
  });

  console.log('✅ Design System initialized');
}

/**
 * Reset all design system settings to defaults
 */
export function resetDesignSystem(): void {
  brandingService.resetBranding();
  densityService.setDensityMode('comfortable');
  localStorage.removeItem('bauplan_density_user_set');
  console.log('🔄 Design System reset to defaults');
}

/**
 * Export design system configuration
 * Useful for backup or migration
 */
export function exportDesignSystemConfig(): string {
  const config = {
    branding: brandingService.loadBranding(),
    density: densityService.getDensityMode(),
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Import design system configuration
 */
export function importDesignSystemConfig(configJson: string): boolean {
  try {
    const config = JSON.parse(configJson);

    if (config.branding) {
      brandingService.saveBranding(config.branding);
    }

    if (config.density) {
      densityService.setDensityMode(config.density);
    }

    if (config.theme) {
      const root = document.documentElement;
      if (config.theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    console.log('✅ Design System config imported successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to import design system config:', error);
    return false;
  }
}

/**
 * Get current design system status
 */
export function getDesignSystemStatus() {
  return {
    branding: brandingService.loadBranding(),
    density: densityService.getDensityMode(),
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768,
      isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
      isDesktop: window.innerWidth >= 1024,
    },
    accessibility: {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
    },
  };
}

const designSystemService = {
  initialize: initializeDesignSystem,
  reset: resetDesignSystem,
  export: exportDesignSystemConfig,
  import: importDesignSystemConfig,
  getStatus: getDesignSystemStatus,
};

export default designSystemService;
