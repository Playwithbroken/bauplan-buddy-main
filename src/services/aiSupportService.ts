/**
 * AI Support Service
 * Intelligenter Support mit KI-Hilfe für Probleme und Fragen
 */

import { supabase as supabaseClient } from './supabaseClient';

interface SupportTicket {
  id: string;
  userId: string;
  tenantId: string;
  subject: string;
  description: string;
  category: 'bug' | 'feature' | 'question' | 'update' | 'billing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_for_ai' | 'resolved' | 'closed';
  aiResponse?: string;
  aiSuggestions?: string[];
  resolvedBy?: 'ai' | 'human';
  createdAt: string;
  updatedAt: string;
}

interface AIAnalysisResult {
  canAutoResolve: boolean;
  confidence: number; // 0-100
  suggestedResponse: string;
  suggestedActions: string[];
  relatedDocs: string[];
  escalateToHuman: boolean;
}

class AISupportService {
  private static instance: AISupportService;
  private apiKey: string | null = null;
  private apiEndpoint = 'https://api.openai.com/v1/chat/completions';

  private constructor() {}

  public static getInstance(): AISupportService {
    if (!AISupportService.instance) {
      AISupportService.instance = new AISupportService();
    }
    return AISupportService.instance;
  }

  /**
   * Initialize AI Support with API Key
   */
  public initialize(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('AI Support Service initialized');
  }

