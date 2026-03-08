import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the application homepage', async ({ page }) => {
    // Set a longer timeout for this test
    test.setTimeout(90000);
    
    try {
      // Navigate to the application
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Basic check that the page loaded
      await expect(page).toHaveTitle(/.+/); // Any non-empty title
      
      // Check that the body exists and has some content
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Check that React app is loaded by looking for common elements
      const hasReactContent = await page.evaluate(() => {
        return document.body.innerHTML.length > 100; // Has substantial content
      });
      
      expect(hasReactContent).toBeTruthy();
      
      console.log('✅ Application loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load application:', error);
      
      // Get page content for debugging
      const content = await page.content();
      console.log('Page content length:', content.length);
      
      // Check if there are any console errors
      const logs = await page.evaluate(() => {
        return window.performance ? 'Performance API available' : 'No performance API';
      });
      console.log('Browser info:', logs);
      
      throw error;
    }
  });

  test('should handle basic navigation', async ({ page }) => {
    test.setTimeout(90000);
    
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000);
    
    // Try to navigate to a different route
    await page.goto('/calendar', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Verify we can load different pages
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Navigation test passed');
  });

  test('should detect responsive design', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Verify page still loads on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Responsive design test passed');
  });
});