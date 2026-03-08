/**
 * Notification Bot Service
 * Send notifications via WhatsApp and Telegram bots
 */

export type BotPlatform = 'whatsapp' | 'telegram';

export interface BotConfig {
  platform: BotPlatform;
  apiKey: string;
  webhookUrl?: string;
  phoneNumberId?: string; // For WhatsApp
  botToken?: string; // For Telegram
  chatId?: string; // For Telegram
}

export interface NotificationRecipient {
  id: string;
  name: string;
  platform: BotPlatform;
  identifier: string; // Phone number for WhatsApp, chat ID for Telegram
  verified: boolean;
  preferences: {
    projectUpdates: boolean;
    taskAssignments: boolean;
    deadlineReminders: boolean;
    invoiceAlerts: boolean;
    chatMessages: boolean;
  };
}

export interface BotMessage {
  id: string;
  recipientId: string;
  platform: BotPlatform;
  type: 'text' | 'template' | 'image' | 'document';
  content: string;
  templateId?: string;
  templateParams?: Record<string, string>;
  attachmentUrl?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  platform: BotPlatform;
  category: 'project' | 'task' | 'invoice' | 'reminder' | 'alert' | 'custom';
  content: string;
  variables: string[]; // e.g., ['projectName', 'dueDate']
  approved?: boolean; // For WhatsApp Business API
}

// Default message templates
const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'project-update',
    name: 'Projekt-Update',
    platform: 'whatsapp',
    category: 'project',
    content: '📋 *Projekt-Update*\n\nProjekt: {{projectName}}\n{{updateText}}\n\nAktualisiert von: {{updatedBy}}',
    variables: ['projectName', 'updateText', 'updatedBy'],
    approved: true,
  },
  {
    id: 'task-assigned',
    name: 'Aufgabe zugewiesen',
    platform: 'whatsapp',
    category: 'task',
    content: '✅ *Neue Aufgabe*\n\n{{taskName}}\nProjekt: {{projectName}}\nFällig: {{dueDate}}\n\nZugewiesen von: {{assignedBy}}',
    variables: ['taskName', 'projectName', 'dueDate', 'assignedBy'],
    approved: true,
  },
  {
    id: 'deadline-reminder',
    name: 'Erinnerung',
    platform: 'whatsapp',
    category: 'reminder',
    content: '⏰ *Erinnerung*\n\n{{taskName}} ist in {{timeRemaining}} fällig.\n\nProjekt: {{projectName}}',
    variables: ['taskName', 'timeRemaining', 'projectName'],
    approved: true,
  },
  {
    id: 'invoice-alert',
    name: 'Rechnungsalarm',
    platform: 'whatsapp',
    category: 'invoice',
    content: '💰 *Rechnung*\n\nRechnung {{invoiceNumber}} über {{amount}} ist {{status}}.\n\nKunde: {{clientName}}',
    variables: ['invoiceNumber', 'amount', 'status', 'clientName'],
    approved: true,
  },
  // Telegram templates
  {
    id: 'tg-project-update',
    name: 'Projekt-Update',
    platform: 'telegram',
    category: 'project',
    content: '📋 <b>Projekt-Update</b>\n\nProjekt: {{projectName}}\n{{updateText}}\n\nAktualisiert von: {{updatedBy}}',
    variables: ['projectName', 'updateText', 'updatedBy'],
  },
  {
    id: 'tg-task-assigned',
    name: 'Aufgabe zugewiesen',
    platform: 'telegram',
    category: 'task',
    content: '✅ <b>Neue Aufgabe</b>\n\n{{taskName}}\nProjekt: {{projectName}}\nFällig: {{dueDate}}\n\nZugewiesen von: {{assignedBy}}',
    variables: ['taskName', 'projectName', 'dueDate', 'assignedBy'],
  },
];

class NotificationBotService {
  private config: Map<BotPlatform, BotConfig> = new Map();
  private recipients: Map<string, NotificationRecipient> = new Map();
  private templates: Map<string, MessageTemplate> = new Map();
  private messageQueue: BotMessage[] = [];