  /**
   * Analyze support ticket with AI
   */
  public async analyzeTicket(ticket: {
    subject: string;
    description: string;
    userInfo?: Record<string, unknown>;
    errorLogs?: string[];
  }): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      return this.getFallbackResponse();
    }

    try {
      const prompt = this.buildSupportPrompt(ticket);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Du bist ein hilfreicher Support-Assistent für Bauplan Buddy, eine Bau-Management-Software. 
              Analysiere Support-Tickets und schlage Lösungen vor. 
              Beantworte auf Deutsch, klar und professionell.
              
              Wenn das Problem einfach ist (z.B. "Wie erstelle ich ein Angebot?"), gib direkt die Lösung.
              Wenn es komplex ist (z.B. Bugs, Billing), schlage vor, es zu einem menschlichen Support zu eskalieren.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('AI API request failed');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Build prompt for AI
   */
  private buildSupportPrompt(ticket: {
    subject: string;
    description: string;
    userInfo?: Record<string, unknown>;
    errorLogs?: string[];
  }): string {
    let prompt = `Support-Ticket:
Betreff: ${ticket.subject}
Beschreibung: ${ticket.description}
`;

    if (ticket.userInfo) {
      prompt += `\nBenutzer-Info: ${JSON.stringify(ticket.userInfo)}`;
    }

    if (ticket.errorLogs && ticket.errorLogs.length > 0) {
      prompt += `\nFehler-Logs:\n${ticket.errorLogs.join('\n')}`;
    }

    prompt += `\n\nBitte analysiere das Problem und gib:
1. Eine klare Lösung/Antwort (falls möglich)
2. Schritt-für-Schritt Anleitung
3. Verwandte Dokumentation/Hilfe-Artikel
4. Ob es zu einem Menschen eskaliert werden sollte (JA/NEIN)

Format deine Antwort als JSON:
{
  "canAutoResolve": true/false,
  "confidence": 0-100,
  "suggestedResponse": "...",
  "suggestedActions": ["Schritt 1", "Schritt 2"],
  "relatedDocs": ["link1", "link2"],
  "escalateToHuman": true/false
}`;

    return prompt;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: string): AIAnalysisResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          canAutoResolve: parsed.canAutoResolve || false,
          confidence: parsed.confidence || 50,
          suggestedResponse: parsed.suggestedResponse || response,
          suggestedActions: parsed.suggestedActions || [],
          relatedDocs: parsed.relatedDocs || [],
          escalateToHuman: parsed.escalateToHuman || false,
        };
      }

      // Fallback: Use entire response
      return {
        canAutoResolve: false,
        confidence: 30,
        suggestedResponse: response,
        suggestedActions: [],
        relatedDocs: [],
        escalateToHuman: true,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Fallback response when AI is not available
   */
  private getFallbackResponse(): AIAnalysisResult {
    return {
      canAutoResolve: false,
      confidence: 0,
      suggestedResponse:
        'Vielen Dank für Ihre Anfrage. Ein Support-Mitarbeiter wird sich in Kürze bei Ihnen melden.',
      suggestedActions: [
        'Prüfen Sie die Dokumentation unter /docs',
        'Schauen Sie in den FAQ nach häufigen Fragen',
      ],
      relatedDocs: ['/docs', '/faq'],
      escalateToHuman: true,
    };
  }

  /**
   * Get instant answer for common questions
   */
  public async getInstantAnswer(question: string): Promise<string> {
    // Check if question is asking for database search
    const databaseResult = await this.searchDatabase(question);
    if (databaseResult) {
      return databaseResult;
    }

    // Check knowledge base first
    const knownAnswer = this.checkKnowledgeBase(question);
    if (knownAnswer) {
      return knownAnswer;
    }

    // Use AI for custom answer
    try {
      const result = await this.analyzeTicket({
        subject: 'Frage',
        description: question,
      });

      return result.suggestedResponse;
    } catch (error) {
      console.error('Failed to get instant answer:', error);
      return 'Entschuldigung, ich konnte keine Antwort finden. Bitte kontaktieren Sie unseren Support.';
    }
  }

  /**
   * Search database for specific records
   */
  private async searchDatabase(question: string): Promise<string | null> {
    const lowerQuestion = question.toLowerCase();
    
    // Check if user is asking to search/find something
    const isSearchQuery = (
      lowerQuestion.includes('such') ||
      lowerQuestion.includes('find') ||
      lowerQuestion.includes('zeig') ||
      lowerQuestion.includes('show') ||
      lowerQuestion.includes('wo ist') ||
      lowerQuestion.includes('gibt es')
    );

    if (!isSearchQuery) {
      return null;
    }

    try {
      const client = supabaseClient.getClient();
      const currentUser = supabaseClient.getCurrentUser();

      if (!currentUser) {
        return '⚠️ Sie müssen angemeldet sein, um in der Datenbank zu suchen.';
      }

      const results: string[] = [];

      // Search projects
      if (lowerQuestion.includes('projekt') || lowerQuestion.includes('project') || lowerQuestion.includes('baustelle')) {
        const { data: projects } = await client
          .from('projects')
          .select('data')
          .eq('user_id', currentUser.id)
          .limit(10);

        if (projects && projects.length > 0) {
          const projectData = projects.map(p => p.data as Record<string, unknown>);
          
          // Filter by search terms
          const filtered = projectData.filter(p => {
            const projectName = String(p.projectName || p.name || '').toLowerCase();
            const projectNumber = String(p.projectNumber || p.id || '').toLowerCase();
            const customer = String(p.customer || '').toLowerCase();
            
            // Check if any part of the question matches
            const searchTerms = lowerQuestion.split(' ').filter(term => term.length > 3);
            return searchTerms.some(term => 
              projectName.includes(term) || 
              projectNumber.includes(term) || 
              customer.includes(term)
            );
          });

          if (filtered.length > 0) {
            results.push('📁 **Gefundene Projekte:**');
            filtered.slice(0, 5).forEach(p => {
              results.push(`• ${p.projectName || p.name} (${p.projectNumber || p.id})`);
              results.push(`  Kunde: ${p.customer || 'N/A'}`);
              results.push(`  Status: ${p.status || 'N/A'}`);
              if (p.startDate) {
                results.push(`  Start: ${new Date(p.startDate as string).toLocaleDateString('de-DE')}`);
              }
              results.push('');
            });
          } else if (projects.length > 0) {
            // No specific match, show recent projects
            results.push('🔍 Keine spezifischen Projekte gefunden. Hier sind Ihre neuesten Projekte:');
            projectData.slice(0, 5).forEach(p => {
              results.push(`• ${p.projectName || p.name} (${p.projectNumber || p.id})`);
            });
          }
        }
      }

      // Search invoices
      if (lowerQuestion.includes('rechnung') || lowerQuestion.includes('invoice')) {
        const { data: invoices } = await client
          .from('invoices')
          .select('data')
          .eq('user_id', currentUser.id)
          .limit(10);

        if (invoices && invoices.length > 0) {
          const invoiceData = invoices.map(i => i.data as Record<string, unknown>);
          
          const filtered = invoiceData.filter(inv => {
            const invoiceNumber = String(inv.invoiceNumber || inv.number || '').toLowerCase();
            const customer = String(inv.customer || '').toLowerCase();
            const amount = String(inv.totalAmount || inv.amount || '');
            
            const searchTerms = lowerQuestion.split(' ').filter(term => term.length > 3);
            return searchTerms.some(term => 
              invoiceNumber.includes(term) || 
              customer.includes(term) || 
              amount.includes(term)
            );
          });

          if (filtered.length > 0) {
            results.push('💰 **Gefundene Rechnungen:**');
            filtered.slice(0, 5).forEach(inv => {
              results.push(`• Rechnung ${inv.invoiceNumber || inv.number}`);
              results.push(`  Kunde: ${inv.customer || 'N/A'}`);
              results.push(`  Betrag: ${inv.totalAmount || inv.amount || '0'}€`);
              results.push(`  Status: ${inv.status || 'N/A'}`);
              results.push('');
            });
          }
        }
      }

      // Search quotes
      if (lowerQuestion.includes('angebot') || lowerQuestion.includes('quote') || lowerQuestion.includes('offerte')) {
        const { data: quotes } = await client
          .from('quotes')
          .select('data')
          .eq('user_id', currentUser.id)
          .limit(10);

        if (quotes && quotes.length > 0) {
          const quoteData = quotes.map(q => q.data as Record<string, unknown>);
          
          const filtered = quoteData.filter(quote => {
            const quoteNumber = String(quote.quoteNumber || quote.number || '').toLowerCase();
            const customer = String(quote.customer || '').toLowerCase();
            
            const searchTerms = lowerQuestion.split(' ').filter(term => term.length > 3);
            return searchTerms.some(term => 
              quoteNumber.includes(term) || 
              customer.includes(term)
            );
          });

          if (filtered.length > 0) {
            results.push('📋 **Gefundene Angebote:**');
            filtered.slice(0, 5).forEach(q => {
              results.push(`• Angebot ${q.quoteNumber || q.number}`);
              results.push(`  Kunde: ${q.customer || 'N/A'}`);
              results.push(`  Betrag: ${q.totalAmount || q.amount || '0'}€`);
              results.push(`  Status: ${q.status || 'N/A'}`);
              results.push('');
            });
          }
        }
      }

      // Search customers
      if (lowerQuestion.includes('kunde') || lowerQuestion.includes('customer') || lowerQuestion.includes('auftraggeber')) {
        const { data: customers } = await client
          .from('customers')
          .select('data')
          .eq('user_id', currentUser.id)
          .limit(10);

        if (customers && customers.length > 0) {
          const customerData = customers.map(c => c.data as Record<string, unknown>);
          
          const filtered = customerData.filter(cust => {
            const customerName = String(cust.name || cust.customerName || '').toLowerCase();
            const customerNumber = String(cust.customerNumber || cust.number || '').toLowerCase();
            const contact = String(cust.contactPerson || '').toLowerCase();
            
            const searchTerms = lowerQuestion.split(' ').filter(term => term.length > 3);
            return searchTerms.some(term => 
              customerName.includes(term) || 
              customerNumber.includes(term) || 
              contact.includes(term)
            );
          });

          if (filtered.length > 0) {
            results.push('👥 **Gefundene Kunden:**');
            filtered.slice(0, 5).forEach(c => {
              results.push(`• ${c.name || c.customerName} (${c.customerNumber || c.number || 'N/A'})`);
              results.push(`  Kontakt: ${c.contactPerson || c.email || 'N/A'}`);
              if (c.phone) results.push(`  Tel: ${c.phone}`);
              results.push('');
            });
          }
        }
      }

      // Return results if found
      if (results.length > 0) {
        results.push('💡 **Tipp:** Klicken Sie auf den entsprechenden Bereich im Menü, um mehr Details zu sehen.');
        return results.join('\n');
      }

      // No results found
      if (isSearchQuery) {
        return '🔍 Keine Ergebnisse gefunden. Versuchen Sie:\n• Spezifischere Suchbegriffe verwenden\n• Projekt-/Rechnungs-/Kundennummer angeben\n• Im entsprechenden Menüpunkt direkt suchen';
      }

      return null;
    } catch (error) {
      console.error('Database search error:', error);
      return '⚠️ Fehler bei der Datenbanksuche. Bitte versuchen Sie es später erneut.';
    }
  }

  /**
   * Knowledge base for common questions
   * Expanded with subscription, cancellation, billing, and database search
   */
  private checkKnowledgeBase(question: string): string | null {
    const lowerQuestion = question.toLowerCase();

    const knowledgeBase: Record<string, { answer: string; keywords: string[] }> = {
      // Subscription & Billing
      'abo_upgrade': {
        answer: `🚀 **Abo upgraden:**
1. Klicken Sie oben rechts auf Ihr Profil
2. Wählen Sie "Team-Verwaltung" oder "Einstellungen"
3. Klicken Sie auf "Abo upgraden" Button
4. Sie werden zum Stripe Kundenportal weitergeleitet
5. Wählen Sie Ihren gewünschten Plan:
   • Professional: €29.99/Monat (bis zu 10 Benutzer)
   • Enterprise: €99.99/Monat (unbegrenzte Benutzer)
6. Schließen Sie die Zahlung ab

Ihr Abo wird sofort aktiviert und Sie erhalten eine Bestätigungs-Email.`,
        keywords: ['upgrade', 'upgraden', 'abo', 'abonnement', 'plan ändern', 'tarif wechseln', 'subscription']
      },
      'abo_cancel': {
        answer: `⛔ **Abo kündigen:**
1. Klicken Sie auf Ihr Profil-Icon oben rechts
2. Gehen Sie zu "Einstellungen" > "Abonnement"
3. Klicken Sie auf "Abo verwalten" oder "Zum Kundenportal"
4. Im Stripe Kundenportal finden Sie "Abo kündigen"
5. Bestätigen Sie die Kündigung

ℹ️ **Wichtig:**
• Ihr Abo bleibt bis zum Ende des bezahlten Zeitraums aktiv
• Nach Ablauf werden Sie automatisch zum kostenlosen Plan zurückgestuft
• Ihre Daten bleiben erhalten
• Sie können jederzeit wieder upgraden`,
        keywords: ['kündigen', 'kündigung', 'abo beenden', 'subscription cancel', 'abbrechen', 'stornieren', 'löschen abo', 'cancel']
      },
      'trial_period': {
        answer: `🎉 **Testphase / Trial:**
• Professional und Enterprise Pläne haben eine **14-tägige kostenlose Testphase**
• Keine Kreditkarte während der Testphase erforderlich
• Voller Zugriff auf alle Features des gewählten Plans
• Nach 14 Tagen beginnt die Abrechnung automatisch
• Sie können jederzeit während oder nach der Testphase kündigen

📅 **Verbleibende Testzeit sehen:**
1. Im Dashboard sehen Sie ein Banner mit den verbleibenden Tagen
2. Oder gehen Sie zu "Einstellungen" > "Abonnement"`,
        keywords: ['trial', 'testphase', 'kostenlos testen', 'probe', 'gratis', 'test', 'probephase']
      },
      'payment_failed': {
        answer: `⚠️ **Zahlung fehlgeschlagen:**

Wenn eine Zahlung fehlschlägt:
1. Sie erhalten eine Email-Benachrichtigung
2. Gehen Sie zu "Einstellungen" > "Abonnement"
3. Klicken Sie auf "Zahlungsmethode aktualisieren"
4. Geben Sie neue Zahlungsinformationen ein
5. Die Zahlung wird automatisch erneut versucht

🔍 **Häufige Gründe:**
• Abgelaufene Kreditkarte
• Unzureichendes Guthaben
• Falsche Karteninformationen
• Bank hat Transaktion abgelehnt

Bei weiteren Problemen: support@bauplan-buddy.de`,
        keywords: ['zahlung fehlgeschlagen', 'payment failed', 'karte abgelehnt', 'bezahlung nicht möglich', 'rechnung nicht bezahlt', 'failed payment']
      },
      'invoice_download': {
        answer: `💾 **Rechnungen herunterladen:**
1. Gehen Sie zu "Einstellungen" > "Abonnement"
2. Klicken Sie auf "Rechnungen anzeigen" oder "Zum Kundenportal"
3. Im Stripe Kundenportal sehen Sie alle Ihre Rechnungen
4. Klicken Sie auf eine Rechnung
5. Klicken Sie auf "PDF herunterladen"

📧 Sie erhalten Rechnungen auch automatisch per Email nach jeder erfolgreichen Zahlung.`,
        keywords: ['rechnung', 'invoice', 'quittung', 'beleg', 'download', 'herunterladen', 'pdf', 'billing']
      },

      // Quotes & Estimates
      'create_quote': {
        answer: `📋 **Angebot erstellen:**
1. Gehen Sie zu "Angebote" im Hauptmenü
2. Klicken Sie auf "Neues Angebot" (+ Button)
3. Füllen Sie die Kundendaten aus:
   • Kundenname
   • Adresse
   • Email
4. Fügen Sie Positionen hinzu:
   • Beschreibung
   • Menge
   • Einzelpreis
   • MwSt.
5. Optional: Rabatte oder Zwischensummen hinzufügen
6. Klicken Sie auf "Speichern"
7. Exportieren Sie als PDF mit dem "PDF"-Button`,
        keywords: ['angebot erstellen', 'neues angebot', 'quote', 'kostenvoranschlag', 'offerte', 'create quote']
      },
      'quote_template': {
        answer: `📋 **Vorlagen für Angebote nutzen:**
1. Erstellen Sie ein Muster-Angebot mit Standard-Positionen
2. Speichern Sie es als Vorlage
3. Bei neuen Angeboten: "Aus Vorlage erstellen" wählen
4. Passen Sie nur kundenspezifische Details an

🚀 So sparen Sie Zeit bei wiederkehrenden Angeboten!`,
        keywords: ['vorlage', 'template', 'muster', 'standard angebot', 'quote template']
      },
      'quote_to_invoice': {
        answer: `🔄 **Angebot in Rechnung umwandeln:**
1. Öffnen Sie das akzeptierte Angebot
2. Klicken Sie auf "In Rechnung umwandeln" Button
3. Die Rechnung wird mit allen Positionen vorausgefüllt
4. Passen Sie bei Bedarf Zahlungsbedingungen an
5. Speichern und versenden Sie die Rechnung

✅ Alle Positionen und Preise werden automatisch übernommen!`,
        keywords: ['angebot zu rechnung', 'umwandeln', 'quote to invoice', 'rechnung aus angebot', 'convert']
      },

      // Team Management
      'invite_members': {
        answer: `👥 **Mitarbeiter einladen:**
1. Gehen Sie zu "Team-Verwaltung" im Menü
2. Klicken Sie auf "Mitarbeiter einladen" (+ Button)
3. Geben Sie Email-Adresse ein
4. Geben Sie den Namen ein
5. Wählen Sie die Rolle:
   👑 **Admin:** Voller Zugriff inkl. Abonnement-Verwaltung
   📊 **Manager:** Kann Projekte & Angebote verwalten
   👤 **User:** Kann eigene Projekte bearbeiten
6. Klicken Sie auf "Einladung senden"

Der Mitarbeiter erhält eine Email mit einem Einladungslink zur Registrierung.`,
        keywords: ['mitarbeiter einladen', 'team einladen', 'user hinzufügen', 'invite', 'kollegen', 'team member']
      },
      'user_roles': {
        answer: `🎭 **Benutzer-Rollen:**

👑 **Admin:**
• Voller Zugriff auf alle Features
• Kann Abonnement verwalten und kündigen
• Kann Mitarbeiter einladen und entfernen
• Kann Firmendaten ändern

📊 **Manager:**
• Kann Projekte, Angebote und Rechnungen erstellen/bearbeiten
• Kann Team-Mitglieder sehen
• Kein Zugriff auf Abonnement oder kritische Einstellungen

👤 **User:**
• Kann eigene Projekte und Aufgaben bearbeiten
• Kann Angebote ansehen
• Eingeschränkter Zugriff

⚙️ Rollen können jederzeit in "Team-Verwaltung" geändert werden.`,
        keywords: ['rollen', 'berechtigungen', 'admin', 'manager', 'user', 'permissions', 'rechte', 'roles']
      },
      'remove_member': {
        answer: `❌ **Mitarbeiter entfernen:**
1. Gehen Sie zu "Team-Verwaltung"
2. Finden Sie den Mitarbeiter in der Liste
3. Klicken Sie auf das "⋮" Menü rechts
4. Wählen Sie "Entfernen"
5. Bestätigen Sie die Aktion

⚠️ Der Mitarbeiter verliert sofort den Zugriff auf Ihren Workspace.
🔒 Hinweis: Nur Admins können Mitarbeiter entfernen.`,
        keywords: ['mitarbeiter entfernen', 'löschen', 'remove member', 'user löschen', 'rauswerfen', 'delete user']
      },
      'user_limit': {
        answer: `📈 **Benutzer-Limits pro Plan:**

🆓 **Free Plan:** Bis zu 3 Benutzer
💼 **Professional (€29.99/Monat):** Bis zu 10 Benutzer
🏢 **Enterprise (€99.99/Monat):** Unbegrenzte Benutzer

🚀 **Wenn Sie das Limit erreichen:**
• Sie sehen eine Warnung in "Team-Verwaltung"
• Klicken Sie auf "Abo upgraden" um mehr Benutzer hinzuzufügen
• Das Upgrade ist sofort aktiv`,
        keywords: ['benutzer limit', 'user limit', 'maximale benutzer', 'wie viele mitarbeiter', 'limit', 'max users']
      },

      // Settings & Configuration
      'change_password': {
        answer: `🔐 **Passwort ändern:**
1. Klicken Sie auf Ihr Profil-Icon oben rechts
2. Wählen Sie "Einstellungen" aus dem Dropdown
3. Gehen Sie zum Tab "Sicherheit"
4. Klicken Sie auf "Passwort ändern"
5. Geben Sie Ihr aktuelles Passwort ein
6. Geben Sie das neue Passwort ein (min. 8 Zeichen)
7. Bestätigen Sie das neue Passwort
8. Klicken Sie auf "Speichern"

ℹ️ Sie werden ausgeloggt und müssen sich mit dem neuen Passwort anmelden.`,
        keywords: ['passwort ändern', 'password change', 'kennwort', 'passwort vergessen', 'change password']
      },
      'company_branding': {
        answer: `🎨 **Firmen-Branding anpassen:**
1. Gehen Sie zu "Einstellungen" > "Firma"
2. Laden Sie Ihr Logo hoch (empfohlen: 300x100px, PNG)
3. Wählen Sie Ihre Firmenfarbe
4. Geben Sie Firmendaten ein:
   • Firmenname
   • Adresse
   • Steuernummer
   • Kontaktdaten
5. Klicken Sie auf "Speichern"

✨ **Ihr Branding erscheint auf:**
• Angeboten und Rechnungen (PDF)
• Email-Signaturen
• Login-Seite (Enterprise)`,
        keywords: ['branding', 'logo', 'firmenlogo', 'corporate design', 'farbe ändern', 'firma', 'company branding']
      },
      'supabase_connection': {
        answer: `📡 **Supabase Datenspeicherung:**
Bauplan Buddy nutzt Supabase für sichere Datenspeicherung.

🌟 **Standard-Setup (empfohlen):**
• Wir hosten Ihre Daten sicher in der EU
• DSGVO-konform
• Automatische Backups
• Keine zusätzliche Konfiguration nötig

🛠️ **Eigene Supabase-Instanz verbinden (Enterprise):**
1. Erstellen Sie ein Supabase-Projekt
2. Gehen Sie zu "Einstellungen" > "Erweitert" > "Datenbank"
3. Geben Sie Ihre Supabase URL und API-Key ein
4. Klicken Sie auf "Verbinden testen"
5. Speichern Sie die Einstellungen

Bei Fragen: support@bauplan-buddy.de`,
        keywords: ['supabase', 'datenbank', 'datenspeicherung', 'backend', 'verbinden', 'database']
      },

      // Projects
      'create_project': {
        answer: `📁 **Projekt erstellen:**
1. Gehen Sie zu "Projekte" im Hauptmenü
2. Klicken Sie auf "Neues Projekt" (+ Button)
3. Geben Sie Projektdetails ein:
   • Projektname
   • Kunde/Auftraggeber
   • Startdatum
   • Geplantes Enddatum
   • Budget (optional)
4. Fügen Sie Team-Mitglieder hinzu
5. Klicken Sie auf "Erstellen"

🚀 Sie können dann Aufgaben, Dokumente und Zeiterfassung hinzufügen.`,
        keywords: ['projekt erstellen', 'neues projekt', 'project', 'baustelle', 'create project']
      },
      'time_tracking': {
        answer: `⏱️ **Zeiterfassung:**

**Live erfassen:**
1. Öffnen Sie ein Projekt
2. Gehen Sie zum Tab "Zeiterfassung"
3. Klicken Sie auf "Zeit starten"
4. Beschreiben Sie die Tätigkeit
5. Wenn fertig: "Zeit stoppen"

**Manuell erfassen:**
1. Klicken Sie auf "Manuell hinzufügen"
2. Geben Sie Datum, Start- und Endzeit ein
3. Beschreibung hinzufügen
4. Speichern

💰 Alle Zeiten können später in Rechnungen übernommen werden.`,
        keywords: ['zeiterfassung', 'time tracking', 'stunden erfassen', 'arbeitszeit', 'track time']
      },

      // Data Export
      'export_data': {
        answer: `📥 **Daten exportieren:**

**Angebote/Rechnungen als PDF:**
1. Öffnen Sie das Dokument
2. Klicken Sie auf "PDF exportieren"
3. Download startet automatisch

**Daten als CSV/Excel:**
1. Gehen Sie zum gewünschten Bereich (Projekte/Angebote/etc.)
2. Klicken Sie auf "Exportieren" (⋮ Menü)
3. Wählen Sie Format:
   • CSV: Für Excel, Google Sheets
   • JSON: Für technische Integration
4. Download startet automatisch

📦 **Vollständiger Daten-Export (Enterprise):**
Kontaktieren Sie support@bauplan-buddy.de`,
        keywords: ['exportieren', 'export', 'download', 'daten sichern', 'csv', 'pdf', 'excel', 'backup']
      },

      // Support & Help
      'contact_support': {
        answer: `📞 **Support kontaktieren:**

📧 **Email:** support@bauplan-buddy.de
💬 **Live-Chat:** Klicken Sie auf das Chat-Icon unten rechts
📚 **Dokumentation:** Menü > "Hilfe" > "Dokumentation"
🎥 **Video-Tutorials:** Menü > "Hilfe" > "Tutorials"

**Bei dringenden Problemen (Enterprise):**
📞 Telefon: +49 XXX XXXXXXX (Mo-Fr 9-18 Uhr)

⏰ **Antwortzeiten:**
• Free: 48-72 Stunden
• Professional: 24 Stunden
• Enterprise: 4 Stunden (Prioritäts-Support)`,
        keywords: ['support', 'hilfe', 'kontakt', 'help', 'problem', 'frage', 'contact']
      },
    };

    // Fuzzy matching with keyword scoring
    let bestMatch: { answer: string; score: number } | null = null;

    for (const entry of Object.values(knowledgeBase)) {
      let score = 0;
      
      // Check each keyword
      for (const keyword of entry.keywords) {
        if (lowerQuestion.includes(keyword)) {
          // Longer matching keywords get higher score
          score += keyword.length * 2;
          
          // Exact word match gets bonus points
          const words = lowerQuestion.split(/\s+/);
          if (words.includes(keyword)) {
            score += 10;
          }
        }
      }

      // Update best match if this score is higher
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { answer: entry.answer, score };
      }
    }

    // Return best match if score is high enough (threshold: 8)
    return bestMatch && bestMatch.score >= 8 ? bestMatch.answer : null;
  }

  /**
   * Analyze error logs automatically
   */
  public async analyzeError(error: {
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
  }): Promise<{
    possibleCause: string;
    suggestedFix: string;
    workaround?: string;
  }> {
    const result = await this.analyzeTicket({
      subject: 'Fehler aufgetreten',
      description: error.message,
      errorLogs: error.stack ? [error.stack] : [],
      userInfo: error.context,
    });

    return {
      possibleCause: this.extractCause(result.suggestedResponse),
      suggestedFix: result.suggestedResponse,
      workaround: result.suggestedActions.join('\n'),
    };
  }

  private extractCause(response: string): string {
    // Simple extraction logic
    const causeMatch = response.match(/ursache|grund|problem:(.*?)(\n|$)/i);
    return causeMatch ? causeMatch[1].trim() : 'Ursache wird analysiert...';
  }
}

export default AISupportService;
export const aiSupport = AISupportService.getInstance();
