/**
 * Procurement Template Service
 * Manages templates for purchase orders, invoices, and delivery notes
 * with signature fields, payment terms, and custom text blocks
 */

export interface TemplateSignature {
  id: string;
  position: 'left' | 'right' | 'center';
  label: string; // e.g., "Unterschrift Auftraggeber", "Unterschrift Lieferant"
  required: boolean;
  placeholder?: string;
}

export interface TemplateTextBlock {
  id: string;
  type: 'header' | 'footer' | 'terms' | 'custom';
  position: 'before' | 'after'; // before/after main content
  content: string;
  editable: boolean;
}

export interface PaymentTermsTemplate {
  id: string;
  name: string;
  dueDays: number;
  discount?: {
    percentage: number;
    daysEarly: number;
  };
  text: string; // e.g., "Zahlbar innerhalb von 30 Tagen ohne Abzug"
}

export interface ProcurementDocumentTemplate {
  id: string;
  name: string;
  type: 'purchase_order' | 'invoice' | 'delivery_note';
  description?: string;
  
  // Text blocks that appear on the document
  textBlocks: TemplateTextBlock[];
  
  // Signature fields
  signatures: TemplateSignature[];
  
  // Payment terms
  paymentTerms?: PaymentTermsTemplate;
  
  // Custom fields
  customFields?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  
  isDefault: boolean;
  createdAt: string;
  lastUsed?: string;
}

class ProcurementTemplateService {
  private static instance: ProcurementTemplateService;
  private readonly STORAGE_KEY = 'bauplan_procurement_templates';
  
  private defaultTemplates: ProcurementDocumentTemplate[] = [
    {
      id: 'tpl-po-standard',
      name: 'Standard-Bestellung',
      type: 'purchase_order',
      description: 'Standardvorlage für Bestellungen mit allen gesetzlich erforderlichen Angaben',
      textBlocks: [
        {
          id: 'tb-po-header',
          type: 'header',
          position: 'before',
          content: 'Hiermit bestellen wir verbindlich die nachfolgend aufgeführten Artikel zu den vereinbarten Konditionen.',
          editable: true,
        },
        {
          id: 'tb-po-terms',
          type: 'terms',
          position: 'after',
          content: `Allgemeine Geschäftsbedingungen:
1. Die Lieferung erfolgt frei Baustelle
2. Teillieferungen nur nach vorheriger Absprache
3. Lieferverzug berechtigt zu Schadenersatz
4. Gewährleistung gemäß gesetzlichen Bestimmungen`,
          editable: true,
        },
        {
          id: 'tb-po-footer',
          type: 'footer',
          position: 'after',
          content: 'Bitte bestätigen Sie den Eingang dieser Bestellung und das voraussichtliche Lieferdatum.',
          editable: true,
        },
      ],
      signatures: [
        {
          id: 'sig-po-buyer',
          position: 'left',
          label: 'Unterschrift Einkauf',
          required: true,
        },
        {
          id: 'sig-po-manager',
          position: 'right',
          label: 'Genehmigung Projektleitung',
          required: false,
        },
      ],
      paymentTerms: {
        id: 'pt-30-net',
        name: '30 Tage netto',
        dueDays: 30,
        text: 'Zahlbar innerhalb von 30 Tagen ohne Abzug',
      },
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tpl-po-express',
      name: 'Express-Bestellung',
      type: 'purchase_order',
      description: 'Vorlage für dringende Bestellungen mit verkürzten Lieferzeiten',
      textBlocks: [
        {
          id: 'tb-poe-header',
          type: 'header',
          position: 'before',
          content: '⚠️ EILBESTELLUNG - Bitte umgehend bearbeiten!\n\nWir benötigen die nachfolgenden Artikel dringend zum angegebenen Datum.',
          editable: true,
        },
        {
          id: 'tb-poe-terms',
          type: 'terms',
          position: 'after',
          content: `Express-Konditionen:
1. Lieferung bis spätestens zum vereinbarten Termin
2. Bei Lieferverzug: Konventionalstrafe 5% des Auftragswertes
3. Sofortige telefonische Bestätigung erbeten
4. Express-Zuschlag wird akzeptiert`,
          editable: true,
        },
      ],
      signatures: [
        {
          id: 'sig-poe-buyer',
          position: 'left',
          label: 'Unterschrift Einkauf',
          required: true,
        },
      ],
      paymentTerms: {
        id: 'pt-14-net',
        name: '14 Tage netto',
        dueDays: 14,
        text: 'Zahlbar innerhalb von 14 Tagen ohne Abzug bei fristgerechter Lieferung',
      },
      isDefault: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tpl-inv-standard',
      name: 'Standard-Rechnung',
      type: 'invoice',
      description: 'Standardvorlage für Ausgangsrechnungen',
      textBlocks: [
        {
          id: 'tb-inv-header',
          type: 'header',
          position: 'before',
          content: 'Vielen Dank für Ihren Auftrag. Wir erlauben uns, wie folgt abzurechnen:',
          editable: true,
        },
        {
          id: 'tb-inv-footer',
          type: 'footer',
          position: 'after',
          content: `Wir danken für Ihren Auftrag und die gute Zusammenarbeit.

Bankverbindung:
IBAN: DE89 3704 0044 0532 0130 00
BIC: COBADEFFXXX
Verwendungszweck: Rechnungsnummer`,
          editable: true,
        },
      ],
      signatures: [
        {
          id: 'sig-inv-manager',
          position: 'left',
          label: 'Freigabe Geschäftsführung',
          required: false,
        },
      ],
      paymentTerms: {
        id: 'pt-30-2-discount',
        name: '30 Tage / 2% Skonto',
        dueDays: 30,
        discount: {
          percentage: 2,
          daysEarly: 14,
        },
        text: 'Zahlbar innerhalb von 30 Tagen. Bei Zahlung innerhalb von 14 Tagen 2% Skonto.',
      },
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tpl-dn-standard',
      name: 'Standard-Lieferschein',
      type: 'delivery_note',
      description: 'Standardvorlage für Lieferscheine',
      textBlocks: [
        {
          id: 'tb-dn-header',
          type: 'header',
          position: 'before',
          content: 'Lieferung gemäß Bestellung. Bitte prüfen Sie die Ware umgehend auf Vollständigkeit und Mängel.',
          editable: true,
        },
        {
          id: 'tb-dn-footer',
          type: 'footer',
          position: 'after',
          content: `Hinweise:
- Mängelrügen innerhalb von 7 Tagen
- Bei Annahme der Ware gelten diese als mangelfrei akzeptiert
- Rechnung folgt separat per Post`,
          editable: true,
        },
      ],
      signatures: [
        {
          id: 'sig-dn-driver',
          position: 'left',
          label: 'Unterschrift Fahrer',
          required: true,
        },
        {
          id: 'sig-dn-receiver',
          position: 'right',
          label: 'Unterschrift Warenempfänger',
          required: true,
          placeholder: 'Ware vollständig und unbeschädigt erhalten',
        },
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
  ];

  private templates: ProcurementDocumentTemplate[] = [];

  private constructor() {
    this.loadTemplates();
  }

  public static getInstance(): ProcurementTemplateService {
    if (!ProcurementTemplateService.instance) {
      ProcurementTemplateService.instance = new ProcurementTemplateService();
    }
    return ProcurementTemplateService.instance;
  }

  private loadTemplates(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.templates = JSON.parse(stored);
      } else {
        // First time: use defaults
        this.templates = [...this.defaultTemplates];
        this.saveTemplates();
      }
    } catch (error) {
      console.error('Failed to load procurement templates:', error);
      this.templates = [...this.defaultTemplates];
    }
  }

