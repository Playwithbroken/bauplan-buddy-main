import {
  EmailTemplate,
  EmailNotificationType,
  EmailTemplateVariables
} from '@/types/email';
import { 
  EMAIL_STYLES, 
  EMAIL_COLORS, 
  TemplateHelpers, 
  GERMAN_TEXT_SNIPPETS 
} from '@/utils/emailTemplateUtils';

export interface TemplateBuilderOptions {
  type: EmailNotificationType;
  language: 'de' | 'en';
  style: 'modern' | 'classic' | 'minimal';
  includeActions: boolean;
  includeMeetingLink: boolean;
  includeCompanyBranding: boolean;
  customColors?: {
    primary: string;
    background: string;
    text: string;
  };
}

/**
 * Advanced Email Template Builder
 * Provides dynamic template creation with customizable options
 */
export class EmailTemplateBuilder {
  private options: TemplateBuilderOptions;
  private template: Partial<EmailTemplate>;

  constructor(options: TemplateBuilderOptions) {
    this.options = options;
    this.template = {
      type: options.type,
      language: options.language,
      isDefault: false,
      isActive: true,
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'template-builder',
      version: 1,
      tags: [options.type, options.style]
    };
  }

  /**
   * Set template basic information
   */
  setBasicInfo(id: string, name: string, description?: string): EmailTemplateBuilder {
    this.template.id = id;
    this.template.name = name;
    this.template.description = description || '';
    return this;
  }

  /**
   * Build the complete template
   */
  build(): EmailTemplate {
    if (!this.template.id || !this.template.name) {
      throw new Error('Template ID and name are required');
    }

    // Generate subject based on type
    this.template.subject = this.generateSubject();
    
    // Generate text content
    this.template.textContent = this.generateTextContent();
    
    // Generate HTML content
    this.template.htmlContent = this.generateHtmlContent();
    
    // Extract variables from content
    this.template.variables = this.extractAllVariables();

    return this.template as EmailTemplate;
  }

  /**
   * Generate subject line based on template type
   */
  private generateSubject(): string {
    const subjects: Record<EmailNotificationType, string> = {
      invitation: 'Termineinladung: {{appointmentTitle}} am {{appointmentDate}}',
      update: 'Terminaktualisierung: {{appointmentTitle}}',
      cancellation: 'Terminabsage: {{appointmentTitle}}',
      reminder_24h: 'Erinnerung: {{appointmentTitle}} morgen um {{appointmentTime}}',
      reminder_2h: 'Erinnerung: {{appointmentTitle}} in 2 Stunden',
      reminder_15m: 'Erinnerung: {{appointmentTitle}} in 15 Minuten',
      reschedule: 'Terminverschiebung: {{appointmentTitle}}',
      confirmation: 'Terminbestätigung: {{appointmentTitle}}',
      follow_up: 'Nachfassung: {{appointmentTitle}}',
      recurring_reminder: 'Erinnerung: Wiederkehrender Termin {{appointmentTitle}}',
      series_update: 'Serienaktualisierung: {{appointmentTitle}}',
      series_cancellation: 'Serienabsage: {{appointmentTitle}}',
      conflict_notification: 'Terminkonflikt: {{appointmentTitle}}',
      manual_notification: 'Benachrichtigung: {{appointmentTitle}}'
    };

    return subjects[this.options.type] || 'Terminbenachrichtigung: {{appointmentTitle}}';
  }

  /**
   * Generate text content based on template type
   */
  private generateTextContent(): string {
    const greeting = this.options.language === 'de' 
      ? GERMAN_TEXT_SNIPPETS.greetings.informal
      : 'Hello {{recipientName}}';
    
    const closing = this.options.language === 'de'
      ? GERMAN_TEXT_SNIPPETS.closings.formal
      : 'Best regards';

    const content = this.getTextContentByType();
    
    return `${greeting},

${content}

${this.generateOrganizerInfo()}

${this.generateMeetingInfo()}

${closing}
{{companyName}}

${this.generateUnsubscribeText()}`.trim();
  }

  /**
   * Generate HTML content based on template type and style
   */
  private generateHtmlContent(): string {
    const colors = this.options.customColors || EMAIL_COLORS[this.getColorScheme()];
    const title = this.getTemplateTitle();
    
    const content = `
      ${this.generateGreetingHTML()}
      ${this.generateNoticeHTML()}
      ${this.generateAppointmentDetailsHTML()}
      ${this.generateOrganizerInfoHTML()}
      ${this.generateMeetingInfoHTML()}
      ${this.generateActionsHTML()}
      ${this.generateAdditionalInfoHTML()}
    `;

    return TemplateHelpers.generateBaseHTML(title, colors.primary, content);
  }

