import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { QuoteTemplatesService } from '../../quoteTemplatesService';
import { QuoteToProjectService } from '../../quoteToProjectService';
import { ProjectTemplateService } from '../../projectTemplateService';
import { PermissionService } from '../../permissionService';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock UUID generation
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))
}));

// Mock environment variables
(global as any).import = {
  meta: {
    env: {
      VITE_USE_API: 'false',
      MODE: 'test'
    }
  }
};

describe('Project Template Integration Tests', () => {
  let quoteTemplatesService: QuoteTemplatesService;
  let quoteToProjectService: QuoteToProjectService;
  let projectTemplateService: ProjectTemplateService;

  const mockQuoteData = {
    id: 'QUOTE-001',
    number: 'Q-2024-001',
    customer: 'Test Customer GmbH',
    customerId: 'CUST-001',
    customerEmail: 'customer@test.com',
    customerPhone: '+49 89 12345678',
    project: 'Test Construction Project',
    amount: 450000,
    status: 'accepted' as const,
    date: '2024-03-01',
    validUntil: '2024-03-31',
    projectType: 'residential' as const,
    estimatedDuration: 180,
    riskLevel: 'medium' as const,
    positions: [
      {
        id: 'POS-001',
        description: 'Foundation and earthworks',
        quantity: 1,
        unit: 'pauschal',
        unitPrice: 45000,
        total: 45000,
        category: 'construction',
        estimatedHours: 200,
        materials: ['concrete', 'rebar']
      },
      {
        id: 'POS-002',
        description: 'Structural work',
        quantity: 180,
        unit: 'm2',
        unitPrice: 650,
        total: 117000,
        category: 'construction',
        estimatedHours: 800,
        materials: ['brick', 'mortar', 'insulation']
      },
      {
        id: 'POS-003',
        description: 'Roofing',
        quantity: 120,
        unit: 'm2',
        unitPrice: 850,
        total: 102000,
        category: 'roofing',
        estimatedHours: 300,
        materials: ['roof tiles', 'membrane', 'timber']
      }
    ],
    notes: 'Standard residential construction with energy-efficient features'
  };

  const mockUserId = 'USER-001';

  beforeEach(() => {
    jest.clearAllMocks();
    
    quoteTemplatesService = QuoteTemplatesService.getInstance();
    quoteToProjectService = QuoteToProjectService.getInstance();
    projectTemplateService = ProjectTemplateService.getInstance();

    localStorageMock.getItem.mockImplementation((key: string) => {
      switch (key) {
        case 'bauplan-buddy-user':
          return JSON.stringify({ 
            id: mockUserId, 
            permissions: ['projects.write', 'templates.write'] 
          });
        case 'project-templates':
          return JSON.stringify([]);
        case 'quote-templates':
          return JSON.stringify([]);
        default:
          return null;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Quote Template Management', () => {
    it('should create and manage quote templates across categories', () => {
      const categories = quoteTemplatesService.getCategories();
      
      expect(categories).toHaveLength(4);
      expect(categories.map(c => c.id)).toEqual(['residential', 'commercial', 'renovation', 'infrastructure']);
      
      const residentialCategory = quoteTemplatesService.getCategory('residential');
      expect(residentialCategory?.name).toBe('Wohnbau');
      expect(residentialCategory?.icon).toBe('Home');
    });

    it('should retrieve and filter templates by category and search', () => {
      const allTemplates = quoteTemplatesService.getAllTemplates();
      expect(allTemplates.length).toBeGreaterThan(0);

      const residentialTemplates = quoteTemplatesService.getTemplatesByCategory('residential');
      expect(residentialTemplates.every(t => t.category === 'residential')).toBe(true);

      const searchResults = quoteTemplatesService.searchTemplates('dach');
      expect(searchResults.some(t => t.name.toLowerCase().includes('dach'))).toBe(true);
    });

    it('should create custom templates from existing quotes', () => {
      const customTemplate = quoteTemplatesService.createTemplateFromQuote(
        'Custom House Template',
        'Template created from successful house project',
        'residential',
        mockQuoteData.positions,
        ['custom', 'house', 'successful']
      );

      expect(customTemplate.id).toMatch(/^template_/);
      expect(customTemplate.name).toBe('Custom House Template');
      expect(customTemplate.category).toBe('residential');
      expect(customTemplate.positions).toHaveLength(3);
      expect(customTemplate.estimatedTotal).toBe(264000);
      expect(customTemplate.tags).toContain('custom');
    });

    it('should apply templates to new quotes with proper data mapping', () => {
      const template = quoteTemplatesService.getTemplate('einfamilienhaus');
      expect(template).toBeDefined();

      const appliedData = quoteTemplatesService.applyTemplateToQuote('einfamilienhaus');
      
      expect(appliedData).toBeDefined();
      expect(appliedData?.positions.length).toBeGreaterThan(0);
      expect(appliedData?.estimatedTotal).toBeGreaterThan(0);
      expect(appliedData?.estimatedDuration).toBeGreaterThan(0);
      
      // Verify position structure
      appliedData?.positions.forEach(position => {
        expect(position.id).toBeDefined();
        expect(position.position).toBeGreaterThan(0);
        expect(position.description).toBeDefined();
        expect(position.quantity).toBeGreaterThan(0);
        expect(position.unitPrice).toBeGreaterThan(0);
        expect(position.total).toBeGreaterThan(0);
      });
    });

    it('should track template usage statistics', () => {
      // Use templates multiple times
      quoteTemplatesService.useTemplate('einfamilienhaus');
      quoteTemplatesService.useTemplate('einfamilienhaus');
      quoteTemplatesService.useTemplate('dachsanierung');

      const stats = quoteTemplatesService.getTemplateStats();
      
      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(stats.totalUsage).toBeGreaterThan(0);
      expect(stats.mostUsedTemplate).toBeDefined();
      expect(stats.categoryCounts).toBeDefined();
      expect(Object.keys(stats.categoryCounts)).toContain('residential');
    });

    it('should update and delete templates with proper validation', () => {
      const originalTemplate = quoteTemplatesService.getTemplate('einfamilienhaus');
      expect(originalTemplate).toBeDefined();

      // Update template
      const updatedTemplate = quoteTemplatesService.updateTemplate('einfamilienhaus', {
        description: 'Updated description for single family house'
      });

      expect(updatedTemplate?.description).toBe('Updated description for single family house');
      expect(new Date(updatedTemplate!.updatedAt)).toBeInstanceOf(Date);

      // Delete template (mark as inactive)
      const deleteResult = quoteTemplatesService.deleteTemplate('einfamilienhaus');
      expect(deleteResult).toBe(true);

      const deletedTemplate = quoteTemplatesService.getTemplate('einfamilienhaus');
      expect(deletedTemplate?.isActive).toBe(false);
    });
  });

  describe('Quote to Project Conversion', () => {
    it('should convert quote to project using appropriate template', async () => {
      const projectTemplates = quoteToProjectService.getProjectTemplates();
      expect(projectTemplates.length).toBeGreaterThan(0);

      const residentialTemplate = projectTemplates.find(t => t.type === 'residential');
      expect(residentialTemplate).toBeDefined();

      const convertedProject = await quoteToProjectService.convertQuoteToProject(
        mockQuoteData,
        residentialTemplate!.id,
        {
          startDate: '2024-04-01',
          teamAssignments: {},
          customMilestones: [],
          riskAssessment: []
        }
      );

      expect(convertedProject.id).toBeDefined();
      expect(convertedProject.name).toBe(mockQuoteData.project);
      expect(convertedProject.customer).toBe(mockQuoteData.customer);
      expect(convertedProject.budget).toBe(mockQuoteData.amount);
      expect(convertedProject.status).toBe('planning');
      expect(convertedProject.phases.length).toBeGreaterThan(0);
      expect(convertedProject.milestones.length).toBeGreaterThan(0);
      expect(convertedProject.quoteReference).toBe(mockQuoteData.id);
    });

    it('should generate project phases with proper dependencies and timing', async () => {
      const template = quoteToProjectService.getProjectTemplates()[0];
      const convertedProject = await quoteToProjectService.convertQuoteToProject(
        mockQuoteData,
        template.id
      );

      expect(convertedProject.phases.length).toBeGreaterThan(0);
      
      // Verify phase structure
      convertedProject.phases.forEach(phase => {
        expect(phase.id).toBeDefined();
        expect(phase.name).toBeDefined();
        expect(phase.order).toBeGreaterThan(0);
        expect(phase.estimatedDurationPercent).toBeGreaterThan(0);
        expect(phase.tasks.length).toBeGreaterThan(0);
      });

      // Verify phase ordering
      const orderedPhases = convertedProject.phases.sort((a, b) => a.order - b.order);
      expect(orderedPhases[0].order).toBe(1);
      expect(orderedPhases[orderedPhases.length - 1].order).toBe(orderedPhases.length);
    });

    it('should create project milestones with payment schedules', async () => {
      const template = quoteToProjectService.getProjectTemplates()[0];
      const convertedProject = await quoteToProjectService.convertQuoteToProject(
        mockQuoteData,
        template.id
      );

      expect(convertedProject.milestones.length).toBeGreaterThan(0);

      const paymentMilestones = convertedProject.milestones.filter(m => m.isPaymentMilestone);
      expect(paymentMilestones.length).toBeGreaterThan(0);

      const totalPaymentPercentage = paymentMilestones.reduce(
        (sum, milestone) => sum + (milestone.paymentPercentage || 0), 
        0
      );
      expect(totalPaymentPercentage).toBeGreaterThan(0);
      expect(totalPaymentPercentage).toBeLessThanOrEqual(100);

      // Verify milestone structure
      convertedProject.milestones.forEach(milestone => {
        expect(milestone.id).toBeDefined();
        expect(milestone.name).toBeDefined();
        expect(milestone.phaseId).toBeDefined();
        expect(milestone.dayOffset).toBeGreaterThanOrEqual(0);
        expect(milestone.deliverables.length).toBeGreaterThan(0);
      });
    });

    it('should assign team members and resources based on project requirements', async () => {
      const template = quoteToProjectService.getProjectTemplates()[0];
      const convertedProject = await quoteToProjectService.convertQuoteToProject(
        mockQuoteData,
        template.id,
        {
          teamAssignments: {
            'planning': ['ARCH-001', 'ENG-001'],
            'construction': ['FOREMAN-001', 'WORKER-001', 'WORKER-002']
          }
        }
      );

      expect(convertedProject.team.length).toBeGreaterThan(0);

      convertedProject.team.forEach(member => {
        expect(member.id).toBeDefined();
        expect(member.name).toBeDefined();
        expect(member.role).toBeDefined();
        expect(member.skills.length).toBeGreaterThan(0);
        expect(member.hourlyRate).toBeGreaterThan(0);
        expect(member.allocation).toBeGreaterThan(0);
        expect(member.allocation).toBeLessThanOrEqual(100);
        expect(member.phaseIds.length).toBeGreaterThan(0);
      });
    });

    it('should generate required documents and deliverables', async () => {
      const template = quoteToProjectService.getProjectTemplates()[0];
      const convertedProject = await quoteToProjectService.convertQuoteToProject(
        mockQuoteData,
        template.id
      );

      expect(convertedProject.documents.length).toBeGreaterThan(0);

      const documentTypes = ['contract', 'permit', 'plan', 'specification', 'report'];
      const generatedTypes = convertedProject.documents.map(doc => doc.type);
      
      expect(generatedTypes.some(type => documentTypes.includes(type))).toBe(true);

      convertedProject.documents.forEach(document => {
        expect(document.id).toBeDefined();
        expect(document.name).toBeDefined();
        expect(document.type).toBeDefined();
        expect(document.status).toBeDefined();
        expect(document.category).toBeDefined();
      });
    });

    it('should perform risk assessment based on project complexity', async () => {
      const template = quoteToProjectService.getProjectTemplates()[0];
      const convertedProject = await quoteToProjectService.convertQuoteToProject(
        mockQuoteData,
        template.id
      );

      expect(convertedProject.risks.length).toBeGreaterThan(0);

      const riskCategories = ['weather', 'material', 'regulatory', 'technical', 'financial', 'resource'];
      const generatedCategories = convertedProject.risks.map(risk => risk.category);
      
      expect(generatedCategories.some(cat => riskCategories.includes(cat))).toBe(true);

      convertedProject.risks.forEach(risk => {
        expect(risk.id).toBeDefined();
        expect(risk.description).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(risk.probability);
        expect(['low', 'medium', 'high']).toContain(risk.impact);
        expect(risk.mitigation).toBeDefined();
        expect(risk.status).toBeDefined();
      });
    });
  });

  describe('Project Template Service Integration', () => {
    it('should create and manage custom project templates', async () => {
      const customTemplate = await projectTemplateService.createTemplate({
        name: 'Custom Renovation Template',
        type: 'renovation',
        description: 'Template for bathroom renovations',
        estimatedDurationMultiplier: 0.8,
        phases: [
          {
            id: 'demo',
            name: 'Demolition',
            description: 'Remove old fixtures',
            order: 1,
            estimatedDurationPercent: 20,
            tasks: [
              {
                id: 'remove-tiles',
                name: 'Remove old tiles',
                description: 'Careful removal of existing tiles',
                estimatedHours: 16,
                requiredSkills: ['demolition'],
                priority: 'medium',
                category: 'demolition'
              }
            ]
          }
        ],
        defaultMilestones: [
          {
            id: 'demo-complete',
            name: 'Demolition Complete',
            description: 'All old fixtures removed',
            phaseId: 'demo',
            dayOffset: 3,
            isPaymentMilestone: false,
            deliverables: ['Clean workspace', 'Disposal complete']
          }
        ],
        requiredDocuments: ['Permits', 'Safety plan']
      });

      expect(customTemplate.id).toBeDefined();
      expect(customTemplate.name).toBe('Custom Renovation Template');
      expect(customTemplate.type).toBe('renovation');
      expect(customTemplate.phases).toHaveLength(1);
      expect(customTemplate.defaultMilestones).toHaveLength(1);
      expect(customTemplate.requiredDocuments).toEqual(['Permits', 'Safety plan']);
    });

    it('should integrate with permission system for template management', async () => {
      jest.spyOn(PermissionService, 'hasPermission').mockReturnValue(true);

      const template = await projectTemplateService.createTemplate({
        name: 'Protected Template',
        type: 'commercial',
        description: 'Template requiring special permissions',
        estimatedDurationMultiplier: 1.0,
        phases: [],
        defaultMilestones: [],
        requiredDocuments: []
      });

      expect(PermissionService.hasPermission).toHaveBeenCalledWith(
        mockUserId,
        'templates.write',
        expect.any(Object)
      );
      expect(template).toBeDefined();
    });

    it('should prevent unauthorized template modifications', async () => {
      jest.spyOn(PermissionService, 'hasPermission').mockReturnValue(false);

      await expect(
        projectTemplateService.createTemplate({
          name: 'Unauthorized Template',
          type: 'residential',
          description: 'Should not be created',
          estimatedDurationMultiplier: 1.0,
          phases: [],
          defaultMilestones: [],
          requiredDocuments: []
        })
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should validate template data integrity and relationships', async () => {
      // Test invalid phase references in milestones
      await expect(
        projectTemplateService.createTemplate({
          name: 'Invalid Template',
          type: 'residential',
          description: 'Template with invalid phase reference',
          estimatedDurationMultiplier: 1.0,
          phases: [
            {
              id: 'phase1',
              name: 'Phase 1',
              description: 'First phase',
              order: 1,
              estimatedDurationPercent: 100,
              tasks: []
            }
          ],
          defaultMilestones: [
            {
              id: 'milestone1',
              name: 'Milestone 1',
              description: 'First milestone',
              phaseId: 'nonexistent-phase', // Invalid reference
              dayOffset: 10,
              isPaymentMilestone: false,
              deliverables: []
            }
          ],
          requiredDocuments: []
        })
      ).rejects.toThrow('Invalid phase reference in milestone');
    });

    it('should handle template versioning and updates', async () => {
      const template = await projectTemplateService.createTemplate({
        name: 'Versioned Template',
        type: 'residential',
        description: 'Template for versioning test',
        estimatedDurationMultiplier: 1.0,
        phases: [],
        defaultMilestones: [],
        requiredDocuments: []
      });

      const updatedTemplate = await projectTemplateService.updateTemplate(template.id, {
        description: 'Updated description',
        estimatedDurationMultiplier: 1.1
      });

      expect(updatedTemplate.version).toBe(2);
      expect(updatedTemplate.description).toBe('Updated description');
      expect(updatedTemplate.estimatedDurationMultiplier).toBe(1.1);
      expect(new Date(updatedTemplate.updatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('Template Performance and Optimization', () => {
    it('should handle large template datasets efficiently', async () => {
      // Create many templates
      const templatePromises = Array.from({ length: 100 }, (_, i) => 
        projectTemplateService.createTemplate({
          name: `Template ${i}`,
          type: 'residential',
          description: `Auto-generated template ${i}`,
          estimatedDurationMultiplier: 1.0,
          phases: [],
          defaultMilestones: [],
          requiredDocuments: []
        })
      );

      const startTime = Date.now();
      await Promise.all(templatePromises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should cache frequently used templates', () => {
      // Access same template multiple times
      const template1 = quoteTemplatesService.getTemplate('einfamilienhaus');
      const template2 = quoteTemplatesService.getTemplate('einfamilienhaus');
      const template3 = quoteTemplatesService.getTemplate('einfamilienhaus');

      expect(template1).toEqual(template2);
      expect(template2).toEqual(template3);
    });

    it('should optimize template search and filtering', () => {
      const startTime = Date.now();
      
      // Perform multiple search operations
      quoteTemplatesService.searchTemplates('haus');
      quoteTemplatesService.searchTemplates('sanierung');
      quoteTemplatesService.searchTemplates('dach');
      quoteTemplatesService.getTemplatesByCategory('residential');
      quoteTemplatesService.getTemplatesByCategory('renovation');
      
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle template conversion errors gracefully', async () => {
      const invalidQuoteData = {
        ...mockQuoteData,
        positions: [] // Empty positions should cause validation error
      };

      await expect(
        quoteToProjectService.convertQuoteToProject(
          invalidQuoteData,
          'residential-new'
        )
      ).rejects.toThrow('Quote must have at least one position');
    });

    it('should validate template structure and data types', async () => {
      // Test invalid percentage values
      await expect(
        projectTemplateService.createTemplate({
          name: 'Invalid Template',
          type: 'residential',
          description: 'Template with invalid percentages',
          estimatedDurationMultiplier: 1.0,
          phases: [
            {
              id: 'phase1',
              name: 'Phase 1',
              description: 'First phase',
              order: 1,
              estimatedDurationPercent: 150, // Invalid: > 100
              tasks: []
            }
          ],
          defaultMilestones: [],
          requiredDocuments: []
        })
      ).rejects.toThrow('Phase duration percentage cannot exceed 100');
    });

    it('should handle missing or corrupted template data', () => {
      const nonexistentTemplate = quoteTemplatesService.getTemplate('nonexistent');
      expect(nonexistentTemplate).toBeNull();

      const applyNonexistent = quoteTemplatesService.applyTemplateToQuote('nonexistent');
      expect(applyNonexistent).toBeNull();
    });

    it('should recover from template storage failures', async () => {
      // Mock storage failure
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(
        projectTemplateService.createTemplate({
          name: 'Storage Test Template',
          type: 'residential',
          description: 'Testing storage failure',
          estimatedDurationMultiplier: 1.0,
          phases: [],
          defaultMilestones: [],
          requiredDocuments: []
        })
      ).rejects.toThrow('Failed to save template');
    });
  });

  describe('Integration with External Systems', () => {
    it('should export templates for external use', () => {
      const template = quoteTemplatesService.getTemplate('einfamilienhaus');
      expect(template).toBeDefined();

      const exportData = {
        template,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        format: 'json'
      };

      expect(exportData.template).toBeDefined();
      expect(exportData.exportedAt).toBeDefined();
      expect(exportData.version).toBe('1.0');
      expect(exportData.format).toBe('json');
    });

    it('should import templates from external sources', async () => {
      const importData = {
        name: 'Imported Template',
        category: 'commercial',
        description: 'Template imported from external system',
        positions: [
          {
            description: 'Imported position',
            quantity: 1,
            unit: 'pauschal',
            unitPrice: 10000,
            total: 10000,
            category: 'construction'
          }
        ],
        tags: ['imported', 'external']
      };

      const importedTemplate = quoteTemplatesService.createTemplateFromQuote(
        importData.name,
        importData.description,
        importData.category,
        importData.positions,
        importData.tags
      );

      expect(importedTemplate.name).toBe('Imported Template');
      expect(importedTemplate.category).toBe('commercial');
      expect(importedTemplate.tags).toContain('imported');
      expect(importedTemplate.positions).toHaveLength(1);
    });

    it('should sync templates across multiple devices/users', async () => {
      // Mock sync operation
      const localTemplates = quoteTemplatesService.getAllTemplates();
      const syncResult = {
        success: true,
        uploadedCount: localTemplates.length,
        downloadedCount: 2,
        conflicts: [],
        errors: []
      };

      expect(syncResult.success).toBe(true);
      expect(syncResult.uploadedCount).toBeGreaterThan(0);
      expect(syncResult.downloadedCount).toBe(2);
      expect(syncResult.conflicts).toHaveLength(0);
      expect(syncResult.errors).toHaveLength(0);
    });
  });
});