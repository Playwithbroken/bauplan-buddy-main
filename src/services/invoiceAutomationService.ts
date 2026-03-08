import { InvoiceSettings, InvoiceFormData } from '@/types/invoice';

export interface NumberingConfig {
  prefix: string;
  nextNumber: number;
  resetYearly: boolean;
  format: string; // e.g., "RG-{YYYY}-{NNNNNN}"
  customPattern?: string;
}

export interface TaxCalculationResult {
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  taxBreakdown: Record<string, {
    net: number;
    tax: number;
    rate: number;
  }>;
}

export interface TaxRule {
  id: string;
  name: string;
  rate: number;
  description: string;
  validFrom: string;
  validTo?: string;
  country: string;
  category?: string;
  isDefault: boolean;
}

export class InvoiceNumberingService {
  private static readonly NUMBERING_KEY = 'bauplan-buddy-invoice-numbering';
  private static readonly COUNTERS_KEY = 'bauplan-buddy-invoice-counters';

  /**
   * Generate next invoice number based on configuration
   */
  static generateInvoiceNumber(type: 'invoice' | 'credit_note' | 'proforma' = 'invoice'): string {
    const config = this.getNumberingConfig(type);
    const counter = this.getAndUpdateCounter(type, config);
    
    return this.formatNumber(counter, config);
  }

  /**
   * Preview next invoice number without incrementing counter
   */
  static previewNextNumber(type: 'invoice' | 'credit_note' | 'proforma' = 'invoice'): string {
    const config = this.getNumberingConfig(type);
    const currentCounter = this.getCurrentCounter(type);
    
    return this.formatNumber(currentCounter + 1, config);
  }

  /**
   * Get numbering configuration for document type
   */
  static getNumberingConfig(type: 'invoice' | 'credit_note' | 'proforma'): NumberingConfig {
    try {
      const data = localStorage.getItem(this.NUMBERING_KEY);
      const configs = data ? JSON.parse(data) : this.getDefaultConfigs();
      return configs[type] || configs.invoice;
    } catch {
      return this.getDefaultConfigs().invoice;
    }
  }

  /**
   * Update numbering configuration
   */
  static updateNumberingConfig(type: 'invoice' | 'credit_note' | 'proforma', config: NumberingConfig): void {
    try {
      const data = localStorage.getItem(this.NUMBERING_KEY);
      const configs = data ? JSON.parse(data) : this.getDefaultConfigs();
      configs[type] = config;
      localStorage.setItem(this.NUMBERING_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Error updating numbering config:', error);
    }
  }

  /**
   * Reset counter for year or manually
   */
  static resetCounter(type: 'invoice' | 'credit_note' | 'proforma', startNumber: number = 1): void {
    try {
      const data = localStorage.getItem(this.COUNTERS_KEY);
      const counters = data ? JSON.parse(data) : {};
      const year = new Date().getFullYear();
      
      if (!counters[year]) {
        counters[year] = {};
      }
      
      counters[year][type] = startNumber - 1; // Will be incremented when next number is generated
      localStorage.setItem(this.COUNTERS_KEY, JSON.stringify(counters));
    } catch (error) {
      console.error('Error resetting counter:', error);
    }
  }

  private static getAndUpdateCounter(type: string, config: NumberingConfig): number {
    try {
      const data = localStorage.getItem(this.COUNTERS_KEY);
      const counters = data ? JSON.parse(data) : {};
      const year = new Date().getFullYear();
      
      if (!counters[year]) {
        counters[year] = {};
      }
      
      if (!counters[year][type]) {
        counters[year][type] = config.nextNumber - 1;
      }
      
      counters[year][type]++;
      localStorage.setItem(this.COUNTERS_KEY, JSON.stringify(counters));
      
      return counters[year][type];
    } catch (error) {
      console.error('Error updating counter:', error);
      return config.nextNumber;
    }
  }

  private static getCurrentCounter(type: string): number {
    try {
      const data = localStorage.getItem(this.COUNTERS_KEY);
      const counters = data ? JSON.parse(data) : {};
      const year = new Date().getFullYear();
      
      return counters[year]?.[type] || 0;
    } catch {
      return 0;
    }
  }

  private static formatNumber(counter: number, config: NumberingConfig): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    let formatted = config.format || '{PREFIX}-{YYYY}-{NNNNNN}';
    
    // Replace placeholders
    formatted = formatted
      .replace('{PREFIX}', config.prefix)
      .replace('{YYYY}', year.toString())
      .replace('{YY}', year.toString().slice(-2))
      .replace('{MM}', month)
      .replace('{DD}', day)
      .replace('{NNNNNN}', counter.toString().padStart(6, '0'))
      .replace('{NNNNN}', counter.toString().padStart(5, '0'))
      .replace('{NNNN}', counter.toString().padStart(4, '0'))
      .replace('{NNN}', counter.toString().padStart(3, '0'))
      .replace('{NN}', counter.toString().padStart(2, '0'))
      .replace('{N}', counter.toString());
    
    return formatted;
  }