  /**
   * Get template title based on type
   */
  private getTemplateTitle(): string {
    const titles: Record<EmailNotificationType, string> = {
      invitation: 'Termineinladung',
      update: 'Terminaktualisierung',
      cancellation: 'Terminabsage',
      reminder_24h: 'Terminerinnerung',
      reminder_2h: 'Terminerinnerung',
      reminder_15m: 'Terminerinnerung',
      reschedule: 'Terminverschiebung',
      confirmation: 'Terminbestätigung',
      follow_up: 'Terminnachfassung',
      recurring_reminder: 'Serientermin-Erinnerung',
      series_update: 'Serienaktualisierung',
      series_cancellation: 'Serienabsage',
      conflict_notification: 'Terminkonflikt',
      manual_notification: 'Terminbenachrichtigung'
    };

    return titles[this.options.type] || 'Terminbenachrichtigung';
  }

  /**
   * Get color scheme for template type
   */
  private getColorScheme(): keyof typeof EMAIL_COLORS {
    const schemes: Record<EmailNotificationType, keyof typeof EMAIL_COLORS> = {
      invitation: 'invitation',
      update: 'update',
      cancellation: 'cancellation',
      reminder_24h: 'reminder',
      reminder_2h: 'reminder',
      reminder_15m: 'reminder',
      reschedule: 'update',
      confirmation: 'confirmation',
      follow_up: 'invitation',
      recurring_reminder: 'reminder',
      series_update: 'update',
      series_cancellation: 'cancellation',
      conflict_notification: 'cancellation',
      manual_notification: 'invitation'
    };

    return schemes[this.options.type] || 'invitation';
  }

  /**
   * Generate text content specific to template type
   */
  private getTextContentByType(): string {
    switch (this.options.type) {
      case 'invitation':
        return `Sie sind zu folgendem Termin eingeladen:

Titel: {{appointmentTitle}}
Datum: {{appointmentDate}}
Uhrzeit: {{appointmentTime}}{{#if appointmentEndTime}} - {{appointmentEndTime}}{{/if}}
{{#if appointmentLocation}}Ort: {{appointmentLocation}}{{/if}}
{{#if projectName}}Projekt: {{projectName}}{{/if}}

{{#if appointmentDescription}}Beschreibung:
{{appointmentDescription}}{{/if}}`;

      case 'update':
        return `der folgende Termin wurde aktualisiert:

{{appointmentTitle}}
Neues Datum: {{appointmentDate}}
Neue Uhrzeit: {{appointmentTime}}{{#if appointmentEndTime}} - {{appointmentEndTime}}{{/if}}
{{#if appointmentLocation}}Ort: {{appointmentLocation}}{{/if}}`;

      case 'cancellation':
        return `der folgende Termin wurde abgesagt:

{{appointmentTitle}}
Datum: {{appointmentDate}}
Uhrzeit: {{appointmentTime}}

{{#if reason}}Grund der Absage: {{reason}}{{/if}}`;

      case 'reminder_24h':
        return `dies ist eine Erinnerung an Ihren Termin morgen:

{{appointmentTitle}}
{{appointmentDate}} um {{appointmentTime}}
{{#if appointmentLocation}}Ort: {{appointmentLocation}}{{/if}}`;

      case 'reminder_2h':
        return `Ihr Termin beginnt in 2 Stunden:

{{appointmentTitle}}
Heute um {{appointmentTime}}
{{#if appointmentLocation}}Ort: {{appointmentLocation}}{{/if}}`;

      default:
        return `bezüglich Ihres Termins:

{{appointmentTitle}}
{{appointmentDate}} um {{appointmentTime}}`;
    }
  }

  /**
   * Generate HTML sections
   */
  private generateGreetingHTML(): string {
    return '<p>Hallo <strong>{{recipientName}}</strong>,</p>';
  }

