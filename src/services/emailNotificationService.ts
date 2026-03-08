import { ErrorHandlingService } from './errorHandlingService';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  category: 'system' | 'project' | 'invoice' | 'reminder' | 'alert' | 'marketing';
  language: 'de' | 'en';
  variables: EmailVariable[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface EmailVariable {
  key: string;
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
}

export interface EmailNotification {
  id: string;
  templateId: string;
  recipientEmail: string;
  recipientName?: string;
  senderEmail?: string;
  senderName?: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Record<string, unknown>;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface EmailTrigger {
  id: string;
  name: string;
  description: string;
  eventType: 'project_created' | 'project_completed' | 'milestone_achieved' | 'milestone_overdue' | 
             'invoice_sent' | 'invoice_overdue' | 'payment_received' | 'task_assigned' | 
             'task_completed' | 'budget_alert' | 'user_registered' | 'password_reset';
  templateId: string;
  conditions: EmailCondition[];
  recipients: EmailRecipient[];
  isActive: boolean;
  delay?: number; // minutes
  createdAt: string;
  updatedAt: string;
}

export interface EmailCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: unknown;
}

export interface EmailRecipient {
  type: 'user' | 'role' | 'email' | 'project_team' | 'custom';
  identifier: string;
  name?: string;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  defaultSenderEmail: string;
  defaultSenderName: string;
  replyToEmail?: string;
  maxRetries: number;
  retryDelay: number; // minutes
  enableBounceTracking: boolean;
  enableClickTracking: boolean;
  enableOpenTracking: boolean;
  unsubscribeUrl?: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  recipients: EmailRecipient[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  openCount: number;
  clickCount: number;
  unsubscribeCount: number;
  createdAt: string;
  createdBy: string;
}

export interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  byTemplate: Record<string, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
  byRecipient: Record<string, {
    sent: number;
    delivered: number;
    lastSent: string;
  }>;
  trends: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
  }>;
}

export class EmailNotificationService {
  private static readonly TEMPLATES_KEY = 'bauplan-buddy-email-templates';
  private static readonly NOTIFICATIONS_KEY = 'bauplan-buddy-email-notifications';
  private static readonly TRIGGERS_KEY = 'bauplan-buddy-email-triggers';
  private static readonly SETTINGS_KEY = 'bauplan-buddy-email-settings';
  private static readonly CAMPAIGNS_KEY = 'bauplan-buddy-email-campaigns';

  /**
   * Initialize with default templates and settings
   */
  static initialize(): void {
    if (!this.getStoredTemplates().length) {
      this.createDefaultTemplates();
    }
    if (!this.getEmailSettings()) {
      this.createDefaultSettings();
    }
    this.createDefaultTriggers();
  }

  /**
   * Send email notification
   */
  static async sendNotification(
    templateId: string,
    recipientEmail: string,
    variables: Record<string, unknown>,
    options: {
      recipientName?: string;
      priority?: EmailNotification['priority'];
      scheduledAt?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<EmailNotification> {
    try {
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error('Email template not found');
      }

      if (!template.isActive) {
        throw new Error('Email template is not active');
      }

      // Process template content with variables
      const processedContent = this.processTemplate(template, variables);

      const notification: EmailNotification = {
        id: this.generateId(),
        templateId,
        recipientEmail,
        recipientName: options.recipientName,
        subject: processedContent.subject,
        htmlContent: processedContent.htmlContent,
        textContent: processedContent.textContent,
        variables,
        status: options.scheduledAt ? 'pending' : 'pending',
        priority: options.priority || 'normal',
        scheduledAt: options.scheduledAt,
        retryCount: 0,
        maxRetries: 3,
        tags: options.tags || [],
        metadata: options.metadata,
        createdAt: new Date().toISOString()
      };

      // Save notification
      this.saveNotification(notification);

      // Send immediately if not scheduled
      if (!options.scheduledAt) {
        await this.deliverNotification(notification.id);
      }

      ErrorHandlingService.info(
        `Email notification queued: ${template.name}`,
        'email_notification',
        { templateId, recipientEmail, priority: options.priority }
      );

      return notification;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to send email notification',
        error as Error,
        'email_notification'
      );
      throw error;
    }
  }