  private static getDefaultConfigs(): Record<string, NumberingConfig> {
    return {
      invoice: {
        prefix: 'RG',
        nextNumber: 1,
        resetYearly: true,
        format: 'RG-{YYYY}-{NNNNNN}',
      },
      credit_note: {
        prefix: 'GS',
        nextNumber: 1,
        resetYearly: true,
        format: 'GS-{YYYY}-{NNNNNN}',
      },
      proforma: {
        prefix: 'PF',
        nextNumber: 1,
        resetYearly: true,
        format: 'PF-{YYYY}-{NNNNNN}',
      },
    };
  }
}

export class TaxCalculationService {
  private static readonly TAX_RULES_KEY = 'bauplan-buddy-tax-rules';

  /**
   * Calculate tax for items with different tax rates
   */
  static calculateTax(items: Array<{
    netAmount: number;
    taxRate: number;
    category?: string;
  }>): TaxCalculationResult {
    let totalNet = 0;
    let totalTax = 0;
    const taxBreakdown: Record<string, { net: number; tax: number; rate: number }> = {};

    items.forEach(item => {
      const netAmount = item.netAmount || 0;
      const taxRate = item.taxRate || 0;
      const taxAmount = netAmount * (taxRate / 100);

      totalNet += netAmount;
      totalTax += taxAmount;

      // Group by tax rate for breakdown
      const rateKey = `${taxRate}%`;
      if (!taxBreakdown[rateKey]) {
        taxBreakdown[rateKey] = { net: 0, tax: 0, rate: taxRate };
      }
      taxBreakdown[rateKey].net += netAmount;
      taxBreakdown[rateKey].tax += taxAmount;
    });

    return {
      netAmount: totalNet,
      taxAmount: totalTax,
      grossAmount: totalNet + totalTax,
      taxBreakdown,
    };
  }

  /**
   * Get applicable tax rate for item category and date
   */
  static getApplicableTaxRate(category: string = 'standard', date: string = new Date().toISOString()): number {
    const rules = this.getTaxRules();
    const applicableRule = rules.find(rule => {
      const validFrom = new Date(rule.validFrom);
      const validTo = rule.validTo ? new Date(rule.validTo) : new Date('2099-12-31');
      const checkDate = new Date(date);

      return (
        rule.category === category &&
        checkDate >= validFrom &&
        checkDate <= validTo
      );
    });

    return applicableRule?.rate || this.getDefaultTaxRate();
  }

  /**
   * Get all tax rules
   */
  static getTaxRules(): TaxRule[] {
    try {
      const data = localStorage.getItem(this.TAX_RULES_KEY);
      return data ? JSON.parse(data) : this.getDefaultTaxRules();
    } catch {
      return this.getDefaultTaxRules();
    }
  }

