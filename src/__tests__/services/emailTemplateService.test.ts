import { EmailTemplateService } from '@/services/emailTemplateService';
import {
  EmailTemplate,
  EmailTemplateVariables,
  EmailNotificationType
} from '@/types/email';

describe('EmailTemplateService', () => {
  let mockVariables: EmailTemplateVariables;

  beforeEach(() => {
    mockVariables = {
      appointmentTitle: 'Test Meeting',
      appointmentDate: '2024-01-15',
      appointmentTime: '10:00',
      appointmentEndTime: '11:00',
      appointmentLocation: 'Conference Room A',
      appointmentType: 'meeting',
      appointmentPriority: 'medium',
      appointmentDescription: 'A test meeting for unit testing',
      organizerName: 'John Organizer',
      organizerEmail: 'organizer@example.com',
      recipientName: 'Jane Recipient',
      recipientEmail: 'recipient@example.com',
      companyName: 'Bauplan Buddy GmbH',
      projectName: 'Test Project',
      projectCustomer: 'Test Customer',
      customFields: {
        location: 'Conference Room A',
        equipment: 'Projector, Whiteboard'
      }
    };
  });

  describe('Template Management', () => {
    test('should get all available templates', () => {
      const templates = EmailTemplateService.getTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      // Check that all templates have required fields
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('subject');
        expect(template).toHaveProperty('textContent');
        expect(template).toHaveProperty('htmlContent');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('variables');
      });
    });

    test('should get template by ID', () => {
      const template = EmailTemplateService.getTemplate('invitation');
      
      expect(template).toBeDefined();
      expect(template?.id).toBe('invitation');
      expect(template?.type).toBe('invitation');
    });

    test('should return null for non-existent template', () => {
      const template = EmailTemplateService.getTemplate('non-existent');
      expect(template).toBeNull();
    });

    test('should get templates by type', () => {
      const invitationTemplates = EmailTemplateService.getTemplatesByType('invitation');
      
      expect(Array.isArray(invitationTemplates)).toBe(true);
      invitationTemplates.forEach(template => {
        expect(template.type).toBe('invitation');
      });
    });

    test('should get templates by language', () => {
      const germanTemplates = EmailTemplateService.getTemplatesByLanguage('de');
      
      expect(Array.isArray(germanTemplates)).toBe(true);
      germanTemplates.forEach(template => {
        expect(template.language).toBe('de');
      });
    });
  });

  describe('Template Rendering', () => {
    test('should render invitation template correctly', () => {
      const result = EmailTemplateService.renderTemplate('invitation', mockVariables);
      
      expect(result).toBeDefined();
      expect(result?.subject).toContain(mockVariables.appointmentTitle);
      expect(result?.textContent).toContain(mockVariables.recipientName);
      expect(result?.htmlContent).toContain(mockVariables.appointmentDate);
    });

    test('should render update template correctly', () => {
      const result = EmailTemplateService.renderTemplate('update', mockVariables);
      
      expect(result).toBeDefined();
      expect(result?.subject).toContain('Aktualisierung');
      expect(result?.textContent).toContain(mockVariables.appointmentTitle);
      expect(result?.htmlContent).toContain(mockVariables.organizerName);
    });

    test('should render cancellation template correctly', () => {
      const result = EmailTemplateService.renderTemplate('cancellation', mockVariables);
      
      expect(result).toBeDefined();
      expect(result?.subject).toContain('Absage');
      expect(result?.textContent).toContain(mockVariables.appointmentTitle);
      expect(result?.htmlContent).toContain(mockVariables.recipientName);
    });

    test('should render reminder templates correctly', () => {
      const reminder24h = EmailTemplateService.renderTemplate('reminder_24h', mockVariables);
      const reminder2h = EmailTemplateService.renderTemplate('reminder_2h', mockVariables);
      const reminder15m = EmailTemplateService.renderTemplate('reminder_15m', mockVariables);
      
      expect(reminder24h).toBeDefined();
      expect(reminder2h).toBeDefined();
      expect(reminder15m).toBeDefined();
      
      expect(reminder24h?.subject).toContain('24 Stunden');
      expect(reminder2h?.subject).toContain('2 Stunden');
      expect(reminder15m?.subject).toContain('15 Minuten');
    });

    test('should handle missing variables gracefully', () => {
      const incompleteVariables = {
        appointmentTitle: 'Test Meeting',
        recipientName: 'Jane Recipient'
      } as EmailTemplateVariables;
      
      const result = EmailTemplateService.renderTemplate('invitation', incompleteVariables);
      
      expect(result).toBeDefined();
      expect(result?.subject).toContain('Test Meeting');
      // Should not throw error for missing variables
    });

    test('should return null for invalid template ID', () => {
      const result = EmailTemplateService.renderTemplate('invalid-template', mockVariables);
      expect(result).toBeNull();
    });
  });

  describe('Template Validation', () => {
    test('should validate template structure', () => {
      const validTemplate: EmailTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        subject: 'Test: {{appointmentTitle}}',
        textContent: 'Hello {{recipientName}}',
        htmlContent: '<p>Hello {{recipientName}}</p>',
        type: 'invitation',
        variables: ['appointmentTitle', 'recipientName'],
        isActive: true,
        language: 'de',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const isValid = EmailTemplateService.validateTemplate(validTemplate);
      expect(isValid).toBe(true);
    });

    test('should reject invalid template structure', () => {
      const invalidTemplate = {
        id: 'test-template',
        name: '', // Missing name
        subject: 'Test: {{appointmentTitle}}',
        textContent: 'Hello {{recipientName}}',
        // Missing htmlContent
        type: 'invalid-type', // Invalid type
        variables: ['appointmentTitle', 'recipientName']
      } as EmailTemplate;

      const isValid = EmailTemplateService.validateTemplate(invalidTemplate);
      expect(isValid).toBe(false);
    });
  });

  describe('Variable Processing', () => {
    test('should extract variables from template content', () => {
      const content = 'Hello {{recipientName}}, your appointment {{appointmentTitle}} is on {{appointmentDate}}';
      const variables = EmailTemplateService.extractVariables(content);
      
      expect(variables).toContain('recipientName');
      expect(variables).toContain('appointmentTitle');
      expect(variables).toContain('appointmentDate');
      expect(variables).toHaveLength(3);
    });

    test('should format variables for German locale', () => {
      const formatted = EmailTemplateService.formatVariables(mockVariables);
      
      expect(formatted.appointmentDate).toMatch(/\d{1,2}\. \w+ \d{4}/); // German date format
      expect(formatted.appointmentTime).toMatch(/\d{2}:\d{2}/); // Time format
    });

    test('should substitute variables in content', () => {
      const template = 'Hello {{recipientName}}, your meeting {{appointmentTitle}} is scheduled for {{appointmentDate}}';
      const result = EmailTemplateService.substituteVariables(template, mockVariables);
      
      expect(result).toContain(mockVariables.recipientName);
      expect(result).toContain(mockVariables.appointmentTitle);
      expect(result).toContain(mockVariables.appointmentDate);
      expect(result).not.toContain('{{');
    });
  });

  describe('Template Creation and Customization', () => {
    test('should create custom template', () => {
      const customTemplate: Partial<EmailTemplate> = {
        name: 'Custom Test Template',
        subject: 'Custom: {{appointmentTitle}}',
        textContent: 'Custom text for {{recipientName}}',
        htmlContent: '<p>Custom HTML for {{recipientName}}</p>',
        type: 'invitation'
      };

      const created = EmailTemplateService.createTemplate(customTemplate);
      
      expect(created.id).toBeDefined();
      expect(created.name).toBe(customTemplate.name);
      expect(created.isActive).toBe(true);
      expect(created.createdAt).toBeDefined();
    });

    test('should update existing template', () => {
      const updates: Partial<EmailTemplate> = {
        name: 'Updated Template Name',
        subject: 'Updated: {{appointmentTitle}}'
      };

      const updated = EmailTemplateService.updateTemplate('invitation', updates);
      
      expect(updated).toBeDefined();
      expect(updated?.name).toBe(updates.name);
      expect(updated?.subject).toBe(updates.subject);
      expect(updated?.updatedAt).toBeDefined();
    });

    test('should delete template', () => {
      const success = EmailTemplateService.deleteTemplate('test-template-to-delete');
      expect(success).toBe(true);
    });
  });

  describe('Localization Support', () => {
    test('should get template in specific language', () => {
      const germanTemplate = EmailTemplateService.getTemplate('invitation', 'de');
      const englishTemplate = EmailTemplateService.getTemplate('invitation', 'en');
      
      expect(germanTemplate?.language).toBe('de');
      expect(englishTemplate?.language).toBe('en');
      expect(germanTemplate?.textContent).not.toBe(englishTemplate?.textContent);
    });

    test('should fallback to default language when translation not available', () => {
      const template = EmailTemplateService.getTemplate('invitation', 'fr'); // French not available
      
      expect(template).toBeDefined();
      expect(template?.language).toBe('de'); // Should fallback to German
    });
  });

  describe('Template Analytics', () => {
    test('should track template usage', () => {
      EmailTemplateService.trackTemplateUsage('invitation', 'sent');
      const stats = EmailTemplateService.getTemplateStats('invitation');
      
      expect(stats.totalSent).toBeGreaterThan(0);
    });

    test('should get template performance metrics', () => {
      const metrics = EmailTemplateService.getTemplateMetrics('invitation');
      
      expect(metrics).toHaveProperty('openRate');
      expect(metrics).toHaveProperty('clickRate');
      expect(metrics).toHaveProperty('totalSent');
      expect(metrics).toHaveProperty('totalOpened');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed template content', () => {
      const malformedTemplate = 'Hello {{recipientName}, missing closing brace';
      
      expect(() => {
        EmailTemplateService.substituteVariables(malformedTemplate, mockVariables);
      }).not.toThrow();
    });

    test('should handle circular references in variables', () => {
      const circularVariables = {
        ...mockVariables,
        recipientName: '{{organizerName}}',
        organizerName: '{{recipientName}}'
      };
      
      const result = EmailTemplateService.renderTemplate('invitation', circularVariables);
      expect(result).toBeDefined();
    });

    test('should handle undefined template variables', () => {
      const undefinedVariables = {
        ...mockVariables,
        appointmentTitle: undefined as string | undefined,
        recipientName: null as string | null
      };
      
      const result = EmailTemplateService.renderTemplate('invitation', undefinedVariables);
      expect(result).toBeDefined();
      expect(result?.textContent).not.toContain('undefined');
      expect(result?.textContent).not.toContain('null');
    });
  });
});