  private generateNoticeHTML(): string {
    const notices: Partial<Record<EmailNotificationType, string>> = {
      update: '<div class="notice notice-warning"><strong>⚠️ Wichtige Änderung:</strong> Der folgende Termin wurde aktualisiert.</div>',
      cancellation: '<div class="notice notice-danger"><strong>❌ Termin abgesagt:</strong> Der folgende Termin wurde storniert.</div>',
      reminder_24h: '<div class="notice notice-info"><strong>🔔 Erinnerung:</strong> Ihr Termin ist morgen!</div>',
      reminder_2h: '<div class="notice notice-warning"><strong>⏰ Erinnerung:</strong> Ihr Termin beginnt in 2 Stunden!</div>',
      reminder_15m: '<div class="notice notice-danger"><strong>🚨 Erinnerung:</strong> Ihr Termin beginnt in 15 Minuten!</div>'
    };

    return notices[this.options.type] || '';
  }

  private generateAppointmentDetailsHTML(): string {
    return TemplateHelpers.generateAppointmentDetailsHTML();
  }

  private generateOrganizerInfoHTML(): string {
    return '<p><strong>Organisator:</strong> {{organizerName}} ({{organizerEmail}}){{#if organizerPhone}}<br><strong>Telefon:</strong> {{organizerPhone}}{{/if}}</p>';
  }

  private generateMeetingInfoHTML(): string {
    return this.options.includeMeetingLink ? TemplateHelpers.generateMeetingLinkHTML() : '';
  }

  private generateActionsHTML(): string {
    return this.options.includeActions ? TemplateHelpers.generateActionButtonsHTML() : '';
  }

  private generateAdditionalInfoHTML(): string {
    return `{{#if rescheduleUrl}}<p><a href="{{rescheduleUrl}}" style="color: #2563eb;">Termin verschieben</a></p>{{/if}}`;
  }

  /**
   * Generate organizer info for text content
   */
  private generateOrganizerInfo(): string {
    return `Organisator: {{organizerName}} ({{organizerEmail}})
{{#if organizerPhone}}Telefon: {{organizerPhone}}{{/if}}`;
  }

  /**
   * Generate meeting info for text content
   */
  private generateMeetingInfo(): string {
    if (!this.options.includeMeetingLink) return '';
    
    return `{{#if meetingLink}}
Meeting-Link: {{meetingLink}}
{{#if dialInNumber}}Einwahl: {{dialInNumber}}{{/if}}
{{#if accessCode}}Zugangscode: {{accessCode}}{{/if}}
{{/if}}`;
  }

  /**
   * Generate unsubscribe text
   */
  private generateUnsubscribeText(): string {
    return '{{#if unsubscribeUrl}}Von zukünftigen E-Mails abmelden: {{unsubscribeUrl}}{{/if}}';
  }

  /**
   * Extract all variables from generated content
   */
  private extractAllVariables(): string[] {
    const allContent = `${this.template.subject} ${this.template.textContent} ${this.template.htmlContent}`;
    return TemplateHelpers.extractVariables(allContent);
  }
}

/**
 * Factory functions for common template types
 */
export const TemplateFactory = {
  /**
   * Create a standard invitation template
   */
  createInvitationTemplate(id: string, name: string): EmailTemplate {
    return new EmailTemplateBuilder({
      type: 'invitation',
      language: 'de',
      style: 'modern',
      includeActions: true,
      includeMeetingLink: true,
      includeCompanyBranding: true
    }).setBasicInfo(id, name, 'Standard-Termineinladung mit Antwortoptionen').build();
  },

  /**
   * Create a simple reminder template
   */
  createReminderTemplate(id: string, name: string, hours: number): EmailTemplate {
    const type = hours >= 24 ? 'reminder_24h' : hours >= 2 ? 'reminder_2h' : 'reminder_15m';
    
    return new EmailTemplateBuilder({
      type,
      language: 'de',
      style: 'minimal',
      includeActions: false,
      includeMeetingLink: true,
      includeCompanyBranding: true
    }).setBasicInfo(id, name, `Erinnerung ${hours} Stunden vor dem Termin`).build();
  },

  /**
   * Create a cancellation template
   */
  createCancellationTemplate(id: string, name: string): EmailTemplate {
    return new EmailTemplateBuilder({
      type: 'cancellation',
      language: 'de',
      style: 'classic',
      includeActions: false,
      includeMeetingLink: false,
      includeCompanyBranding: true
    }).setBasicInfo(id, name, 'Standard-Terminabsage').build();
  },

  /**
   * Create an update template
   */
  createUpdateTemplate(id: string, name: string): EmailTemplate {
    return new EmailTemplateBuilder({
      type: 'update',
      language: 'de',
      style: 'modern',
      includeActions: true,
      includeMeetingLink: true,
      includeCompanyBranding: true
    }).setBasicInfo(id, name, 'Standard-Terminaktualisierung').build();
  }
};

export default EmailTemplateBuilder;