  /**
   * Initialize service
   */
  initialize(): void {
    this.loadRecipients();
    this.loadTemplates();
    DEFAULT_TEMPLATES.forEach((t) => this.templates.set(t.id, t));
  }

  /**
   * Configure a bot platform
   */
  configurePlatform(config: BotConfig): void {
    this.config.set(config.platform, config);
  }

  /**
   * Check if platform is configured
   */
  isPlatformConfigured(platform: BotPlatform): boolean {
    return this.config.has(platform);
  }

  /**
   * Add a recipient
   */
  addRecipient(recipient: Omit<NotificationRecipient, 'id'>): NotificationRecipient {
    const newRecipient: NotificationRecipient = {
      ...recipient,
      id: `recipient-${Date.now()}`,
    };
    this.recipients.set(newRecipient.id, newRecipient);
    this.saveRecipients();
    return newRecipient;
  }

  /**
   * Update recipient
   */
  updateRecipient(id: string, updates: Partial<NotificationRecipient>): void {
    const recipient = this.recipients.get(id);
    if (!recipient) return;

    Object.assign(recipient, updates);
    this.saveRecipients();
  }

  /**
   * Remove recipient
   */
  removeRecipient(id: string): void {
    this.recipients.delete(id);
    this.saveRecipients();
  }

  /**
   * Get all recipients
   */
  getRecipients(platform?: BotPlatform): NotificationRecipient[] {
    const all = Array.from(this.recipients.values());
    return platform ? all.filter((r) => r.platform === platform) : all;
  }

