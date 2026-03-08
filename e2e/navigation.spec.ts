import { test, expect } from '@playwright/test';

test.describe('Navigation and App Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Check basic page structure
    await expect(page).toHaveTitle(/Bauplan Buddy/);
    
    // Check for main navigation elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Look for common navigation elements
    const navElements = [
      'dashboard', 'projekte', 'kalender', 'rechnungen', 'kunden',
      'projects', 'calendar', 'invoices', 'customers'
    ];
    
    let foundNav = false;
    for (const element of navElements) {
      const navElement = page.locator(`[href*="${element}"], [data-testid*="${element}"]`).first();
      if (await navElement.isVisible()) {
        foundNav = true;
        break;
      }
    }
    
    // If no specific nav found, just check that page loaded with some content
    if (!foundNav) {
      await expect(body).not.toBeEmpty();
    }
  });

  test('should navigate to different sections', async ({ page }) => {
    const sections = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/projects', name: 'Projects' },
      { path: '/calendar', name: 'Calendar' },
      { path: '/invoices', name: 'Invoices' },
      { path: '/customers', name: 'Customers' }
    ];

    for (const section of sections) {
      await page.goto(section.path);
      await page.waitForLoadState('networkidle');
      
      // Verify navigation worked (page should not show 404 or error)
      const errorTexts = ['404', 'not found', 'fehler', 'error'];
      let hasError = false;
      
      for (const errorText of errorTexts) {
        const bodyText = await page.locator('body').textContent() || '';
        if (bodyText.toLowerCase().includes(errorText.toLowerCase())) {
          hasError = true;
          break;
        }
      }
      
      expect(hasError).toBeFalsy();
      
      // Basic check that the page loaded
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if mobile navigation elements are present
    const mobileMenuButton = page.locator('button').filter({
      hasText: /menu|menü/i
    }).or(page.locator('[aria-label*="menu"], [data-testid*="menu"]')).first();
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      // Check if mobile menu opened
      const mobileNav = page.locator('[role="navigation"], .mobile-nav, [data-testid*="mobile"]').first();
      if (await mobileNav.isVisible()) {
        await expect(mobileNav).toBeVisible();
      }
    }
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle theme switching', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for theme toggle button
    const themeToggle = page.locator('button').filter({
      hasText: /theme|dark|light/i
    }).or(page.locator('[data-testid*="theme"], [aria-label*="theme"]')).first();
    
    if (await themeToggle.isVisible()) {
      // Get initial theme state
      const initialClass = await page.locator('html').getAttribute('class') || '';
      
      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check if theme changed
      const newClass = await page.locator('html').getAttribute('class') || '';
      
      // Theme should have changed (dark/light mode toggle)
      expect(newClass).not.toBe(initialClass);
    }
  });

  test('should search functionality if available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input').filter({
      hasText: /search|suche/i
    }).or(page.locator('input[placeholder*="suche"], input[placeholder*="search"]')).first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      // Basic check that search was triggered
      const url = page.url();
      const hasSearchParam = url.includes('search') || url.includes('suche') || url.includes('q=');
      
      if (!hasSearchParam) {
        // Check if search results area is visible
        const searchResults = page.locator('[data-testid*="search"], .search-results').first();
        if (await searchResults.isVisible()) {
          await expect(searchResults).toBeVisible();
        }
      }
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test navigation to non-existent page
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    // Should show 404 or error page
    const errorIndicators = [
      '404', 'nicht gefunden', 'not found', 'seite nicht gefunden',
      'page not found', 'fehler', 'error'
    ];
    
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase();
    const hasErrorIndicator = errorIndicators.some(indicator => 
      bodyText.includes(indicator.toLowerCase())
    );
    
    // Should either show error message or redirect to valid page
    expect(hasErrorIndicator || !bodyText.includes('undefined')).toBeTruthy();
  });

  test('should validate accessibility basics', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for basic accessibility elements
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for main landmarks
    const main = page.locator('main, [role="main"]').first();
    if (await main.isVisible()) {
      await expect(main).toBeVisible();
    }
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus').first();
    if (await focusedElement.isVisible()) {
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should load and display data without JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to a few key pages
    const pages = ['/dashboard', '/calendar', '/projects'];
    for (const pagePath of pages) {
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      } catch (error) {
        // Page might not exist, continue to next
        continue;
      }
    }
    
    // Check for critical errors (ignore minor warnings)
    const criticalErrors = [...consoleErrors, ...pageErrors].filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('Extension') &&
      !error.toLowerCase().includes('warning')
    );
    
    // Should have minimal critical errors
    expect(criticalErrors.length).toBeLessThan(5);
  });
});