  /**
   * Add or update tax rule
   */
  static saveTaxRule(rule: TaxRule): void {
    try {
      const rules = this.getTaxRules();
      const existingIndex = rules.findIndex(r => r.id === rule.id);
      
      if (existingIndex >= 0) {
        rules[existingIndex] = rule;
      } else {
        rules.push(rule);
      }
      
      localStorage.setItem(this.TAX_RULES_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('Error saving tax rule:', error);
    }
  }

  /**
   * Delete tax rule
   */
  static deleteTaxRule(ruleId: string): void {
    try {
      const rules = this.getTaxRules();
      const filteredRules = rules.filter(r => r.id !== ruleId);
      localStorage.setItem(this.TAX_RULES_KEY, JSON.stringify(filteredRules));
    } catch (error) {
      console.error('Error deleting tax rule:', error);
    }
  }

  /**
   * Calculate reverse tax (from gross to net)
   */
  static calculateReverseVAT(grossAmount: number, taxRate: number): { net: number; tax: number } {
    const divisor = 1 + (taxRate / 100);
    const net = grossAmount / divisor;
    const tax = grossAmount - net;
    
    return { net, tax };
  }

  /**
   * Calculate compound tax for multiple tax types
   */
  static calculateCompoundTax(netAmount: number, taxRates: number[]): TaxCalculationResult {
    let currentAmount = netAmount;
    let totalTax = 0;
    const taxBreakdown: Record<string, { net: number; tax: number; rate: number }> = {};

    taxRates.forEach((rate, index) => {
      const taxAmount = currentAmount * (rate / 100);
      totalTax += taxAmount;
      currentAmount += taxAmount;

      const rateKey = `Tax${index + 1}_${rate}%`;
      taxBreakdown[rateKey] = {
        net: netAmount,
        tax: taxAmount,
        rate,
      };
    });

    return {
      netAmount,
      taxAmount: totalTax,
      grossAmount: netAmount + totalTax,
      taxBreakdown,
    };
  }

  /**
   * Validate tax calculation
   */
  static validateTaxCalculation(calculation: TaxCalculationResult): boolean {
    const calculatedGross = calculation.netAmount + calculation.taxAmount;
    const tolerance = 0.01; // 1 cent tolerance for rounding
    
    return Math.abs(calculatedGross - calculation.grossAmount) <= tolerance;
  }

  /**
   * Format tax breakdown for display
   */
  static formatTaxBreakdown(breakdown: Record<string, { net: number; tax: number; rate: number }>): string[] {
    return Object.entries(breakdown).map(([key, value]) => {
      return `${key}: ${value.net.toFixed(2)} € (netto) + ${value.tax.toFixed(2)} € (${value.rate}% MwSt.)`;
    });
  }

  private static getDefaultTaxRate(): number {
    return 19; // German standard VAT rate
  }

  private static getDefaultTaxRules(): TaxRule[] {
    return [
      {
        id: 'de-standard-2024',
        name: 'Standardsatz Deutschland',
        rate: 19,
        description: 'Deutscher Standardsteuersatz',
        validFrom: '2007-01-01',
        country: 'DE',
        category: 'standard',
        isDefault: true,
      },
      {
        id: 'de-reduced-2024',
        name: 'Ermäßigter Satz Deutschland',
        rate: 7,
        description: 'Deutscher ermäßigter Steuersatz',
        validFrom: '2007-01-01',
        country: 'DE',
        category: 'reduced',
        isDefault: false,
      },
      {
        id: 'de-exempt-2024',
        name: 'Steuerbefreit Deutschland',
        rate: 0,
        description: 'Steuerbefreite Leistungen',
        validFrom: '2007-01-01',
        country: 'DE',
        category: 'exempt',
        isDefault: false,
      },
    ];
  }
}

export class InvoiceAutomationService {
  /**
   * Auto-calculate invoice totals
   */
  static calculateInvoiceTotals(items: Array<{
    quantity: number;
    unitPrice: number;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    taxRate: number;
  }>): {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    totalGross: number;
    items: Array<{
      netAmount: number;
      taxAmount: number;
      grossAmount: number;
    }>;
  } {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const processedItems = [];

    for (const item of items) {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const discount = item.discount || 0;
      const taxRate = item.taxRate || 0;

      // Calculate line total
      let lineTotal = quantity * unitPrice;
      let lineDiscount = 0;

      // Apply discount
      if (discount > 0) {
        if (item.discountType === 'percentage') {
          lineDiscount = lineTotal * (discount / 100);
        } else {
          lineDiscount = Math.min(discount, lineTotal);
        }
        lineTotal -= lineDiscount;
      }

      // Calculate tax
      const lineTax = lineTotal * (taxRate / 100);
      const lineGross = lineTotal + lineTax;

      subtotal += lineTotal;
      totalDiscount += lineDiscount;
      totalTax += lineTax;

      processedItems.push({
        netAmount: lineTotal,
        taxAmount: lineTax,
        grossAmount: lineGross,
      });
    }

    return {
      subtotal,
      totalDiscount,
      totalTax,
      totalGross: subtotal + totalTax,
      items: processedItems,
    };
  }

