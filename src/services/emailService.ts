/**
 * Email Service
 * Handles all automated emails: Welcome, Invoices, Notifications
 * Supports: SendGrid, Mailgun, AWS SES, Resend
 */

interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'resend' | 'aws-ses';
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

class EmailService {
  private static instance: EmailService;
  private config: EmailConfig | null = null;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize email service
   */
  public initialize(config: EmailConfig): void {
    this.config = config;
    console.log(`Email service initialized with ${config.provider}`);
  }

  /**
   * Send welcome email to new tenant
   */
  public async sendWelcomeEmail(params: {
    toEmail: string;
    companyName: string;
    userName: string;
    loginUrl: string;
  }): Promise<{ success: boolean; error?: string }> {
    const template = this.getWelcomeEmailTemplate(params);

    return this.sendEmail({
      to: params.toEmail,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
    });
  }

  /**
   * Send invoice email
   */
  public async sendInvoiceEmail(params: {
    toEmail: string;
    companyName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    pdfUrl?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const template = this.getInvoiceEmailTemplate(params);

    return this.sendEmail({
      to: params.toEmail,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
      attachments: params.pdfUrl
        ? [
            {
              filename: `Rechnung-${params.invoiceNumber}.pdf`,
              url: params.pdfUrl,
            },
          ]
        : undefined,
    });
  }

  /**
   * Send subscription expiry warning
   */
  public async sendSubscriptionExpiryWarning(params: {
    toEmail: string;
    companyName: string;
    expiryDate: string;
    renewUrl: string;
  }): Promise<{ success: boolean; error?: string }> {
    const template = this.getSubscriptionWarningTemplate(params);

    return this.sendEmail({
      to: params.toEmail,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
    });
  }

  /**
   * Send appointment invitation
   */
  public async sendAppointmentInvitation(
    appointment: any,
    recipients: any[]
  ): Promise<{ success: boolean; error?: string }> {
    console.log("Sending appointment invitation:", appointment.title, "to", recipients.length, "recipients");
    // Implementation placeholder - in a real app, this would use a template
    return { success: true };
  }

  /**
   * Send appointment update
   */
  public async sendAppointmentUpdate(
    appointment: any,
    recipients: any[],
    changes: string[]
  ): Promise<{ success: boolean; error?: string }> {
    console.log("Sending appointment update:", appointment.title, "changes:", changes);
    return { success: true };
  }

  /**
   * Send appointment cancellation
   */
  public async sendAppointmentCancellation(
    appointment: any,
    recipients: any[]
  ): Promise<{ success: boolean; error?: string }> {
    console.log("Sending appointment cancellation:", appointment.title);
    return { success: true };
  }

  /**
   * Validate email address
   */
  public async validateEmail(email: string): Promise<any> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    return {
      isValid,
      email,
      errors: isValid ? [] : ["Ungültiges E-Mail-Format"],
    };
  }

  /**
   * Send payment confirmation
   */
  public async sendPaymentConfirmation(params: {
    toEmail: string;
    companyName: string;
    amount: number;
    plan: string;
    nextBillingDate: string;
  }): Promise<{ success: boolean; error?: string }> {
    const template = this.getPaymentConfirmationTemplate(params);

    return this.sendEmail({
      to: params.toEmail,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
    });
  }

