import { 
  EmailTemplate, 
  EmailNotificationType, 
  EmailTemplateVariables 
} from '@/types/email';

/**
 * Common email template constants and utilities
 */

// Standard email styles for HTML templates
export const EMAIL_STYLES = {
  container: `
    max-width: 600px;
    margin: 0 auto;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
  `,
  header: `
    padding: 20px;
    border-radius: 8px 8px 0 0;
    text-align: center;
    color: white;
  `,
  content: `
    padding: 30px;
  `,
  footer: `
    padding: 20px;
    background: #f1f5f9;
    border-radius: 0 0 8px 8px;
    text-align: center;
    font-size: 12px;
    color: #64748b;
  `,
  button: `
    display: inline-block;
    padding: 12px 24px;
    margin: 0 5px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
    text-align: center;
  `,
  appointmentDetails: `
    background: #f8fafc;
    padding: 20px;
    border-radius: 6px;
    margin: 20px 0;
    border-left: 4px solid #2563eb;
  `
};

// Color schemes for different notification types
export const EMAIL_COLORS = {
  invitation: {
    primary: '#2563eb',
    background: '#eff6ff',
    border: '#2563eb'
  },
  update: {
    primary: '#f59e0b',
    background: '#fef3c7',
    border: '#f59e0b'
  },
  cancellation: {
    primary: '#ef4444',
    background: '#fecaca',
    border: '#ef4444'
  },
  reminder: {
    primary: '#8b5cf6',
    background: '#ede9fe',
    border: '#8b5cf6'
  },
  confirmation: {
    primary: '#10b981',
    background: '#d1fae5',
    border: '#10b981'
  }
};

// Template variable formatters
export const TEMPLATE_FORMATTERS = {
  /**
   * Format date for German locale
   */
  formatDate: (date: string): string => {
    try {
      return new Date(date).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  },

  /**
   * Format time for German locale
   */
  formatTime: (time: string): string => {
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return time;
    }
  },

  /**
   * Format appointment type in German
   */
  formatAppointmentType: (type: string): string => {
    const types: Record<string, string> = {
      'site-visit': 'Baustellenbesuch',
      'meeting': 'Besprechung',
      'delivery': 'Lieferung',
      'milestone': 'Meilenstein',
      'internal': 'Interner Termin',
      'consultation': 'Beratungstermin',
      'inspection': 'Begutachtung'
    };
    return types[type] || type;
  },

  /**
   * Format priority in German
   */
  formatPriority: (priority: string): string => {
    const priorities: Record<string, string> = {
      'low': 'Niedrig',
      'medium': 'Normal',
      'high': 'Hoch',
      'critical': 'Kritisch'
    };
    return priorities[priority] || priority;
  }
};

// Template validation rules
export const TEMPLATE_VALIDATION_RULES = {
  required_fields: ['id', 'name', 'subject', 'textContent', 'htmlContent', 'type'],
  max_subject_length: 200,
  max_name_length: 100,
  required_variables_by_type: {
    invitation: ['appointmentTitle', 'appointmentDate', 'appointmentTime', 'recipientName', 'organizerName'],
    update: ['appointmentTitle', 'appointmentDate', 'appointmentTime', 'recipientName', 'organizerName'],
    cancellation: ['appointmentTitle', 'appointmentDate', 'recipientName', 'organizerName'],
    reminder_24h: ['appointmentTitle', 'appointmentDate', 'appointmentTime', 'recipientName'],
    reminder_2h: ['appointmentTitle', 'appointmentTime', 'recipientName'],
    reminder_15m: ['appointmentTitle', 'appointmentTime', 'recipientName'],
    confirmation: ['appointmentTitle', 'appointmentDate', 'appointmentTime', 'recipientName']
  }
};

