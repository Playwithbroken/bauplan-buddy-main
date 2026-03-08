/**
 * Central Item/Position Template Service
 * Manages reusable templates for items that can be used across:
 * - Quotes
 * - Invoices
 * - Delivery Notes
 * - Cost Tracking / Nachkalkulation
 */

export type ItemTemplateCategory = 
  | 'material'      // Materials (Stahl, Beton, etc.)
  | 'labor'         // Labor/Work (Montage, Schweißen, etc.)
  | 'service'       // Services (Transport, Beratung, etc.)
  | 'equipment'     // Equipment/Machinery (Kran, Gerüst, etc.)
  | 'custom';       // Custom user-defined

export interface ItemTemplate {
  id: string;
  name: string;
  description: string;
  category: ItemTemplateCategory;
  
  // Pricing
  unitPrice: number;
  unit: string; // 'Stück', 'kg', 'm', 'm²', 'm³', 'Std', 'Pauschal'
  taxRate: number; // 19% or 7%
  
  // Optional fields
  articleNumber?: string;
  supplier?: string;
  notes?: string;
  
  // Metadata
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ItemTemplateStats {
  totalTemplates: number;
  byCategory: Record<ItemTemplateCategory, number>;
  mostUsed: ItemTemplate[];
  recentlyUsed: ItemTemplate[];
  favorites: ItemTemplate[];
}

export class ItemTemplateService {
  private static readonly STORAGE_KEY = 'bauplan-buddy-item-templates';
  private static instance: ItemTemplateService;

  private constructor() {
    this.initializeDefaultTemplates();
  }

  static getInstance(): ItemTemplateService {
    if (!ItemTemplateService.instance) {
      ItemTemplateService.instance = new ItemTemplateService();
    }
    return ItemTemplateService.instance;
  }

  /**
   * Initialize default templates for common items
   */
  private initializeDefaultTemplates(): void {
    const existing = this.getAllTemplates();
    if (existing.length > 0) return;

    const defaultTemplates: Omit<ItemTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'createdBy'>[] = [
      // Materials
      {
        name: 'Stahlträger IPE 200',
        description: 'Stahlträger IPE 200, verzinkt',
        category: 'material',
        unitPrice: 45.50,
        unit: 'm',
        taxRate: 19,
        articleNumber: 'ST-IPE200',
        tags: ['stahl', 'träger', 'konstruktion'],
        isFavorite: true,
      },
      {
        name: 'Edelstahlblech 2mm',
        description: 'Edelstahlblech V2A, 2mm Stärke',
        category: 'material',
        unitPrice: 85.00,
        unit: 'm²',
        taxRate: 19,
        articleNumber: 'ED-BL-2MM',
        tags: ['edelstahl', 'blech'],
        isFavorite: false,
      },
      {
        name: 'Schweißdraht SG2',
        description: 'Schweißdraht SG2, 1.0mm, 15kg Spule',
        category: 'material',
        unitPrice: 125.00,
        unit: 'Stück',
        taxRate: 19,
        articleNumber: 'SW-SG2-10',
        tags: ['schweißen', 'verbrauchsmaterial'],
        isFavorite: false,
      },
      
      // Labor
      {
        name: 'Montage Stahlbau',
        description: 'Montagearbeiten Stahlbau, inkl. Facharbeiter',
        category: 'labor',
        unitPrice: 65.00,
        unit: 'Std',
        taxRate: 19,
        tags: ['montage', 'stahlbau', 'facharbeiter'],
        isFavorite: true,
      },
      {
        name: 'Schweißarbeiten',
        description: 'Schweißarbeiten MAG/WIG, zertifizierter Schweißer',
        category: 'labor',
        unitPrice: 75.00,
        unit: 'Std',
        taxRate: 19,
        tags: ['schweißen', 'facharbeiter'],
        isFavorite: true,
      },
      {
        name: 'Schlosserei allgemein',
        description: 'Allgemeine Schlosserarbeiten',
        category: 'labor',
        unitPrice: 55.00,
        unit: 'Std',
        taxRate: 19,
        tags: ['schlosserei', 'handwerk'],
        isFavorite: false,
      },
      
      // Services
      {
        name: 'LKW-Transport',
        description: 'Transport mit LKW, inkl. Fahrer',
        category: 'service',
        unitPrice: 150.00,
        unit: 'Std',
        taxRate: 19,
        tags: ['transport', 'logistik'],
        isFavorite: false,
      },
      {
        name: 'Kranarbeiten',
        description: 'Autokran bis 50t, inkl. Kranführer',
        category: 'service',
        unitPrice: 180.00,
        unit: 'Std',
        taxRate: 19,
        tags: ['kran', 'heben', 'montage'],
        isFavorite: true,
      },
      {
        name: 'Statik-Prüfung',
        description: 'Statische Prüfung und Abnahme durch Sachverständigen',
        category: 'service',
        unitPrice: 450.00,
        unit: 'Pauschal',
        taxRate: 19,
        tags: ['statik', 'prüfung', 'abnahme'],
        isFavorite: false,
      },
      
      // Equipment
      {
        name: 'Gerüst Fassade',
        description: 'Fassadengerüst, Miete pro Woche',
        category: 'equipment',
        unitPrice: 8.50,
        unit: 'm²',
        taxRate: 19,
        tags: ['gerüst', 'miete'],
        isFavorite: false,
      },
      {
        name: 'Schweißgerät MIG/MAG',
        description: 'Schweißgerät MIG/MAG, Miete pro Tag',
        category: 'equipment',
        unitPrice: 45.00,
        unit: 'Stück',
        taxRate: 19,
        tags: ['schweißen', 'miete', 'werkzeug'],
        isFavorite: false,
      },
    ];

    defaultTemplates.forEach(template => {
      this.createTemplate(template, 'system');
    });
  }