  /**
   * Send bulk email campaign
   */
  static async sendCampaign(
    campaignId: string,
    templateId: string,
    recipients: EmailRecipient[],
    variables: Record<string, unknown> = {}
  ): Promise<EmailCampaign> {
    try {
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error('Email template not found');
      }

      const campaign: EmailCampaign = {
        id: campaignId,
        name: `Campaign ${new Date().toLocaleDateString()}`,
        description: `Bulk email using template: ${template.name}`,
        templateId,
        recipients,
        status: 'sending',
        totalRecipients: recipients.length,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        openCount: 0,
        clickCount: 0,
        unsubscribeCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user'
      };

      this.saveCampaign(campaign);

      // Process recipients and send emails
      for (const recipient of recipients) {
        try {
          const recipientEmail = await this.resolveRecipientEmail(recipient);
          if (recipientEmail) {
            await this.sendNotification(templateId, recipientEmail, variables, {
              recipientName: recipient.name,
              tags: ['campaign', campaignId]
            });
            campaign.sentCount++;
          }
        } catch (error) {
          campaign.failedCount++;
          ErrorHandlingService.warn(
            `Failed to send campaign email to recipient: ${recipient.identifier}`,
            'email_campaign',
            { campaignId, recipient }
          );
        }
      }

      campaign.status = 'sent';
      campaign.sentAt = new Date().toISOString();
      this.saveCampaign(campaign);

      return campaign;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to send email campaign',
        error as Error,
        'email_campaign'
      );
      throw error;
    }
  }

  /**
   * Create email template
   */
  static createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate {
    try {
      const newTemplate: EmailTemplate = {
        ...template,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const templates = this.getStoredTemplates();
      templates.push(newTemplate);
      this.saveTemplates(templates);

      return newTemplate;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to create email template',
        error as Error,
        'email_template'
      );
      throw error;
    }
  }

  /**
   * Update email template
   */
  static updateTemplate(templateId: string, updates: Partial<EmailTemplate>): EmailTemplate | null {
    try {
      const templates = this.getStoredTemplates();
      const templateIndex = templates.findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) return null;

      templates[templateIndex] = {
        ...templates[templateIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.saveTemplates(templates);
      return templates[templateIndex];
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to update email template',
        error as Error,
        'email_template'
      );
      throw error;
    }
  }

  /**
   * Create email trigger for automatic notifications
   */
  static createTrigger(trigger: Omit<EmailTrigger, 'id' | 'createdAt' | 'updatedAt'>): EmailTrigger {
    try {
      const newTrigger: EmailTrigger = {
        ...trigger,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const triggers = this.getStoredTriggers();
      triggers.push(newTrigger);
      this.saveTriggers(triggers);

      return newTrigger;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to create email trigger',
        error as Error,
        'email_trigger'
      );
      throw error;
    }
  }

  /**
   * Trigger event-based notifications
   */
  static async triggerEvent(
    eventType: EmailTrigger['eventType'],
    eventData: Record<string, unknown>
  ): Promise<void> {
    try {
      const triggers = this.getStoredTriggers().filter(
        t => t.eventType === eventType && t.isActive
      );

      for (const trigger of triggers) {
        // Check if conditions are met
        if (this.evaluateConditions(trigger.conditions, eventData)) {
          // Resolve recipients
          const recipients = await this.resolveRecipients(trigger.recipients, eventData);
          
          // Send notifications to each recipient
          for (const recipient of recipients) {
            await this.sendNotification(
              trigger.templateId,
              recipient.email,
              eventData,
              {
                recipientName: recipient.name,
                tags: ['auto-trigger', eventType],
                metadata: { triggerId: trigger.id }
              }
            );
          }
        }
      }
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to process email trigger',
        error as Error,
        'email_trigger',
        { eventType, eventData }
      );
    }
  }

  /**
   * Get email analytics
   */
  static getEmailAnalytics(dateRange?: { from: string; to: string }): EmailAnalytics {
    try {
      const notifications = this.getStoredNotifications();
      
      // Filter by date range if provided
      const filteredNotifications = dateRange 
        ? notifications.filter(n => 
            n.createdAt >= dateRange.from && n.createdAt <= dateRange.to
          )
        : notifications;

      const totalSent = filteredNotifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
      const totalDelivered = filteredNotifications.filter(n => n.status === 'delivered').length;
      const totalFailed = filteredNotifications.filter(n => n.status === 'failed' || n.status === 'bounced').length;

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      
      // Mock open and click rates (would come from tracking)
      const openRate = 25.5;
      const clickRate = 3.2;
      const bounceRate = totalSent > 0 ? (filteredNotifications.filter(n => n.status === 'bounced').length / totalSent) * 100 : 0;

      const analytics: EmailAnalytics = {
        totalSent,
        totalDelivered,
        totalFailed,
        deliveryRate,
        openRate,
        clickRate,
        bounceRate,
        unsubscribeRate: 0.5, // Mock value
        byTemplate: this.calculateTemplateAnalytics(filteredNotifications),
        byRecipient: this.calculateRecipientAnalytics(filteredNotifications),
        trends: this.calculateEmailTrends(filteredNotifications)
      };

      return analytics;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to get email analytics',
        error as Error,
        'email_analytics'
      );
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0,
        byTemplate: {},
        byRecipient: {},
        trends: []
      };
    }
  }

  /**
   * Get all email templates
   */
  static getTemplates(category?: string): EmailTemplate[] {
    const templates = this.getStoredTemplates();
    return category 
      ? templates.filter(t => t.category === category)
      : templates;
  }

  /**
   * Get single template
   */
  static getTemplate(templateId: string): EmailTemplate | null {
    const templates = this.getStoredTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  // Private helper methods

  private static async deliverNotification(notificationId: string): Promise<void> {
    try {
      const notifications = this.getStoredNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) return;

      // Simulate email delivery (in production, would use actual email service)
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        notification.status = 'delivered';
        notification.sentAt = new Date().toISOString();
        notification.deliveredAt = new Date().toISOString();
      } else {
        notification.status = 'failed';
        notification.failureReason = 'SMTP connection failed';
        notification.retryCount++;
      }

      this.saveNotifications(notifications);

      ErrorHandlingService.info(
        `Email ${success ? 'delivered' : 'failed'}: ${notification.recipientEmail}`,
        'email_delivery',
        { notificationId, success, recipient: notification.recipientEmail }
      );
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to deliver email notification',
        error as Error,
        'email_delivery'
      );
    }
  }

  private static processTemplate(template: EmailTemplate, variables: Record<string, unknown>): {
    subject: string;
    htmlContent: string;
    textContent: string;
  } {
    let subject = template.subject;
    let htmlContent = template.htmlContent;
    let textContent = template.textContent;

    // Replace variables in content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const stringValue = String(value);
      
      subject = subject.replace(new RegExp(placeholder, 'g'), stringValue);
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), stringValue);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), stringValue);
    });

    return { subject, htmlContent, textContent };
  }

  private static evaluateConditions(conditions: EmailCondition[], eventData: Record<string, unknown>): boolean {
    return conditions.every(condition => {
      const value = (eventData as Record<string, unknown>)[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'not_contains':
          return !String(value).includes(String(condition.value));
        default:
          return true;
      }
    });
  }

  private static async resolveRecipients(
    recipients: EmailRecipient[],
    eventData: Record<string, unknown>
  ): Promise<Array<{ email: string; name?: string }>> {
    const resolved: Array<{ email: string; name?: string }> = [];

    for (const recipient of recipients) {
      const email = await this.resolveRecipientEmail(recipient);
      if (email) {
        resolved.push({ email, name: recipient.name });
      }
    }

    return resolved;
  }

  private static async resolveRecipientEmail(recipient: EmailRecipient): Promise<string | null> {
    switch (recipient.type) {
      case 'email':
        return recipient.identifier;
      case 'user':
        // Would look up user email from database
        return `user-${recipient.identifier}@example.com`;
      case 'role':
        // Would look up users with specific role
        return `role-${recipient.identifier}@example.com`;
      default:
        return null;
    }
  }

  private static calculateTemplateAnalytics(notifications: EmailNotification[]): Record<string, { sent: number; delivered: number; opened: number; clicked: number }> {
    const templateStats: Record<string, { sent: number; delivered: number; opened: number; clicked: number }> = {};
    
    notifications.forEach(notification => {
      if (!templateStats[notification.templateId]) {
        templateStats[notification.templateId] = {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0
        };
      }
      
      const stats = templateStats[notification.templateId];
      if (notification.status === 'sent' || notification.status === 'delivered') {
        stats.sent++;
      }
      if (notification.status === 'delivered') {
        stats.delivered++;
      }
    });

    return templateStats;
  }

  private static calculateRecipientAnalytics(notifications: EmailNotification[]): Record<string, { sent: number; delivered: number; lastSent: string }> {
    const recipientStats: Record<string, { sent: number; delivered: number; lastSent: string }> = {};
    
    notifications.forEach(notification => {
      if (!recipientStats[notification.recipientEmail]) {
        recipientStats[notification.recipientEmail] = {
          sent: 0,
          delivered: 0,
          lastSent: notification.createdAt
        };
      }
      
      const stats = recipientStats[notification.recipientEmail];
      if (notification.status === 'sent' || notification.status === 'delivered') {
        stats.sent++;
      }
      if (notification.status === 'delivered') {
        stats.delivered++;
      }
      
      if (notification.createdAt > stats.lastSent) {
        stats.lastSent = notification.createdAt;
      }
    });

    return recipientStats;
  }

  private static calculateEmailTrends(notifications: EmailNotification[]): Array<{ date: string; sent: number; delivered: number; opened: number }> {
    const dailyStats: Record<string, { sent: number; delivered: number; opened: number }> = {};
    
    notifications.forEach(notification => {
      const date = notification.createdAt.split('T')[0];
      
      if (!dailyStats[date]) {
        dailyStats[date] = { sent: 0, delivered: 0, opened: 0 };
      }
      
      if (notification.status === 'sent' || notification.status === 'delivered') {
        dailyStats[date].sent++;
      }
      if (notification.status === 'delivered') {
        dailyStats[date].delivered++;
      }
    });

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static generateId(): string {
    return `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static createDefaultTemplates(): void {
    const templates: EmailTemplate[] = [
      {
        id: 'welcome-user',
        name: 'Willkommen bei Bauplan Buddy',
        subject: 'Willkommen bei Bauplan Buddy, {{userName}}!',
        htmlContent: `
          <h1>Willkommen bei Bauplan Buddy!</h1>
          <p>Hallo {{userName}},</p>
          <p>vielen Dank für Ihre Registrierung bei Bauplan Buddy. Wir freuen uns, Sie in unserem Team begrüßen zu dürfen!</p>
          <p>Mit Bauplan Buddy können Sie:</p>
          <ul>
            <li>Bauprojekte effizient verwalten</li>
            <li>Budgets und Kosten verfolgen</li>
            <li>Termine und Meilensteine überwachen</li>
            <li>Dokumente zentral organisieren</li>
          </ul>
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <p>Viele Grüße<br>Ihr Bauplan Buddy Team</p>
        `,
        textContent: 'Willkommen bei Bauplan Buddy! Vielen Dank für Ihre Registrierung...',
        category: 'system',
        language: 'de',
        variables: [
          { key: 'userName', name: 'Benutzername', description: 'Name des Benutzers', required: true, type: 'string' }
        ],
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];

    this.saveTemplates(templates);
  }

  private static createDefaultSettings(): void {
    const settings: EmailSettings = {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: true,
      defaultSenderEmail: 'noreply@bauplan-buddy.de',
      defaultSenderName: 'Bauplan Buddy',
      maxRetries: 3,
      retryDelay: 30,
      enableBounceTracking: true,
      enableClickTracking: true,
      enableOpenTracking: true
    };

    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  private static createDefaultTriggers(): void {
    const triggers: EmailTrigger[] = [
      {
        id: 'project-milestone-achieved',
        name: 'Meilenstein erreicht',
        description: 'Benachrichtigung bei erreichtem Meilenstein',
        eventType: 'milestone_achieved',
        templateId: 'milestone-achieved',
        conditions: [],
        recipients: [
          { type: 'project_team', identifier: 'project_manager' },
          { type: 'project_team', identifier: 'client' }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.saveTriggers(triggers);
  }

  private static saveNotification(notification: EmailNotification): void {
    const notifications = this.getStoredNotifications();
    notifications.push(notification);
    this.saveNotifications(notifications);
  }

  private static saveCampaign(campaign: EmailCampaign): void {
    const campaigns = this.getStoredCampaigns().filter(c => c.id !== campaign.id);
    campaigns.push(campaign);
    localStorage.setItem(this.CAMPAIGNS_KEY, JSON.stringify(campaigns));
  }

  private static getEmailSettings(): EmailSettings | null {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private static getStoredTemplates(): EmailTemplate[] {
    try {
      const data = localStorage.getItem(this.TEMPLATES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static getStoredNotifications(): EmailNotification[] {
    try {
      const data = localStorage.getItem(this.NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static getStoredTriggers(): EmailTrigger[] {
    try {
      const data = localStorage.getItem(this.TRIGGERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static getStoredCampaigns(): EmailCampaign[] {
    try {
      const data = localStorage.getItem(this.CAMPAIGNS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveTemplates(templates: EmailTemplate[]): void {
    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
  }

  private static saveNotifications(notifications: EmailNotification[]): void {
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  private static saveTriggers(triggers: EmailTrigger[]): void {
    localStorage.setItem(this.TRIGGERS_KEY, JSON.stringify(triggers));
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  EmailNotificationService.initialize();
}
