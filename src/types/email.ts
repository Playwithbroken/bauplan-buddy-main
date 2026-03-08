import { StoredAppointment } from '../services/appointmentService';

// Email provider configuration types
export type EmailProvider = 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'outlook' | 'gmail';

export interface EmailConfig {
  provider: EmailProvider;
  apiKey?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  bcc?: string[];
  maxRetries: number;
  timeout: number;
}

// Email recipient types
export interface EmailRecipient {
  email: string;
  name?: string;
  type: 'to' | 'cc' | 'bcc';
  role?: 'organizer' | 'attendee' | 'optional' | 'resource';
}

// Email attachment types
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  encoding?: string;
  cid?: string; // Content ID for inline attachments
}

// Calendar invite (.ics) specific interface
export interface CalendarInvite {
  filename: string;
  content: string;
  method: 'REQUEST' | 'CANCEL' | 'REPLY';
  sequence: number;
}

// Email template variables
export interface EmailTemplateVariables {
  // Appointment details
  appointmentTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentEndTime: string;
  appointmentLocation?: string;
  appointmentDescription?: string;
  appointmentType: string;
  appointmentPriority: string;
  
  // Organizer details
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  companyName: string;
  companyLogo?: string;
  
  // Recipient details
  recipientName: string;
  recipientEmail: string;
  
  // Project details
  projectName?: string;
  projectCustomer?: string;
  projectLocation?: string;
  
  // Meeting details
  meetingLink?: string;
  dialInNumber?: string;
  accessCode?: string;
  
  // Action URLs
  acceptUrl?: string;
  declineUrl?: string;
  tentativeUrl?: string;
  rescheduleUrl?: string;
  calendarUrl?: string;
  
  // System details
  systemUrl: string;
  supportEmail: string;
  unsubscribeUrl?: string;
  
  // Custom variables
  customFields?: Record<string, string>;
}

// Email notification types
export type EmailNotificationType = 
  | 'invitation'           // Initial appointment invitation
  | 'update'              // Appointment details changed
  | 'cancellation'        // Appointment cancelled
  | 'reminder_24h'        // 24 hours before reminder
  | 'reminder_2h'         // 2 hours before reminder
  | 'reminder_15m'        // 15 minutes before reminder
  | 'reschedule'          // Appointment rescheduled
  | 'confirmation'        // Appointment confirmed
  | 'follow_up'           // Post-appointment follow-up
  | 'recurring_reminder'  // Recurring series reminder
  | 'series_update'       // Recurring series updated
  | 'series_cancellation' // Recurring series cancelled
  | 'conflict_notification' // Resource conflict detected
  | 'manual_notification'; // Manual notification

// Email notification settings
export interface EmailNotificationSettings {
  enabled: boolean;
  type: EmailNotificationType;
  template: string;
  sendToOrganizer: boolean;
  sendToAttendees: boolean;
  sendToOptional: boolean;
  sendToBcc?: string[];
  timing?: {
    minutes?: number;
    hours?: number;
    days?: number;
  };
  conditions?: {
    appointmentTypes?: string[];
    priorities?: string[];
    projects?: string[];
    minDuration?: number; // in minutes
  };
}

// User email preferences
export interface UserEmailPreferences {
  userId: string;
  email: string;
  notifications: {
    invitations: boolean;
    updates: boolean;
    reminders: boolean;
    cancellations: boolean;
    followUps: boolean;
  };
  reminderTiming: {
    enabled: boolean;
    times: number[]; // minutes before appointment
  };
  digestSettings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    includeCompleted: boolean;
  };
  language: 'de' | 'en';
  timezone: string;
}

// Email message interface
export interface EmailMessage {
  id: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  textContent: string;
  htmlContent: string;
  attachments?: EmailAttachment[];
  calendarInvite?: CalendarInvite;
  headers?: Record<string, string>;
  metadata: {
    appointmentId: string;
    notificationType: EmailNotificationType;
    templateId: string;
    variables: EmailTemplateVariables;
    priority: 'low' | 'normal' | 'high';
    sendAt?: string; // ISO timestamp for scheduled sending
  };
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  status: EmailStatus;
  error?: string;
  retryCount: number;
}