  private saveTemplates(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.templates));
    } catch (error) {
      console.error('Failed to save procurement templates:', error);
    }
  }

  /**
   * Get all templates of a specific type
   */
  public getTemplates(type?: ProcurementDocumentTemplate['type']): ProcurementDocumentTemplate[] {
    if (type) {
      return this.templates.filter(t => t.type === type);
    }
    return [...this.templates];
  }

  /**
   * Get template by ID
   */
  public getTemplate(id: string): ProcurementDocumentTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * Get default template for a document type
   */
  public getDefaultTemplate(type: ProcurementDocumentTemplate['type']): ProcurementDocumentTemplate | undefined {
    return this.templates.find(t => t.type === type && t.isDefault);
  }

  /**
   * Create a new template
   */
  public createTemplate(template: Omit<ProcurementDocumentTemplate, 'id' | 'createdAt'>): ProcurementDocumentTemplate {
    const newTemplate: ProcurementDocumentTemplate = {
      ...template,
      id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    this.templates.push(newTemplate);
    this.saveTemplates();
    return newTemplate;
  }

  /**
   * Update an existing template
   */
  public updateTemplate(id: string, updates: Partial<ProcurementDocumentTemplate>): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      id, // Prevent ID change
      createdAt: this.templates[index].createdAt, // Preserve creation date
    };
    
    this.saveTemplates();
    return true;
  }

  /**
   * Delete a template
   */
  public deleteTemplate(id: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(t => t.id !== id);
    
    if (this.templates.length < initialLength) {
      this.saveTemplates();
      return true;
    }
    return false;
  }

  /**
   * Record template usage
   */
  public recordUsage(id: string): void {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.lastUsed = new Date().toISOString();
      this.saveTemplates();
    }
  }

  /**
   * Get all available payment terms
   */
  public getPaymentTermsOptions(): PaymentTermsTemplate[] {
    return [
      {
        id: 'pt-7-net',
        name: '7 Tage netto',
        dueDays: 7,
        text: 'Zahlbar innerhalb von 7 Tagen ohne Abzug',
      },
      {
        id: 'pt-14-net',
        name: '14 Tage netto',
        dueDays: 14,
        text: 'Zahlbar innerhalb von 14 Tagen ohne Abzug',
      },
      {
        id: 'pt-30-net',
        name: '30 Tage netto',
        dueDays: 30,
        text: 'Zahlbar innerhalb von 30 Tagen ohne Abzug',
      },
      {
        id: 'pt-30-2-discount',
        name: '30 Tage / 2% Skonto',
        dueDays: 30,
        discount: { percentage: 2, daysEarly: 14 },
        text: 'Zahlbar innerhalb von 30 Tagen. Bei Zahlung innerhalb von 14 Tagen 2% Skonto.',
      },
      {
        id: 'pt-30-3-discount',
        name: '30 Tage / 3% Skonto',
        dueDays: 30,
        discount: { percentage: 3, daysEarly: 10 },
        text: 'Zahlbar innerhalb von 30 Tagen. Bei Zahlung innerhalb von 10 Tagen 3% Skonto.',
      },
      {
        id: 'pt-immediate',
        name: 'Sofort fällig',
        dueDays: 0,
        text: 'Zahlbar sofort ohne Abzug',
      },
    ];
  }

  /**
   * Reset to default templates
   */
  public resetToDefaults(): void {
    this.templates = [...this.defaultTemplates];
    this.saveTemplates();
  }
}

export default ProcurementTemplateService;
export const procurementTemplates = ProcurementTemplateService.getInstance();
