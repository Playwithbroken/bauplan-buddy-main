/**
 * Branding Service
 * Manages tenant-aware theming with contrast safeguards
 * Supports per-tenant branding while maintaining WCAG AA accessibility
 */

export interface BrandingConfig {
  companyName: string;
  companyLogo?: string; // Base64 or URL
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface ColorContrast {
  ratio: number;
  passes: boolean;
  level: 'AA' | 'AAA' | 'FAIL';
}

const STORAGE_KEYS = {
  COMPANY_NAME: 'bauplan_company_name',
  COMPANY_LOGO: 'bauplan_company_logo',
  PRIMARY_COLOR: 'bauplan_primary_color',
  SECONDARY_COLOR: 'bauplan_secondary_color',
  ACCENT_COLOR: 'bauplan_accent_color',
} as const;

const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'Bauplan Buddy',
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  accentColor: '#10B981',
};

/**
 * Calculate relative luminance of a color
 * Used for WCAG contrast ratio calculation
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standards
 */
export function checkContrast(foreground: string, background: string): ColorContrast {
  const ratio = getContrastRatio(foreground, background);
  
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  // AAA requires 7:1 for normal text, 4.5:1 for large text
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7;

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: passesAA,
    level: passesAAA ? 'AAA' : passesAA ? 'AA' : 'FAIL',
  };
}

/**
 * Adjust color brightness to meet minimum contrast
 */
function adjustForContrast(color: string, background: string, minRatio: number = 4.5): string {
  let currentColor = color;
  let ratio = getContrastRatio(currentColor, background);
  
  if (ratio >= minRatio) return currentColor;

  const rgb = hexToRgb(currentColor);
  if (!rgb) return color;

  // Darken or lighten based on background
  const bgLum = getLuminance(background);
  const isDarkBg = bgLum < 0.5;
  
  let factor = isDarkBg ? 1.1 : 0.9;
  let attempts = 0;
  const maxAttempts = 10;

  while (ratio < minRatio && attempts < maxAttempts) {
    const newR = Math.round(Math.min(255, Math.max(0, rgb.r * factor)));
    const newG = Math.round(Math.min(255, Math.max(0, rgb.g * factor)));
    const newB = Math.round(Math.min(255, Math.max(0, rgb.b * factor)));
    
    currentColor = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    ratio = getContrastRatio(currentColor, background);
    
    factor = isDarkBg ? factor * 1.1 : factor * 0.9;
    attempts++;
  }

  return currentColor;
}

/**
 * Apply branding colors to CSS variables
 */
function applyBrandingToDOM(config: BrandingConfig): void {
  const root = document.documentElement;
  
  // Get current background color for contrast checking
  const isDark = root.classList.contains('dark');
  const bgColor = isDark ? '#0a0a0a' : '#ffffff';
  
  // Ensure colors meet contrast requirements
  const safePrimary = adjustForContrast(config.primaryColor, bgColor);
  const safeSecondary = adjustForContrast(config.secondaryColor, bgColor);
  const safeAccent = adjustForContrast(config.accentColor, bgColor);
  
  root.style.setProperty('--color-primary', safePrimary);
  root.style.setProperty('--color-secondary', safeSecondary);
  root.style.setProperty('--color-accent', safeAccent);
  
  // Store the safe colors
  localStorage.setItem(STORAGE_KEYS.PRIMARY_COLOR, safePrimary);
  localStorage.setItem(STORAGE_KEYS.SECONDARY_COLOR, safeSecondary);
  localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, safeAccent);
}

/**
 * Load branding configuration from localStorage
 */
export function loadBranding(): BrandingConfig {
  return {
    companyName: localStorage.getItem(STORAGE_KEYS.COMPANY_NAME) || DEFAULT_BRANDING.companyName,
    companyLogo: localStorage.getItem(STORAGE_KEYS.COMPANY_LOGO) || undefined,
    primaryColor: localStorage.getItem(STORAGE_KEYS.PRIMARY_COLOR) || DEFAULT_BRANDING.primaryColor,
    secondaryColor: localStorage.getItem(STORAGE_KEYS.SECONDARY_COLOR) || DEFAULT_BRANDING.secondaryColor,
    accentColor: localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR) || DEFAULT_BRANDING.accentColor,
  };
}

/**
 * Save branding configuration
 */
export function saveBranding(config: BrandingConfig): void {
  localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, config.companyName);
  
  if (config.companyLogo) {
    localStorage.setItem(STORAGE_KEYS.COMPANY_LOGO, config.companyLogo);
  }
  
  applyBrandingToDOM(config);
}

/**
 * Clear branding and restore defaults
 */
export function resetBranding(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  
  applyBrandingToDOM(DEFAULT_BRANDING);
}

/**
 * Initialize branding on app load
 */
export function initializeBranding(): void {
  const config = loadBranding();
  applyBrandingToDOM(config);
}

/**
 * Predefined color palettes for quick selection
 */
export const COLOR_PALETTES = {
  standard: {
    name: 'Standard',
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#10B981',
  },
  energy: {
    name: 'Energie',
    primary: '#F59E0B',
    secondary: '#EF4444',
    accent: '#F97316',
  },
  nature: {
    name: 'Natur',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#84CC16',
  },
  elegant: {
    name: 'Elegant',
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#EC4899',
  },
} as const;

const brandingService = {
  loadBranding,
  saveBranding,
  resetBranding,
  initializeBranding,
  checkContrast,
  getContrastRatio,
  COLOR_PALETTES,
};

export default brandingService;