  /**
   * Send verification code to a new recipient
   */
  async sendVerification(recipientId: string): Promise<boolean> {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return false;

    const verificationCode = Math.random().toString().slice(2, 8);
    
    // Store verification code (in production, store securely with expiry)
    localStorage.setItem(`verify-${recipientId}`, verificationCode);

    const message = `🔐 Ihr Verifizierungscode für Bauplan Buddy: ${verificationCode}`;

    try {
      if (recipient.platform === 'whatsapp') {
        await this.sendWhatsAppMessage(recipient.identifier, message);
      } else {
        await this.sendTelegramMessage(recipient.identifier, message);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify recipient with code
   */
  verifyRecipient(recipientId: string, code: string): boolean {
    const storedCode = localStorage.getItem(`verify-${recipientId}`);
    if (storedCode === code) {
      const recipient = this.recipients.get(recipientId);
      if (recipient) {
        recipient.verified = true;
        this.saveRecipients();
        localStorage.removeItem(`verify-${recipientId}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    recipientId: string,
    templateId: string,
    params: Record<string, string>
  ): Promise<BotMessage | null> {
    const recipient = this.recipients.get(recipientId);
    const template = this.templates.get(templateId);

    if (!recipient || !template || !recipient.verified) {
      return null;
    }

    // Check recipient preferences
    if (!this.checkPreferences(recipient, template.category)) {
      return null;
    }

    // Render template
    let content = template.content;
    for (const [key, value] of Object.entries(params)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    const message: BotMessage = {
      id: `msg-${Date.now()}`,
      recipientId,
      platform: recipient.platform,
      type: 'template',
      content,
      templateId,
      templateParams: params,
      status: 'pending',
    };

    try {
      if (recipient.platform === 'whatsapp') {
        await this.sendWhatsAppMessage(recipient.identifier, content);
      } else {
        await this.sendTelegramMessage(recipient.identifier, content);
      }

      message.sentAt = new Date();
      message.status = 'sent';
    } catch (error) {
      message.status = 'failed';
      message.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return message;
  }

  /**
   * Send direct text message
   */
  async sendTextMessage(recipientId: string, text: string): Promise<BotMessage | null> {
    const recipient = this.recipients.get(recipientId);
    if (!recipient || !recipient.verified) return null;

    const message: BotMessage = {
      id: `msg-${Date.now()}`,
      recipientId,
      platform: recipient.platform,
      type: 'text',
      content: text,
      status: 'pending',
    };

    try {
      if (recipient.platform === 'whatsapp') {
        await this.sendWhatsAppMessage(recipient.identifier, text);
      } else {
        await this.sendTelegramMessage(recipient.identifier, text);
      }

      message.sentAt = new Date();
      message.status = 'sent';
    } catch (error) {
      message.status = 'failed';
      message.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return message;
  }

  /**
   * Broadcast message to multiple recipients
   */
  async broadcast(
    category: MessageTemplate['category'],
    templateId: string,
    params: Record<string, string>,
    recipientFilter?: (r: NotificationRecipient) => boolean
  ): Promise<{ sent: number; failed: number }> {
    let recipients = Array.from(this.recipients.values()).filter(
      (r) => r.verified && this.checkPreferences(r, category)
    );

    if (recipientFilter) {
      recipients = recipients.filter(recipientFilter);
    }

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      // Find platform-specific template
      const template = Array.from(this.templates.values()).find(
        (t) => t.category === category && t.platform === recipient.platform
      );

      if (!template) {
        failed++;
        continue;
      }

      const result = await this.sendTemplateMessage(recipient.id, template.id, params);
      if (result?.status === 'sent') {
        sent++;
      } else {
        failed++;
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return { sent, failed };
  }

  /**
   * Get message templates
   */
  getTemplates(platform?: BotPlatform): MessageTemplate[] {
    const all = Array.from(this.templates.values());
    return platform ? all.filter((t) => t.platform === platform) : all;
  }

  /**
   * Add custom template
   */
  addTemplate(template: Omit<MessageTemplate, 'id'>): MessageTemplate {
    const newTemplate: MessageTemplate = {
      ...template,
      id: `template-${Date.now()}`,
    };
    this.templates.set(newTemplate.id, newTemplate);
    this.saveTemplates();
    return newTemplate;
  }

  // Private methods

  private async sendWhatsAppMessage(phone: string, message: string): Promise<void> {
    const config = this.config.get('whatsapp');
    if (!config) throw new Error('WhatsApp not configured');

    // In production, call WhatsApp Business API
    console.log(`[WhatsApp] Sending to ${phone}: ${message.substring(0, 50)}...`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Example actual implementation:
    // const response = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${config.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: phone,
    //     type: 'text',
    //     text: { body: message },
    //   }),
    // });
  }

  private async sendTelegramMessage(chatId: string, message: string): Promise<void> {
    const config = this.config.get('telegram');
    if (!config) throw new Error('Telegram not configured');

    // In production, call Telegram Bot API
    console.log(`[Telegram] Sending to ${chatId}: ${message.substring(0, 50)}...`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Example actual implementation:
    // const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     chat_id: chatId,
    //     text: message,
    //     parse_mode: 'HTML',
    //   }),
    // });
  }

  private checkPreferences(
    recipient: NotificationRecipient,
    category: MessageTemplate['category']
  ): boolean {
    switch (category) {
      case 'project':
        return recipient.preferences.projectUpdates;
      case 'task':
        return recipient.preferences.taskAssignments;
      case 'reminder':
        return recipient.preferences.deadlineReminders;
      case 'invoice':
        return recipient.preferences.invoiceAlerts;
      case 'alert':
      case 'custom':
        return true;
      default:
        return true;
    }
  }

  private saveRecipients(): void {
    try {
      const data = Array.from(this.recipients.values());
      localStorage.setItem('bot_recipients', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save recipients:', e);
    }
  }

  private loadRecipients(): void {
    try {
      const data = localStorage.getItem('bot_recipients');
      if (data) {
        const recipients: NotificationRecipient[] = JSON.parse(data);
        recipients.forEach((r) => this.recipients.set(r.id, r));
      }
    } catch (e) {
      console.error('Failed to load recipients:', e);
    }
  }

  private saveTemplates(): void {
    try {
      const customTemplates = Array.from(this.templates.values()).filter(
        (t) => t.id.startsWith('template-')
      );
      localStorage.setItem('bot_templates', JSON.stringify(customTemplates));
    } catch (e) {
      console.error('Failed to save templates:', e);
    }
  }

  private loadTemplates(): void {
    try {
      const data = localStorage.getItem('bot_templates');
      if (data) {
        const templates: MessageTemplate[] = JSON.parse(data);
        templates.forEach((t) => this.templates.set(t.id, t));
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }
}

// Export singleton
export const notificationBotService = new NotificationBotService();
export default notificationBotService;