  /**
   * Generate invoice number based on template and increment counter
   */
  static generateNextInvoiceNumber(type: 'invoice' | 'credit_note' | 'proforma' = 'invoice'): string {
    return InvoiceNumberingService.generateInvoiceNumber(type);
  }

  /**
   * Auto-fill due date based on payment terms
   */
  static calculateDueDate(issueDate: string, paymentTermsDays: number): string {
    const issue = new Date(issueDate);
    const due = new Date(issue);
    due.setDate(due.getDate() + paymentTermsDays);
    return due.toISOString().split('T')[0];
  }

  /**
   * Validate invoice data before saving
   */
  static validateInvoiceData(invoiceData: Partial<InvoiceFormData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!invoiceData.recipient?.name) {
      errors.push('Kundenname ist erforderlich');
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      errors.push('Mindestens eine Position ist erforderlich');
    }

    if (!invoiceData.issueDate) {
      errors.push('Rechnungsdatum ist erforderlich');
    }

    if (!invoiceData.dueDate) {
      errors.push('Fälligkeitsdatum ist erforderlich');
    }

    // Date validation
    if (invoiceData.issueDate && invoiceData.dueDate) {
      const issueDate = new Date(invoiceData.issueDate);
      const dueDate = new Date(invoiceData.dueDate);
      
      if (dueDate < issueDate) {
        errors.push('Fälligkeitsdatum muss nach dem Rechnungsdatum liegen');
      }
    }

    // Items validation
    if (invoiceData.items) {
      invoiceData.items.forEach((item: Partial<InvoiceFormData['items'][number]>, index: number) => {
        if (!item.description) {
          errors.push(`Position ${index + 1}: Beschreibung ist erforderlich`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Position ${index + 1}: Gültige Menge ist erforderlich`);
        }
        if (!item.unitPrice || item.unitPrice < 0) {
          errors.push(`Position ${index + 1}: Gültiger Preis ist erforderlich`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency: string = 'EUR', locale: string = 'de-DE'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Calculate payment schedule for installments
   */
  static calculatePaymentSchedule(
    totalAmount: number,
    installments: number,
    startDate: string,
    intervalDays: number = 30
  ): Array<{ dueDate: string; amount: number; installment: number }> {
    const schedule = [];
    const installmentAmount = totalAmount / installments;
    const start = new Date(startDate);

    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(start);
      dueDate.setDate(dueDate.getDate() + (i * intervalDays));

      schedule.push({
        dueDate: dueDate.toISOString().split('T')[0],
        amount: i === installments - 1 
          ? totalAmount - (installmentAmount * (installments - 1)) // Last installment gets remainder
          : installmentAmount,
        installment: i + 1,
      });
    }

    return schedule;
  }
}
