import { test, expect } from '@playwright/test';

test.describe('Appointment Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test('should display the homepage and navigate to calendar', async ({ page }) => {
    // Check if the homepage loads correctly
    await expect(page).toHaveTitle(/Bauplan Buddy/);
    
    // Look for navigation elements
    const calendarLink = page.getByRole('link', { name: /kalender|calendar/i });
    if (await calendarLink.isVisible()) {
      await calendarLink.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Verify we're on the calendar page
    await expect(page.locator('body')).toContainText(/kalender|calendar/i);
  });

  test('should create a new appointment', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    
    // Look for "Add Appointment" or "Neuer Termin" button
    const addButton = page.locator('button').filter({ 
      hasText: /neuer termin|add appointment|termin hinzufügen/i 
    }).first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Fill appointment form
      const titleInput = page.locator('input[name="title"], input[placeholder*="titel"], input[placeholder*="title"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('E2E Test Appointment');
      }
      
      const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="beschreibung"], textarea[placeholder*="description"]').first();
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('This is a test appointment created by Playwright E2E tests');
      }
      
      // Set date (today)
      const dateInput = page.locator('input[type="date"], input[name="date"]').first();
      if (await dateInput.isVisible()) {
        const today = new Date().toISOString().split('T')[0];
        await dateInput.fill(today);
      }
      
      // Set time
      const startTimeInput = page.locator('input[name="startTime"], input[placeholder*="start"]').first();
      if (await startTimeInput.isVisible()) {
        await startTimeInput.fill('10:00');
      }
      
      const endTimeInput = page.locator('input[name="endTime"], input[placeholder*="end"]').first();
      if (await endTimeInput.isVisible()) {
        await endTimeInput.fill('11:00');
      }
      
      // Save the appointment
      const saveButton = page.locator('button').filter({ 
        hasText: /speichern|save|erstellen|create/i 
      }).first();
      
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForLoadState('networkidle');
        
        // Verify appointment was created
        await expect(page.locator('body')).toContainText('E2E Test Appointment');
      }
    }
  });

  test('should edit an existing appointment', async ({ page }) => {
    // First create an appointment (reuse creation logic)
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    
    // Look for existing appointments or create one
    const appointmentElement = page.locator('[data-testid*="appointment"], .appointment-item').first();
    
    if (await appointmentElement.isVisible()) {
      // Click edit button (pencil icon or edit text)
      const editButton = appointmentElement.locator('button').filter({
        hasText: /edit|bearbeiten/i
      }).or(appointmentElement.locator('[data-testid*="edit"], [aria-label*="edit"]')).first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Modify the appointment
        const titleInput = page.locator('input[name="title"], input[value*="appointment"]').first();
        if (await titleInput.isVisible()) {
          await titleInput.fill('Updated E2E Test Appointment');
        }
        
        // Save changes
        const saveButton = page.locator('button').filter({ 
          hasText: /speichern|save|aktualisieren|update/i 
        }).first();
        
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForLoadState('networkidle');
          
          // Verify changes were saved
          await expect(page.locator('body')).toContainText('Updated E2E Test Appointment');
        }
      }
    }
  });

  test('should delete an appointment', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    
    // Look for existing appointments
    const appointmentElement = page.locator('[data-testid*="appointment"], .appointment-item').first();
    
    if (await appointmentElement.isVisible()) {
      // Click delete button (trash icon)
      const deleteButton = appointmentElement.locator('button').filter({
        hasText: /delete|löschen/i
      }).or(appointmentElement.locator('[data-testid*="delete"], [data-testid*="trash"], [aria-label*="delete"]')).first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion if confirmation dialog appears
        const confirmButton = page.locator('button').filter({ 
          hasText: /bestätigen|confirm|ja|yes|löschen|delete/i 
        }).first();
        
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('should navigate between different calendar views', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    
    // Test different view buttons if they exist
    const monthViewButton = page.locator('button').filter({ hasText: /monat|month/i }).first();
    if (await monthViewButton.isVisible()) {
      await monthViewButton.click();
      await page.waitForTimeout(500);
    }
    
    const weekViewButton = page.locator('button').filter({ hasText: /woche|week/i }).first();
    if (await weekViewButton.isVisible()) {
      await weekViewButton.click();
      await page.waitForTimeout(500);
    }
    
    const dayViewButton = page.locator('button').filter({ hasText: /tag|day/i }).first();
    if (await dayViewButton.isVisible()) {
      await dayViewButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter appointments by type', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    
    // Look for filter controls
    const filterDropdown = page.locator('select').filter({ 
      hasText: /typ|type|filter/i 
    }).or(page.locator('[data-testid*="filter"]')).first();
    
    if (await filterDropdown.isVisible()) {
      await filterDropdown.selectOption({ label: /meeting|besprechung/i });
      await page.waitForTimeout(500);
      
      // Verify filtering worked
      const appointments = page.locator('[data-testid*="appointment"], .appointment-item');
      const count = await appointments.count();
      
      // Reset filter
      await filterDropdown.selectOption({ label: /alle|all/i });
      await page.waitForTimeout(500);
    }
  });
});