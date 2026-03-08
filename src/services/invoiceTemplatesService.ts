/* InvoiceTemplatesService: manage predefined invoice templates
   Provides a simple in-memory catalog with a singleton accessor.
*/

export interface InvoiceTemplatePosition {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'construction' | 'maintenance' | 'consultation' | 'materials';
  positions: InvoiceTemplatePosition[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms?: number; // payment due days
  isActive: boolean;
  createdAt: string;
  usageCount: number;
}

export class InvoiceTemplatesService {
  private static instance: InvoiceTemplatesService;

  private templates: InvoiceTemplate[] = [
    {
      id: 'tpl-construction-001',
      name: 'Neubau Einfamilienhaus - Grundpaket',
      description: 'Standardvorlage für Neubau-Projekte',
      category: 'construction',
      positions: [
        { description: 'Planung und Projektmanagement', quantity: 1, unit: 'Pauschal', unitPrice: 5000.0 },
        { description: 'Rohbauarbeiten', quantity: 120, unit: 'm²', unitPrice: 85.0 },
      ],
      subtotal: 15200.0,
      taxAmount: 2888.0,
      totalAmount: 18088.0,
      paymentTerms: 30,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      usageCount: 15,
    },
    {
      id: 'tpl-maintenance-001',
      name: 'Wartung Heizungsanlage',
      description: 'Regelmäßige Wartung von Heizungsanlagen',
      category: 'maintenance',
      positions: [
        { description: 'Inspektion Heizungsanlage', quantity: 1, unit: 'Std', unitPrice: 95.0 },
        { description: 'Reinigung Brenner', quantity: 1, unit: 'Pauschal', unitPrice: 150.0 },
      ],
      subtotal: 245.0,
      taxAmount: 46.55,
      totalAmount: 291.55,
      paymentTerms: 14,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      usageCount: 28,
    },
  ];

  public static getInstance(): InvoiceTemplatesService {
    if (!InvoiceTemplatesService.instance) {
      InvoiceTemplatesService.instance = new InvoiceTemplatesService();
    }
    return InvoiceTemplatesService.instance;
  }

  public listTemplates(): InvoiceTemplate[] {
    return this.templates.filter((t) => t.isActive);
  }

  public getTemplateById(id: string): InvoiceTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }
}