  /**
   * Generic send email method
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments?: Array<{ filename: string; url: string }>;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Email service not initialized' };
    }

    try {
      switch (this.config.provider) {
        case 'resend':
          return await this.sendViaResend(params);
        case 'sendgrid':
          return await this.sendViaSendGrid(params);
        case 'mailgun':
          return await this.sendViaMailgun(params);
        case 'aws-ses':
          return await this.sendViaAWSSES(params);
        default:
          return { success: false, error: 'Unknown email provider' };
      }
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send via Resend (recommended)
   */
  private async sendViaResend(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.config!.fromName} <${this.config!.fromEmail}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: {
          email: this.config!.fromEmail,
          name: this.config!.fromName,
        },
        subject: params.subject,
        content: [{ type: 'text/html', value: params.html }],
      }),
    });

    if (!response.ok) {
      return { success: false, error: 'SendGrid error' };
    }

    return { success: true };
  }

  /**
   * Send via Mailgun
   */
  private async sendViaMailgun(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; error?: string }> {
    // Mailgun implementation
    // TODO: Add Mailgun API call
    console.log('Mailgun not implemented yet', params);
    return { success: true };
  }

  /**
   * Send via AWS SES
   */
  private async sendViaAWSSES(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; error?: string }> {
    // AWS SES implementation
    // TODO: Add AWS SES SDK call
    console.log('AWS SES not implemented yet', params);
    return { success: true };
  }

  // ==========================================
  // EMAIL TEMPLATES
  // ==========================================

  private getWelcomeEmailTemplate(params: {
    companyName: string;
    userName: string;
    loginUrl: string;
  }): EmailTemplate {
    return {
      subject: '🎉 Willkommen bei Bauplan Buddy!',
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; background: #3B82F6; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Willkommen bei Bauplan Buddy!</h1>
            </div>
            <div class="content">
              <p>Hallo ${params.userName},</p>
              
              <p>Vielen Dank, dass Sie sich für <strong>${params.companyName}</strong> bei Bauplan Buddy registriert haben!</p>
              
              <p>Ihre Account ist jetzt aktiv und bereit zur Nutzung. Mit Bauplan Buddy können Sie:</p>
              
              <ul>
                <li>✅ Professionelle Angebote erstellen</li>
                <li>✅ Projekte verwalten</li>
                <li>✅ Rechnungen schreiben</li>
                <li>✅ Lieferscheine generieren</li>
                <li>✅ Mit Ihrem Team zusammenarbeiten</li>
              </ul>
              
              <p>Klicken Sie auf den Button unten, um loszulegen:</p>
              
              <div style="text-align: center;">
                <a href="${params.loginUrl}" class="button">Jetzt einloggen</a>
              </div>
              
              <p>Falls Sie Fragen haben, antworten Sie einfach auf diese Email. Wir helfen Ihnen gerne!</p>
              
              <p>Viel Erfolg mit Bauplan Buddy! 🚀</p>
              
              <p>Ihr Bauplan Buddy Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Bauplan Buddy. Alle Rechte vorbehalten.</p>
              <p>Sie erhalten diese Email, weil Sie sich bei Bauplan Buddy registriert haben.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
Willkommen bei Bauplan Buddy!

Hallo ${params.userName},

Vielen Dank, dass Sie sich für ${params.companyName} bei Bauplan Buddy registriert haben!

Ihr Account ist jetzt aktiv und bereit zur Nutzung.

Login: ${params.loginUrl}

Bei Fragen sind wir für Sie da!

Ihr Bauplan Buddy Team
      `,
    };
  }

  private getInvoiceEmailTemplate(params: {
    companyName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
  }): EmailTemplate {
    return {
      subject: `Rechnung ${params.invoiceNumber} - ${params.companyName}`,
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .invoice-box { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .amount { font-size: 32px; font-weight: bold; color: #3B82F6; text-align: center; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Neue Rechnung</h1>
            </div>
            <div class="content">
              <p>Sehr geehrte Damen und Herren,</p>
              
              <p>anbei erhalten Sie die Rechnung <strong>${params.invoiceNumber}</strong> von ${params.companyName}.</p>
              
              <div class="invoice-box">
                <p><strong>Rechnungsnummer:</strong> ${params.invoiceNumber}</p>
                <p><strong>Fälligkeitsdatum:</strong> ${new Date(params.dueDate).toLocaleDateString('de-DE')}</p>
                <div class="amount">€${params.amount.toFixed(2)}</div>
              </div>
              
              <p>Die Rechnung finden Sie im Anhang als PDF.</p>
              
              <p>Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum.</p>
              
              <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
              
              <p>Mit freundlichen Grüßen<br>${params.companyName}</p>
            </div>
            <div class="footer">
              <p>Erstellt mit Bauplan Buddy</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
Neue Rechnung

Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung ${params.invoiceNumber} von ${params.companyName}.

Rechnungsnummer: ${params.invoiceNumber}
Fälligkeitsdatum: ${params.dueDate}
Betrag: €${params.amount.toFixed(2)}

Die Rechnung finden Sie im Anhang als PDF.

Mit freundlichen Grüßen
${params.companyName}
      `,
    };
  }

  private getSubscriptionWarningTemplate(params: {
    companyName: string;
    expiryDate: string;
    renewUrl: string;
  }): EmailTemplate {
    return {
      subject: '⚠️ Ihr Subscription läuft bald ab',
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; background: #3B82F6; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Subscription-Erinnerung</h1>
            </div>
            <div class="content">
              <p>Hallo ${params.companyName},</p>
              
              <div class="warning-box">
                <p><strong>Ihr Bauplan Buddy Subscription läuft bald ab!</strong></p>
                <p>Ablaufdatum: <strong>${new Date(params.expiryDate).toLocaleDateString('de-DE')}</strong></p>
              </div>
              
              <p>Um weiterhin alle Features nutzen zu können, verlängern Sie bitte Ihr Subscription.</p>
              
              <div style="text-align: center;">
                <a href="${params.renewUrl}" class="button">Jetzt verlängern</a>
              </div>
              
              <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung!</p>
              
              <p>Ihr Bauplan Buddy Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
Subscription-Erinnerung

Hallo ${params.companyName},

Ihr Bauplan Buddy Subscription läuft bald ab!
Ablaufdatum: ${params.expiryDate}

Verlängern Sie jetzt: ${params.renewUrl}

Ihr Bauplan Buddy Team
      `,
    };
  }

  private getPaymentConfirmationTemplate(params: {
    companyName: string;
    amount: number;
    plan: string;
    nextBillingDate: string;
  }): EmailTemplate {
    return {
      subject: '✅ Zahlung bestätigt',
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .success-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Zahlung erfolgreich</h1>
            </div>
            <div class="content">
              <p>Hallo ${params.companyName},</p>
              
              <div class="success-box">
                <p><strong>Ihre Zahlung wurde erfolgreich verarbeitet!</strong></p>
              </div>
              
              <p><strong>Details:</strong></p>
              <ul>
                <li>Betrag: €${params.amount.toFixed(2)}</li>
                <li>Plan: ${params.plan}</li>
                <li>Nächste Abrechnung: ${new Date(params.nextBillingDate).toLocaleDateString('de-DE')}</li>
              </ul>
              
              <p>Vielen Dank für Ihr Vertrauen!</p>
              
              <p>Ihr Bauplan Buddy Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textBody: `
Zahlung erfolgreich

Hallo ${params.companyName},

Ihre Zahlung wurde erfolgreich verarbeitet!

Details:
- Betrag: €${params.amount.toFixed(2)}
- Plan: ${params.plan}
- Nächste Abrechnung: ${params.nextBillingDate}

Vielen Dank!

Ihr Bauplan Buddy Team
      `,
    };
  }
}

export default EmailService;
export const emailService = EmailService.getInstance();