  /**
   * Get all templates from storage
   */
  getAllTemplates(): ItemTemplate[] {
    const stored = localStorage.getItem(ItemTemplateService.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save templates to storage
   */
  private saveTemplates(templates: ItemTemplate[]): void {
    localStorage.setItem(ItemTemplateService.STORAGE_KEY, JSON.stringify(templates));
  }

  /**
   * Create a new template
   */
  createTemplate(
    template: Omit<ItemTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'createdBy'>,
    userId: string
  ): ItemTemplate {
    const templates = this.getAllTemplates();
    
    const newTemplate: ItemTemplate = {
      ...template,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };

    templates.push(newTemplate);
    this.saveTemplates(templates);
    
    return newTemplate;
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ItemTemplate | null {
    const templates = this.getAllTemplates();
    return templates.find(t => t.id === id) || null;
  }

  /**
   * Update template
   */
  updateTemplate(
    id: string,
    updates: Partial<Omit<ItemTemplate, 'id' | 'createdAt' | 'createdBy'>>
  ): ItemTemplate | null {
    const templates = this.getAllTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return null;

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveTemplates(templates);
    return templates[index];
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    const templates = this.getAllTemplates();
    const filtered = templates.filter(t => t.id !== id);
    
    if (filtered.length === templates.length) return false;
    
    this.saveTemplates(filtered);
    return true;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: ItemTemplateCategory): ItemTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): ItemTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      t.articleNumber?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get favorite templates
   */
  getFavorites(): ItemTemplate[] {
    return this.getAllTemplates()
      .filter(t => t.isFavorite)
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(id: string): ItemTemplate | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    return this.updateTemplate(id, { isFavorite: !template.isFavorite });
  }

  /**
   * Record template usage
   */
  recordUsage(id: string): ItemTemplate | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    return this.updateTemplate(id, {
      usageCount: template.usageCount + 1,
      lastUsed: new Date().toISOString(),
    });
  }

  /**
   * Get recently used templates
   */
  getRecentlyUsed(limit: number = 10): ItemTemplate[] {
    return this.getAllTemplates()
      .filter(t => t.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, limit);
  }

  /**
   * Get most used templates
   */
  getMostUsed(limit: number = 10): ItemTemplate[] {
    return this.getAllTemplates()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Get statistics
   */
  getStats(): ItemTemplateStats {
    const templates = this.getAllTemplates();
    
    const byCategory: Record<ItemTemplateCategory, number> = {
      material: 0,
      labor: 0,
      service: 0,
      equipment: 0,
      custom: 0,
    };

    templates.forEach(t => {
      byCategory[t.category]++;
    });

    return {
      totalTemplates: templates.length,
      byCategory,
      mostUsed: this.getMostUsed(5),
      recentlyUsed: this.getRecentlyUsed(5),
      favorites: this.getFavorites(),
    };
  }

  /**
   * Export templates to JSON
   */
  exportTemplates(): string {
    return JSON.stringify(this.getAllTemplates(), null, 2);
  }

  /**
   * Import templates from JSON
   */
  importTemplates(jsonData: string, userId: string): { success: number; errors: number } {
    try {
      const imported = JSON.parse(jsonData) as ItemTemplate[];
      let success = 0;
      let errors = 0;

      imported.forEach(template => {
        try {
          this.createTemplate({
            name: template.name,
            description: template.description,
            category: template.category,
            unitPrice: template.unitPrice,
            unit: template.unit,
            taxRate: template.taxRate,
            articleNumber: template.articleNumber,
            supplier: template.supplier,
            notes: template.notes,
            tags: template.tags || [],
            isFavorite: false,
          }, userId);
          success++;
        } catch {
          errors++;
        }
      });

      return { success, errors };
    } catch {
      return { success: 0, errors: 1 };
    }
  }

  /**
   * Duplicate template
   */
  duplicateTemplate(id: string, userId: string): ItemTemplate | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    return this.createTemplate({
      name: `${template.name} (Kopie)`,
      description: template.description,
      category: template.category,
      unitPrice: template.unitPrice,
      unit: template.unit,
      taxRate: template.taxRate,
      articleNumber: template.articleNumber,
      supplier: template.supplier,
      notes: template.notes,
      tags: template.tags,
      isFavorite: false,
    }, userId);
  }
}

// Export singleton instance
export const itemTemplateService = ItemTemplateService.getInstance();