// Helper functions for template operations
export const TemplateHelpers = {
  /**
   * Generate base HTML structure for email templates
   */
  generateBaseHTML: (
    title: string, 
    headerColor: string, 
    content: string,
    companyName: string = '{{companyName}}'
  ): string => {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f9fafb; }
        .container { ${EMAIL_STYLES.container} }
        .header { ${EMAIL_STYLES.header} background: ${headerColor}; }
        .content { ${EMAIL_STYLES.content} }
        .footer { ${EMAIL_STYLES.footer} }
        .appointment-details { ${EMAIL_STYLES.appointmentDetails} }
        .btn { ${EMAIL_STYLES.button} }
        .btn-primary { background: #2563eb; color: white; }
        .btn-success { background: #10b981; color: white; }
        .btn-warning { background: #f59e0b; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .logo { max-height: 40px; margin-bottom: 10px; }
        .notice { padding: 15px; border-radius: 6px; margin: 20px 0; }
        .notice-info { background: #dbeafe; border-left: 4px solid #2563eb; }
        .notice-warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .notice-danger { background: #fecaca; border-left: 4px solid #ef4444; }
        .notice-success { background: #d1fae5; border-left: 4px solid #10b981; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{#if companyLogo}}<img src="{{companyLogo}}" alt="${companyName}" class="logo">{{/if}}
            <h1>${title}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>${companyName}</strong></p>
            {{#if unsubscribeUrl}}
            <p><a href="{{unsubscribeUrl}}" style="color: #64748b;">Von E-Mail-Benachrichtigungen abmelden</a></p>
            {{/if}}
        </div>
    </div>
</body>
</html>`.trim();
  },

  /**
   * Generate appointment details section for templates
   */
  generateAppointmentDetailsHTML: (): string => {
    return `
<div class="appointment-details">
    <h3>{{appointmentTitle}}</h3>
    <p><strong>Datum:</strong> {{appointmentDate}}</p>
    <p><strong>Uhrzeit:</strong> {{appointmentTime}}{{#if appointmentEndTime}} - {{appointmentEndTime}}{{/if}}</p>
    {{#if appointmentLocation}}<p><strong>Ort:</strong> {{appointmentLocation}}</p>{{/if}}
    {{#if projectName}}<p><strong>Projekt:</strong> {{projectName}}{{#if projectCustomer}} ({{projectCustomer}}){{/if}}</p>{{/if}}
    {{#if appointmentDescription}}<p><strong>Beschreibung:</strong><br>{{appointmentDescription}}</p>{{/if}}
</div>`;
  },

  /**
   * Generate action buttons section for templates
   */
  generateActionButtonsHTML: (): string => {
    return `
{{#if acceptUrl}}
<div style="text-align: center; margin: 20px 0;">
    <a href="{{acceptUrl}}" class="btn btn-success">Zusagen</a>
    {{#if tentativeUrl}}<a href="{{tentativeUrl}}" class="btn btn-warning">Vorläufig</a>{{/if}}
    <a href="{{declineUrl}}" class="btn btn-danger">Absagen</a>
</div>
{{/if}}`;
  },

  /**
   * Generate meeting link section for templates
   */
  generateMeetingLinkHTML: (): string => {
    return `
{{#if meetingLink}}
<div class="notice notice-info">
    <strong>Online-Meeting:</strong><br>
    <a href="{{meetingLink}}" style="color: #2563eb;">{{meetingLink}}</a>
    {{#if dialInNumber}}<br><strong>Einwahl:</strong> {{dialInNumber}}{{/if}}
    {{#if accessCode}}<br><strong>Zugangscode:</strong> {{accessCode}}{{/if}}
</div>
{{/if}}`;
  },

  /**
   * Format template variables for better display
   */
  formatTemplateVariables: (variables: EmailTemplateVariables): EmailTemplateVariables => {
    return {
      ...variables,
      appointmentDate: TEMPLATE_FORMATTERS.formatDate(variables.appointmentDate),
      appointmentTime: TEMPLATE_FORMATTERS.formatTime(variables.appointmentTime),
      appointmentEndTime: variables.appointmentEndTime ? 
        TEMPLATE_FORMATTERS.formatTime(variables.appointmentEndTime) : 
        variables.appointmentEndTime,
      appointmentType: TEMPLATE_FORMATTERS.formatAppointmentType(variables.appointmentType),
      appointmentPriority: TEMPLATE_FORMATTERS.formatPriority(variables.appointmentPriority)
    };
  },

  /**
   * Extract variables from template content
   */
  extractVariables: (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable) && !variable.startsWith('#') && !variable.startsWith('/')) {
        variables.push(variable);
      }
    }
    
    return variables.sort();
  },

  /**
   * Validate template content for common issues
   */
  validateTemplateContent: (template: EmailTemplate): string[] => {
    const issues: string[] = [];
    
    // Check for unclosed handlebars
    const openBraces = (template.htmlContent.match(/\{\{/g) || []).length;
    const closeBraces = (template.htmlContent.match(/\}\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push('Unmatched handlebars braces in HTML content');
    }
    
    // Check for basic HTML structure
    if (!template.htmlContent.includes('<!DOCTYPE html>')) {
      issues.push('Missing DOCTYPE declaration in HTML content');
    }
    
    if (!template.htmlContent.includes('<meta charset="UTF-8">')) {
      issues.push('Missing charset declaration in HTML content');
    }
    
    // Check for required styles
    if (!template.htmlContent.includes('font-family')) {
      issues.push('No font-family specified in HTML content');
    }
    
    return issues;
  }
};

// Default German text snippets for templates
export const GERMAN_TEXT_SNIPPETS = {
  greetings: {
    formal: 'Sehr geehrte/r {{recipientName}}',
    informal: 'Hallo {{recipientName}}',
    generic: 'Liebe/r {{recipientName}}'
  },
  closings: {
    formal: 'Mit freundlichen Grüßen',
    business: 'Beste Grüße',
    simple: 'Grüße'
  },
  common_phrases: {
    reminder: 'Dies ist eine Erinnerung an',
    invitation: 'Sie sind eingeladen zu',
    update: 'wurde aktualisiert',
    cancellation: 'wurde abgesagt',
    confirmation: 'wurde bestätigt',
    contact_info: 'Bei Fragen wenden Sie sich bitte an',
    more_info: 'Weitere Informationen finden Sie',
    calendar_note: 'Dieser Termin wurde automatisch zu Ihrem Kalender hinzugefügt'
  }
};

export default {
  EMAIL_STYLES,
  EMAIL_COLORS,
  TEMPLATE_FORMATTERS,
  TEMPLATE_VALIDATION_RULES,
  TemplateHelpers,
  GERMAN_TEXT_SNIPPETS
};