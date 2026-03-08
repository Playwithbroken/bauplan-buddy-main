/**
 * Quote Templates Service
 * 
 * Manages predefined quote templates with positions and pricing
 */

import { QuotePosition } from '../components/forms/EnhancedQuoteCreation';

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  estimatedTotal: number;
  estimatedDuration: number; // in days
  positions: Omit<QuotePosition, 'id' | 'position'>[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  usageCount: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export class QuoteTemplatesService {
  private static instance: QuoteTemplatesService;
  
  // Predefined template categories
  private readonly categories: TemplateCategory[] = [
    {
      id: 'residential',
      name: 'Wohnbau',
      description: 'Vorlagen für Wohnbauprojekte',
      icon: 'Home',
      color: 'blue'
    },
    {
      id: 'commercial',
      name: 'Gewerbebau',
      description: 'Vorlagen für Gewerbeobjekte',
      icon: 'Building',
      color: 'green'
    },
    {
      id: 'renovation',
      name: 'Sanierung',
      description: 'Vorlagen für Sanierungsprojekte',
      icon: 'Wrench',
      color: 'orange'
    },
    {
      id: 'infrastructure',
      name: 'Infrastruktur',
      description: 'Vorlagen für Infrastrukturprojekte',
      icon: 'Construction',
      color: 'purple'
    }
  ];

  // Predefined templates
  private templates: QuoteTemplate[] = [
    {
      id: 'einfamilienhaus',
      name: 'Einfamilienhaus Standard',
      description: 'Komplettbau eines Einfamilienhauses mit Rohbau, Dach und Innenausbau',
      category: 'residential',
      icon: 'Home',
      estimatedTotal: 420000,
      estimatedDuration: 180,
      positions: [
        {
          description: 'Erdarbeiten und Fundament',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 45000,
          total: 45000,
          category: 'construction',
          notes: 'Inkl. Aushub, Fundament und Bodenplatte'
        },
        {
          description: 'Rohbau Mauerwerk',
          quantity: 180,
          unit: 'm2',
          unitPrice: 450,
          total: 81000,
          category: 'construction',
          notes: 'Ziegel-Mauerwerk mit Wärmedämmung'
        },
        {
          description: 'Dachstuhl und Eindeckung',
          quantity: 120,
          unit: 'm2',
          unitPrice: 850,
          total: 102000,
          category: 'roofing',
          notes: 'Holz-Dachstuhl mit Ziegeln'
        },
        {
          description: 'Fenster und Türen',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 35000,
          total: 35000,
          category: 'exterior',
          notes: '3-fach Verglasung, Kunststoff'
        },
        {
          description: 'Elektroinstallation',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 25000,
          total: 25000,
          category: 'electrical',
          notes: 'Komplett-Installation mit Smart Home'
        },
        {
          description: 'Sanitärinstallation',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 28000,
          total: 28000,
          category: 'plumbing',
          notes: '2 Bäder + Gäste-WC'
        },
        {
          description: 'Heizungsanlage',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 22000,
          total: 22000,
          category: 'heating',
          notes: 'Wärmepumpe mit Fußbodenheizung'
        },
        {
          description: 'Innenausbau',
          quantity: 160,
          unit: 'm2',
          unitPrice: 520,
          total: 83200,
          category: 'interior',
          notes: 'Trockenbau, Böden, Malerarbeiten'
        }
      ],
      tags: ['einfamilienhaus', 'neubau', 'standard'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-02-15T10:30:00Z',
      isActive: true,
      usageCount: 15
    },
    {
      id: 'dachsanierung',
      name: 'Dachsanierung Komplett',
      description: 'Komplette Dachsanierung mit Dämmung und neuer Eindeckung',
      category: 'renovation',
      icon: 'Wrench',
      estimatedTotal: 85000,
      estimatedDuration: 45,
      positions: [
        {
          description: 'Demontage alte Dacheindeckung',
          quantity: 200,
          unit: 'm2',
          unitPrice: 25,
          total: 5000,
          category: 'roofing',
          notes: 'Inklusive Entsorgung'
        },
        {
          description: 'Dachstuhl-Sanierung',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 12000,
          total: 12000,
          category: 'roofing',
          notes: 'Reparatur und Verstärkung'
        },
        {
          description: 'Unterspannbahn und Lattung',
          quantity: 200,
          unit: 'm2',
          unitPrice: 45,
          total: 9000,
          category: 'roofing'
        },
        {
          description: 'Dachdämmung',
          quantity: 200,
          unit: 'm2',
          unitPrice: 95,
          total: 19000,
          category: 'insulation',
          notes: '20cm Mineralwolle'
        },
        {
          description: 'Neue Dacheindeckung',
          quantity: 200,
          unit: 'm2',
          unitPrice: 120,
          total: 24000,
          category: 'roofing',
          notes: 'Tondachziegel Frankfurter Pfanne'
        },
        {
          description: 'Dachrinnen und Fallrohre',
          quantity: 45,
          unit: 'm',
          unitPrice: 85,
          total: 3825,
          category: 'roofing',
          notes: 'Zink, komplett erneuert'
        },
        {
          description: 'Dachfenster',
          quantity: 4,
          unit: 'stk',
          unitPrice: 1200,
          total: 4800,
          category: 'roofing',
          notes: 'Velux GGL 78x118'
        },
        {
          description: 'Gerüst und Absicherung',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 7500,
          total: 7500,
          category: 'other',
          notes: '6 Wochen Standzeit'
        }
      ],
      tags: ['dach', 'sanierung', 'dämmung'],
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-02-10T14:20:00Z',
      isActive: true,
      usageCount: 8
    },
    {
      id: 'buerogebaeude',
      name: 'Bürogebäude 3-stöckig',
      description: 'Neubau eines 3-stöckigen Bürogebäudes mit moderner Ausstattung',
      category: 'commercial',
      icon: 'Building',
      estimatedTotal: 1850000,
      estimatedDuration: 365,
      positions: [
        {
          description: 'Erdarbeiten und Tiefbau',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 120000,
          total: 120000,
          category: 'construction',
          notes: 'Inkl. Tiefgarage für 20 Stellplätze'
        },
        {
          description: 'Stahlbetonkonstruktion',
          quantity: 850,
          unit: 'm3',
          unitPrice: 480,
          total: 408000,
          category: 'construction',
          notes: 'Fertigteil-Konstruktion'
        },
        {
          description: 'Fassade Aluminium-Glas',
          quantity: 1200,
          unit: 'm2',
          unitPrice: 520,
          total: 624000,
          category: 'exterior',
          notes: 'Energieeffiziente Vorhangfassade'
        },
        {
          description: 'Innenausbau Büroflächen',
          quantity: 2400,
          unit: 'm2',
          unitPrice: 380,
          total: 912000,
          category: 'interior',
          notes: 'Flexible Raumaufteilung'
        },
        {
          description: 'Aufzugsanlage',
          quantity: 2,
          unit: 'stk',
          unitPrice: 65000,
          total: 130000,
          category: 'other',
          notes: 'Personenaufzüge 8 Personen'
        },
        {
          description: 'Gebäudetechnik komplett',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 185000,
          total: 185000,
          category: 'electrical',
          notes: 'Klima, Lüftung, IT-Verkabelung'
        }
      ],
      tags: ['büro', 'gewerbe', 'neubau', 'mehrstöckig'],
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-02-20T09:15:00Z',
      isActive: true,
      usageCount: 3
    },
    {
      id: 'badsanierung',
      name: 'Badezimmer Komplettsanierung',
      description: 'Komplette Sanierung eines Badezimmers mit hochwertiger Ausstattung',
      category: 'renovation',
      icon: 'Wrench',
      estimatedTotal: 28500,
      estimatedDuration: 21,
      positions: [
        {
          description: 'Demontage und Entsorgung',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 2800,
          total: 2800,
          category: 'other',
          notes: 'Komplette Entkernung'
        },
        {
          description: 'Elektroarbeiten',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 3200,
          total: 3200,
          category: 'electrical',
          notes: 'Neue Leitungen und Beleuchtung'
        },
        {
          description: 'Sanitärinstallation',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 4500,
          total: 4500,
          category: 'plumbing',
          notes: 'Neue Leitungen und Anschlüsse'
        },
        {
          description: 'Fliesen Wand und Boden',
          quantity: 45,
          unit: 'm2',
          unitPrice: 185,
          total: 8325,
          category: 'flooring',
          notes: 'Hochwertige Keramikfliesen'
        },
        {
          description: 'Sanitärobjekte',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 6500,
          total: 6500,
          category: 'plumbing',
          notes: 'WC, Waschbecken, Dusche, Badewanne'
        },
        {
          description: 'Malerarbeiten',
          quantity: 25,
          unit: 'm2',
          unitPrice: 45,
          total: 1125,
          category: 'painting',
          notes: 'Spezialfarbe für Feuchträume'
        },
        {
          description: 'Spiegelschrank und Zubehör',
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 2050,
          total: 2050,
          category: 'interior',
          notes: 'LED-Beleuchtung integriert'
        }
      ],
      tags: ['bad', 'sanierung', 'komplett'],
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-02-05T16:45:00Z',
      isActive: true,
      usageCount: 12
    }
  ];

  public static getInstance(): QuoteTemplatesService {
    if (!QuoteTemplatesService.instance) {
      QuoteTemplatesService.instance = new QuoteTemplatesService();
    }
    return QuoteTemplatesService.instance;
  }

  /**
   * Get all template categories
   */
  public getCategories(): TemplateCategory[] {
    return this.categories;
  }

  /**
   * Get category by ID
   */
  public getCategory(categoryId: string): TemplateCategory | null {
    return this.categories.find(cat => cat.id === categoryId) || null;
  }

  /**
   * Get all templates
   */
  public getAllTemplates(): QuoteTemplate[] {
    return this.templates.filter(template => template.isActive)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(categoryId: string): QuoteTemplate[] {
    return this.templates.filter(template => 
      template.category === categoryId && template.isActive
    ).sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Get template by ID
   */
  public getTemplate(templateId: string): QuoteTemplate | null {
    return this.templates.find(template => template.id === templateId) || null;
  }

  /**
   * Search templates
   */
  public searchTemplates(query: string): QuoteTemplate[] {
    const searchTerm = query.toLowerCase();
    return this.templates.filter(template => 
      template.isActive && (
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    );
  }

  /**
   * Use template (increment usage count)
   */
  public useTemplate(templateId: string): QuoteTemplate | null {
    const template = this.getTemplate(templateId);
    if (template) {
      template.usageCount++;
      template.updatedAt = new Date().toISOString();
    }
    return template;
  }

  /**
   * Create template from existing quote
   */
  public createTemplateFromQuote(
    name: string,
    description: string,
    category: string,
    positions: QuotePosition[],
    tags: string[] = []
  ): QuoteTemplate {
    const template: QuoteTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      category,
      icon: this.getCategory(category)?.icon || 'FileText',
      estimatedTotal: positions.reduce((sum, pos) => sum + pos.total, 0),
      estimatedDuration: Math.max(30, Math.floor(positions.length * 5)), // Rough estimate
      positions: positions.map(pos => ({
        description: pos.description,
        quantity: pos.quantity,
        unit: pos.unit,
        unitPrice: pos.unitPrice,
        total: pos.total,
        category: pos.category,
        notes: pos.notes,
        discount: pos.discount
      })),
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      usageCount: 0
    };

    this.templates.push(template);
    return template;
  }

  /**
   * Update template
   */
  public updateTemplate(templateId: string, updates: Partial<QuoteTemplate>): QuoteTemplate | null {
    const template = this.getTemplate(templateId);
    if (template) {
      Object.assign(template, updates, {
        updatedAt: new Date().toISOString()
      });
    }
    return template;
  }

  /**
   * Delete template (mark as inactive)
   */
  public deleteTemplate(templateId: string): boolean {
    const template = this.getTemplate(templateId);
    if (template) {
      template.isActive = false;
      template.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Get template statistics
   */
  public getTemplateStats(): {
    totalTemplates: number;
    totalUsage: number;
    averageUsage: number;
    mostUsedTemplate: QuoteTemplate | null;
    categoryCounts: Record<string, number>;
  } {
    const activeTemplates = this.templates.filter(t => t.isActive);
    const totalUsage = activeTemplates.reduce((sum, t) => sum + t.usageCount, 0);
    const categoryCounts: Record<string, number> = {};
    
    activeTemplates.forEach(template => {
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
    });

    const mostUsedTemplate = activeTemplates.reduce((prev, current) => 
      prev.usageCount > current.usageCount ? prev : current, activeTemplates[0]
    );

    return {
      totalTemplates: activeTemplates.length,
      totalUsage,
      averageUsage: activeTemplates.length > 0 ? totalUsage / activeTemplates.length : 0,
      mostUsedTemplate: mostUsedTemplate || null,
      categoryCounts
    };
  }

  /**
   * Apply template to quote form
   */
  public applyTemplateToQuote(templateId: string): {
    positions: QuotePosition[];
    estimatedTotal: number;
    estimatedDuration: number;
  } | null {
    const template = this.useTemplate(templateId);
    if (!template) return null;

    const positions: QuotePosition[] = template.positions.map((pos, index) => ({
      id: `pos_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      position: index + 1,
      ...pos
    }));

    return {
      positions,
      estimatedTotal: template.estimatedTotal,
      estimatedDuration: template.estimatedDuration
    };
  }
}

export default QuoteTemplatesService;