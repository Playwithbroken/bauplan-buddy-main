/**
 * Content Density Service
 * Manages UI density modes (comfortable/compact) for optimal viewing experience
 */

export type DensityMode = 'comfortable' | 'compact';

const STORAGE_KEY = 'bauplan_content_density';
const DEFAULT_DENSITY: DensityMode = 'comfortable';

/**
 * Density configuration for different UI elements
 */
const DENSITY_CONFIG = {
  comfortable: {
    spacing: {
      section: 'fluid-lg',
      card: 'fluid-md',
      item: 'fluid-sm',
    },
    padding: {
      page: 'p-6',
      card: 'p-6',
      dialog: 'p-6',
      table: 'p-4',
    },
    text: {
      title: 'text-2xl',
      heading: 'text-xl',
      body: 'text-base',
      caption: 'text-sm',
    },
    table: {
      rowHeight: 'h-16',
      cellPadding: 'px-4 py-3',
    },
    button: {
      size: 'default',
      minHeight: 'min-h-[44px]',
    },
  },
  compact: {
    spacing: {
      section: 'fluid-md',
      card: 'fluid-sm',
      item: 'fluid-xs',
    },
    padding: {
      page: 'p-4',
      card: 'p-4',
      dialog: 'p-4',
      table: 'p-2',
    },
    text: {
      title: 'text-xl',
      heading: 'text-lg',
      body: 'text-sm',
      caption: 'text-xs',
    },
    table: {
      rowHeight: 'h-12',
      cellPadding: 'px-3 py-2',
    },
    button: {
      size: 'sm',
      minHeight: 'min-h-[36px]',
    },
  },
} as const;

/**
 * Get current density mode
 */
export function getDensityMode(): DensityMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored === 'comfortable' || stored === 'compact') ? stored : DEFAULT_DENSITY;
}

/**
 * Set density mode
 */
export function setDensityMode(mode: DensityMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
  applyDensityToDOM(mode);
  
  // Dispatch event for components to react
  window.dispatchEvent(new CustomEvent('densitychange', { detail: { mode } }));
}

/**
 * Apply density mode to DOM
 */
function applyDensityToDOM(mode: DensityMode): void {
  const root = document.documentElement;
  root.setAttribute('data-density', mode);
  
  // Set CSS variables for dynamic spacing
  const config = DENSITY_CONFIG[mode];
  root.style.setProperty('--density-page-padding', config.padding.page);
  root.style.setProperty('--density-card-padding', config.padding.card);
  root.style.setProperty('--density-table-row-height', config.table.rowHeight);
}

/**
 * Get spacing for current density
 */
export function getDensitySpacing(): typeof DENSITY_CONFIG.comfortable.spacing {
  const mode = getDensityMode();
  return DENSITY_CONFIG[mode].spacing;
}

/**
 * Get padding for current density
 */
export function getDensityPadding(): typeof DENSITY_CONFIG.comfortable.padding {
  const mode = getDensityMode();
  return DENSITY_CONFIG[mode].padding;
}

/**
 * Get text sizes for current density
 */
export function getDensityText(): typeof DENSITY_CONFIG.comfortable.text {
  const mode = getDensityMode();
  return DENSITY_CONFIG[mode].text;
}

/**
 * Get table config for current density
 */
export function getDensityTable(): typeof DENSITY_CONFIG.comfortable.table {
  const mode = getDensityMode();
  return DENSITY_CONFIG[mode].table;
}

/**
 * Get button config for current density
 */
export function getDensityButton(): typeof DENSITY_CONFIG.comfortable.button {
  const mode = getDensityMode();
  return DENSITY_CONFIG[mode].button;
}

/**
 * Toggle between comfortable and compact
 */
export function toggleDensity(): void {
  const current = getDensityMode();
  const next: DensityMode = current === 'comfortable' ? 'compact' : 'comfortable';
  setDensityMode(next);
}

/**
 * Initialize density on app load
 */
export function initializeDensity(): void {
  const mode = getDensityMode();
  applyDensityToDOM(mode);
}

/**
 * Get recommended density based on screen size
 */
export function getRecommendedDensity(): DensityMode {
  const width = window.innerWidth;
  // Mobile and small tablets: comfortable for better touch targets
  // Desktop: compact for more information density
  return width < 1024 ? 'comfortable' : 'compact';
}

/**
 * Hook for React components to use density
 */
export function useDensityConfig() {
  return {
    mode: getDensityMode(),
    spacing: getDensitySpacing(),
    padding: getDensityPadding(),
    text: getDensityText(),
    table: getDensityTable(),
    button: getDensityButton(),
    setMode: setDensityMode,
    toggle: toggleDensity,
  };
}

const densityService = {
  getDensityMode,
  setDensityMode,
  toggleDensity,
  getDensitySpacing,
  getDensityPadding,
  getDensityText,
  getDensityTable,
  getDensityButton,
  initializeDensity,
  getRecommendedDensity,
  DENSITY_CONFIG,
};

export default densityService;
