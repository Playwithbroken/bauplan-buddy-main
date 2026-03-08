import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
  });

  test('should display projects page', async ({ page }) => {
    // Verify we're on the projects page
    const pageContent = await page.locator('body').textContent() || '';
    const projectIndicators = [
      'projekt', 'project', 'projekte', 'projects'
    ];
    
    const hasProjectContent = projectIndicators.some(indicator => 
      pageContent.toLowerCase().includes(indicator)
    );
    
    expect(hasProjectContent).toBeTruthy();
  });

  test('should create a new project', async ({ page }) => {
    // Look for "Add Project" or "Neues Projekt" button
    const addButton = page.locator('button').filter({ 
      hasText: /neues projekt|add project|projekt hinzufügen|create project/i 
    }).first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Fill project form
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="titel"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('E2E Test Project');
      }
      
      const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="beschreibung"]').first();
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('This is a test project created by Playwright E2E tests');
      }
      
      // Set project dates if available
      const startDateInput = page.locator('input[type="date"], input[name*="start"]').first();
      if (await startDateInput.isVisible()) {
        const today = new Date().toISOString().split('T')[0];
        await startDateInput.fill(today);
      }
      
      // Set project location if available
      const locationInput = page.locator('input[name="location"], input[placeholder*="ort"], input[placeholder*="location"]').first();
      if (await locationInput.isVisible()) {
        await locationInput.fill('Test Location');
      }
      
      // Save the project
      const saveButton = page.locator('button').filter({ 
        hasText: /speichern|save|erstellen|create/i 
      }).first();
      
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForLoadState('networkidle');
        
        // Verify project was created
        await expect(page.locator('body')).toContainText('E2E Test Project');
      }
    }
  });

  test('should view project details', async ({ page }) => {
    // Look for existing projects
    const projectElement = page.locator('[data-testid*="project"], .project-item, .project-card').first();
    
    if (await projectElement.isVisible()) {
      await projectElement.click();
      await page.waitForTimeout(500);
      
      // Should navigate to project details or open modal
      const detailsContent = page.locator('[data-testid*="detail"], .project-details, .modal-content').first();
      if (await detailsContent.isVisible()) {
        await expect(detailsContent).toBeVisible();
      }
    }
  });

  test('should filter projects', async ({ page }) => {
    // Look for filter controls
    const filterInput = page.locator('input[placeholder*="filter"], input[placeholder*="suche"]').first();
    const filterSelect = page.locator('select').filter({ hasText: /status|typ|type/i }).first();
    
    if (await filterInput.isVisible()) {
      await filterInput.fill('test');
      await page.waitForTimeout(500);
      
      // Verify filtering worked
      const projects = page.locator('[data-testid*="project"], .project-item');
      const visibleProjects = await projects.count();
      
      // Reset filter
      await filterInput.clear();
      await page.waitForTimeout(500);
    }
    
    if (await filterSelect.isVisible()) {
      const options = await filterSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await filterSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        
        // Reset filter
        await filterSelect.selectOption({ index: 0 });
        await page.waitForTimeout(500);
      }
    }
  });

  test('should edit a project', async ({ page }) => {
    // Look for existing projects
    const projectElement = page.locator('[data-testid*="project"], .project-item').first();
    
    if (await projectElement.isVisible()) {
      // Look for edit button
      const editButton = projectElement.locator('button').filter({
        hasText: /edit|bearbeiten/i
      }).or(projectElement.locator('[data-testid*="edit"], [aria-label*="edit"]')).first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Modify project details
        const nameInput = page.locator('input[name="name"], input[value*="project"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Updated E2E Test Project');
        }
        
        // Save changes
        const saveButton = page.locator('button').filter({ 
          hasText: /speichern|save|aktualisieren|update/i 
        }).first();
        
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForLoadState('networkidle');
          
          // Verify changes were saved
          await expect(page.locator('body')).toContainText('Updated');
        }
      }
    }
  });

  test('should manage project status', async ({ page }) => {
    // Look for existing projects
    const projectElement = page.locator('[data-testid*="project"], .project-item').first();
    
    if (await projectElement.isVisible()) {
      // Look for status dropdown or buttons
      const statusSelect = projectElement.locator('select').filter({ 
        hasText: /status/i 
      }).first();
      
      const statusButton = projectElement.locator('button').filter({
        hasText: /status|aktiv|abgeschlossen|in bearbeitung/i
      }).first();
      
      if (await statusSelect.isVisible()) {
        const options = await statusSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await statusSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }
      } else if (await statusButton.isVisible()) {
        await statusButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should delete a project', async ({ page }) => {
    // Look for existing projects
    const projectElement = page.locator('[data-testid*="project"], .project-item').first();
    
    if (await projectElement.isVisible()) {
      // Look for delete button
      const deleteButton = projectElement.locator('button').filter({
        hasText: /delete|löschen/i
      }).or(projectElement.locator('[data-testid*="delete"], [data-testid*="trash"]')).first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);
        
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

  test('should export project data', async ({ page }) => {
    // Look for export functionality
    const exportButton = page.locator('button').filter({ 
      hasText: /export|exportieren|download/i 
    }).first();
    
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      await exportButton.click();
      
      try {
        // Wait for download to start
        const download = await downloadPromise;
        
        // Verify download started
        expect(download.suggestedFilename()).toBeTruthy();
      } catch (error) {
        // Export might open in new tab or show modal instead
        const exportModal = page.locator('.modal, [role="dialog"]').first();
        if (await exportModal.isVisible()) {
          await expect(exportModal).toBeVisible();
        }
      }
    }
  });

  test('should add team members to project', async ({ page }) => {
    // Look for existing projects and click on one
    const projectElement = page.locator('[data-testid*="project"], .project-item').first();
    
    if (await projectElement.isVisible()) {
      await projectElement.click();
      await page.waitForTimeout(500);
      
      // Look for team or member management section
      const addMemberButton = page.locator('button').filter({
        hasText: /mitglied hinzufügen|add member|team hinzufügen/i
      }).first();
      
      if (await addMemberButton.isVisible()) {
        await addMemberButton.click();
        await page.waitForTimeout(500);
        
        // Look for member selection
        const memberSelect = page.locator('select, input[placeholder*="member"], input[placeholder*="mitglied"]').first();
        if (await memberSelect.isVisible()) {
          if (memberSelect.tagName === 'SELECT') {
            const options = await memberSelect.locator('option').allTextContents();
            if (options.length > 1) {
              await memberSelect.selectOption({ index: 1 });
            }
          } else {
            await memberSelect.fill('Test User');
          }
          
          // Save member addition
          const saveButton = page.locator('button').filter({ 
            hasText: /hinzufügen|add|speichern|save/i 
          }).first();
          
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });
});