// Email status tracking
export type EmailStatus = 
  | 'draft'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'cancelled';

// Email template interface
export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  type: EmailNotificationType;
  language: 'de' | 'en';
  subject: string;
  textContent: string;
  htmlContent: string;
  variables: string[]; // List of required variables
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  tags?: string[];
}

// Email queue item
export interface EmailQueueItem {
  id: string;
  message: EmailMessage;
  priority: number;
  attempts: number;
  maxAttempts: number;
  nextAttempt: string;
  delay?: number; // seconds to delay before sending
  error?: string;
  createdAt: string;
}

// Email service response types
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
  timestamp: string;
}

export interface EmailDeliveryStatus {
  messageId: string;
  status: EmailStatus;
  timestamp: string;
  recipient: string;
  error?: string;
  metadata?: Record<string, string>;
}

// Email analytics and tracking
export interface EmailAnalytics {
  appointmentId: string;
  messageId: string;
  notificationType: EmailNotificationType;
  events: EmailEvent[];
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  };
}

export interface EmailEvent {
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  timestamp: string;
  recipient: string;
  metadata?: Record<string, string>;
}

// Email service configuration
export interface EmailServiceConfig {
  enabled: boolean;
  provider: EmailConfig;
  templates: EmailTemplate[];
  defaultSettings: EmailNotificationSettings[];
  rateLimits: {
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number; // seconds
    maxDelay: number; // seconds
  };
  monitoring: {
    trackOpens: boolean;
    trackClicks: boolean;
    webhookUrl?: string;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

// Email validation result
export interface EmailValidationResult {
  isValid: boolean;
  email: string;
  errors: string[];
  suggestions?: string[];
  metadata?: {
    provider?: string;
    disposable?: boolean;
    roleAccount?: boolean;
  };
}

// Bulk email operation
export interface BulkEmailOperation {
  id: string;
  type: 'invitation' | 'reminder' | 'update' | 'cancellation';
  appointmentIds: string[];
  template: string;
  recipients: EmailRecipient[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    sent: number;
    failed: number;
  };
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Email subscription management
export interface EmailSubscription {
  email: string;
  userId?: string;
  subscriptions: {
    appointments: boolean;
    reminders: boolean;
    updates: boolean;
    marketing: boolean;
  };
  unsubscribeToken: string;
  createdAt: string;
  updatedAt: string;
}

// System email settings (admin level)
export interface SystemEmailSettings {
  companyName: string;
  companyLogo?: string;
  supportEmail: string;
  noreplyEmail: string;
  defaultTimezone: string;
  defaultLanguage: 'de' | 'en';
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  socialLinks?: {
    website?: string;
    linkedin?: string;
    xing?: string;
  };
  legalInfo: {
    companyAddress: string;
    managingDirector: string;
    registrationNumber: string;
    vatNumber?: string;
  };
  emailFooter: {
    de: string;
    en: string;
  };
}

// Email service interface
export interface IEmailService {
  // Configuration
  configure(config: EmailServiceConfig): Promise<void>;
  getConfig(): EmailServiceConfig;
  
  // Template management
  getTemplates(): Promise<EmailTemplate[]>;
  getTemplate(id: string): Promise<EmailTemplate | null>;
  createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate>;
  updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate>;
  deleteTemplate(id: string): Promise<void>;
  
  // Message handling
  sendEmail(message: Omit<EmailMessage, 'id' | 'createdAt' | 'status' | 'retryCount'>): Promise<EmailSendResult>;
  sendBulkEmail(operation: Omit<BulkEmailOperation, 'id' | 'status' | 'progress'>): Promise<BulkEmailOperation>;
  scheduleEmail(message: Omit<EmailMessage, 'id' | 'createdAt' | 'status' | 'retryCount'>, sendAt: Date): Promise<string>;
  
  // Appointment notifications
  sendAppointmentInvitation(appointment: StoredAppointment, recipients: EmailRecipient[]): Promise<EmailSendResult>;
  sendAppointmentUpdate(appointment: StoredAppointment, recipients: EmailRecipient[], changes: string[]): Promise<EmailSendResult>;
  sendAppointmentCancellation(appointment: StoredAppointment, recipients: EmailRecipient[], reason?: string): Promise<EmailSendResult>;
  sendAppointmentReminder(appointment: StoredAppointment, recipients: EmailRecipient[], timing: number): Promise<EmailSendResult>;
  
  // Status and tracking
  getEmailStatus(messageId: string): Promise<EmailDeliveryStatus>;
  getEmailAnalytics(appointmentId: string): Promise<EmailAnalytics>;
  retryFailedEmail(messageId: string): Promise<EmailSendResult>;
  cancelScheduledEmail(messageId: string): Promise<void>;
  
  // Validation and utilities
  validateEmail(email: string): Promise<EmailValidationResult>;
  validateTemplate(template: EmailTemplate): Promise<{ isValid: boolean; errors: string[] }>;
  generateCalendarInvite(appointment: StoredAppointment, method?: 'REQUEST' | 'CANCEL'): Promise<CalendarInvite>;
  
  // User preferences
  getUserPreferences(userId: string): Promise<UserEmailPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<UserEmailPreferences>): Promise<UserEmailPreferences>;
  
  // Subscription management
  subscribe(email: string, subscriptions: EmailSubscription['subscriptions']): Promise<EmailSubscription>;
  unsubscribe(token: string): Promise<void>;
  getSubscription(email: string): Promise<EmailSubscription | null>;
}

// Default email notification settings
export const DEFAULT_EMAIL_NOTIFICATIONS: EmailNotificationSettings[] = [
  {
    enabled: true,
    type: 'invitation',
    template: 'appointment-invitation',
    sendToOrganizer: false,
    sendToAttendees: true,
    sendToOptional: true
  },
  {
    enabled: true,
    type: 'update',
    template: 'appointment-update',
    sendToOrganizer: false,
    sendToAttendees: true,
    sendToOptional: true
  },
  {
    enabled: true,
    type: 'cancellation',
    template: 'appointment-cancellation',
    sendToOrganizer: false,
    sendToAttendees: true,
    sendToOptional: true
  },
  {
    enabled: true,
    type: 'reminder_24h',
    template: 'appointment-reminder-24h',
    sendToOrganizer: true,
    sendToAttendees: true,
    sendToOptional: false,
    timing: { hours: 24 }
  },
  {
    enabled: true,
    type: 'reminder_2h',
    template: 'appointment-reminder-2h',
    sendToOrganizer: true,
    sendToAttendees: true,
    sendToOptional: false,
    timing: { hours: 2 }
  }
];

// Email template variable helpers
export const REQUIRED_TEMPLATE_VARIABLES = {
  invitation: ['appointmentTitle', 'appointmentDate', 'appointmentTime', 'organizerName', 'recipientName'],
  update: ['appointmentTitle', 'appointmentDate', 'appointmentTime', 'organizerName', 'recipientName'],
  cancellation: ['appointmentTitle', 'appointmentDate', 'organizerName', 'recipientName'],
  reminder: ['appointmentTitle', 'appointmentDate', 'appointmentTime', 'recipientName'],
  confirmation: ['appointmentTitle', 'appointmentDate', 'appointmentTime', 'organizerName', 'recipientName']
};

export const OPTIONAL_TEMPLATE_VARIABLES = [
  'appointmentLocation', 'appointmentDescription', 'projectName', 'projectCustomer',
  'meetingLink', 'dialInNumber', 'accessCode', 'organizerPhone', 'companyLogo',
  'acceptUrl', 'declineUrl', 'rescheduleUrl', 'unsubscribeUrl'
];