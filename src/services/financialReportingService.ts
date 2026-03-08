export interface FinancialPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: 'month' | 'quarter' | 'year' | 'custom';
}

export interface Revenue {
  id: string;
  date: Date;
  amount: number;
  source: 'project' | 'service' | 'materials' | 'other';
  projectId?: string;
  customerId: string;
  invoiceId?: string;
  description: string;
  taxAmount: number;
  netAmount: number;
  category: string;
  subcategory?: string;
}

export interface Expense {
  id: string;
  date: Date;
  amount: number;
  category: 'materials' | 'labor' | 'equipment' | 'subcontractors' | 'overhead' | 'marketing' | 'administration' | 'other';
  subcategory: string;
  projectId?: string;
  supplierId?: string;
  description: string;
  taxAmount: number;
  netAmount: number;
  isRecurring: boolean;
  paymentMethod: 'cash' | 'bank' | 'credit' | 'check';
  receiptNumber?: string;
  vatDeductible: boolean;
}

export interface ProfitLossStatement {
  period: FinancialPeriod;
  revenue: {
    totalRevenue: number;
    revenueByCategory: Record<string, number>;
    revenueByProject: Record<string, number>;
    revenueByCustomer: Record<string, number>;
    taxCollected: number;
    netRevenue: number;
  };
  expenses: {
    totalExpenses: number;
    expensesByCategory: Record<string, number>;
    expensesByProject: Record<string, number>;
    expensesBySupplier: Record<string, number>;
    taxPaid: number;
    netExpenses: number;
  };
  profit: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    grossMargin: number;
    ebitda: number;
    operatingProfit: number;
  };
  metrics: {
    revenueGrowth: number;
    expenseRatio: number;
    averageProjectValue: number;
    customerAcquisitionCost: number;
    returnOnInvestment: number;
    burnRate: number;
  };
  comparisons: {
    previousPeriod?: ProfitLossStatement;
    samePeriodLastYear?: ProfitLossStatement;
    budget?: BudgetComparison;
  };
}

export interface BudgetComparison {
  budgetedRevenue: number;
  actualRevenue: number;
  revenueVariance: number;
  budgetedExpenses: number;
  actualExpenses: number;
  expenseVariance: number;
  budgetedProfit: number;
  actualProfit: number;
  profitVariance: number;
}

export interface CashFlowStatement {
  period: FinancialPeriod;
  operatingActivities: {
    netIncome: number;
    depreciation: number;
    accountsReceivableChange: number;
    accountsPayableChange: number;
    inventoryChange: number;
    netCashFromOperations: number;
  };
  investingActivities: {
    equipmentPurchases: number;
    equipmentSales: number;
    netCashFromInvesting: number;
  };
  financingActivities: {
    loanProceeds: number;
    loanRepayments: number;
    ownerContributions: number;
    ownerWithdrawals: number;
    netCashFromFinancing: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export interface FinancialRatio {
  name: string;
  value: number;
  description: string;
  category: 'profitability' | 'liquidity' | 'efficiency' | 'leverage';
  benchmark?: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface FinancialForecast {
  period: FinancialPeriod;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
  confidence: number;
  assumptions: string[];
  scenarios: {
    optimistic: { revenue: number; expenses: number; profit: number };
    realistic: { revenue: number; expenses: number; profit: number };
    pessimistic: { revenue: number; expenses: number; profit: number };
  };
}

export interface TaxReport {
  period: FinancialPeriod;
  vatCollected: number;
  vatPaid: number;
  netVatLiability: number;
  taxableIncome: number;
  deductibleExpenses: number;
  estimatedTaxLiability: number;
  quarterlyPayments: number[];
  annualProjection: number;
}

export class FinancialReportingService {
  private static instance: FinancialReportingService;
  private revenues: Revenue[] = [];
  private expenses: Expense[] = [];

  static getInstance(): FinancialReportingService {
    if (!FinancialReportingService.instance) {
      FinancialReportingService.instance = new FinancialReportingService();
    }
    return FinancialReportingService.instance;
  }

  constructor() {
    this.loadData();
    this.generateMockData();
  }

  private loadData(): void {
    try {
      const storedRevenues = localStorage.getItem('financial_revenues');
      if (storedRevenues) {
        this.revenues = JSON.parse(storedRevenues).map((r: Record<string, unknown>) => ({
          ...r,
          date: new Date(r.date)
        }));
      }

      const storedExpenses = localStorage.getItem('financial_expenses');
      if (storedExpenses) {
        this.expenses = JSON.parse(storedExpenses).map((e: Record<string, unknown>) => ({
          ...e,
          date: new Date(e.date)
        }));
      }
    } catch (error) {
      console.error('Failed to load financial data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem('financial_revenues', JSON.stringify(this.revenues));
      localStorage.setItem('financial_expenses', JSON.stringify(this.expenses));
    } catch (error) {
      console.error('Failed to save financial data:', error);
    }
  }

  private generateMockData(): void {
    if (this.revenues.length > 0) return;

    // Generate mock revenue data for the last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
      
      // Multiple revenue entries per month
      for (let j = 0; j < 3 + Math.floor(Math.random() * 5); j++) {
        const revenue: Revenue = {
          id: `rev-${date.getFullYear()}-${date.getMonth()}-${j}`,
          date: new Date(date.getTime() + (j * 7 * 24 * 60 * 60 * 1000)),
          amount: 15000 + Math.random() * 50000,
          source: ['project', 'service', 'materials'][Math.floor(Math.random() * 3)] as Revenue['source'],
          customerId: `customer-${Math.floor(Math.random() * 10) + 1}`,
          description: `Projekt ${j + 1} - ${date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
          taxAmount: 0,
          netAmount: 0,
          category: ['Neubau', 'Renovierung', 'Sanierung', 'Wartung'][Math.floor(Math.random() * 4)]
        };
        revenue.taxAmount = revenue.amount * 0.19;
        revenue.netAmount = revenue.amount - revenue.taxAmount;
        this.revenues.push(revenue);
      }
    }

    // Generate mock expense data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 10);
      
      for (let j = 0; j < 5 + Math.floor(Math.random() * 8); j++) {
        const categories = ['materials', 'labor', 'equipment', 'subcontractors', 'overhead', 'administration'];
        const category = categories[Math.floor(Math.random() * categories.length)] as Expense['category'];
        
        const expense: Expense = {
          id: `exp-${date.getFullYear()}-${date.getMonth()}-${j}`,
          date: new Date(date.getTime() + (j * 5 * 24 * 60 * 60 * 1000)),
          amount: 1000 + Math.random() * 15000,
          category,
          subcategory: this.getSubcategory(category),
          description: `${category} - ${date.toLocaleDateString('de-DE', { month: 'long' })}`,
          taxAmount: 0,
          netAmount: 0,
          isRecurring: Math.random() < 0.3,
          paymentMethod: ['bank', 'credit', 'cash'][Math.floor(Math.random() * 3)] as Revenue['source'],
          vatDeductible: Math.random() < 0.8
        };
        expense.taxAmount = expense.vatDeductible ? expense.amount * 0.19 : 0;
        expense.netAmount = expense.amount - expense.taxAmount;
        this.expenses.push(expense);
      }
    }

    this.saveData();
  }

  private getSubcategory(category: string): string {
    const subcategories: Record<string, string[]> = {
      materials: ['Baustoffe', 'Werkzeuge', 'Elektromaterial', 'Sanitär'],
      labor: ['Festangestellte', 'Aushilfen', 'Überstunden', 'Sozialabgaben'],
      equipment: ['Maschinen', 'Fahrzeuge', 'Wartung', 'Kraftstoff'],
      subcontractors: ['Elektriker', 'Klempner', 'Maler', 'Spezialisten'],
      overhead: ['Miete', 'Versicherung', 'Strom', 'Internet'],
      administration: ['Büromaterial', 'Software', 'Beratung', 'Fortbildung']
    };
    
    const options = subcategories[category] || ['Sonstiges'];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Public API Methods
  generateProfitLossStatement(period: FinancialPeriod): ProfitLossStatement {
    const periodRevenues = this.getRevenuesForPeriod(period);
    const periodExpenses = this.getExpensesForPeriod(period);

    // Calculate revenue metrics
    const totalRevenue = periodRevenues.reduce((sum, r) => sum + r.amount, 0);
    const taxCollected = periodRevenues.reduce((sum, r) => sum + r.taxAmount, 0);
    const netRevenue = totalRevenue - taxCollected;

    const revenueByCategory = this.groupBy(periodRevenues, 'category', 'amount');
    const revenueByProject = this.groupBy(periodRevenues.filter(r => r.projectId), 'projectId', 'amount');
    const revenueByCustomer = this.groupBy(periodRevenues, 'customerId', 'amount');

    // Calculate expense metrics
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const taxPaid = periodExpenses.reduce((sum, e) => sum + e.taxAmount, 0);
    const netExpenses = totalExpenses - taxPaid;

    const expensesByCategory = this.groupBy(periodExpenses, 'category', 'amount');
    const expensesByProject = this.groupBy(periodExpenses.filter(e => e.projectId), 'projectId', 'amount');
    const expensesBySupplier = this.groupBy(periodExpenses.filter(e => e.supplierId), 'supplierId', 'amount');

    // Calculate profit metrics
    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = netRevenue - netExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const grossMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate business metrics
    const previousPeriod = this.getPreviousPeriod(period);
    const revenueGrowth = previousPeriod ? this.calculateGrowthRate(
      this.getRevenuesForPeriod(previousPeriod).reduce((sum, r) => sum + r.amount, 0),
      totalRevenue
    ) : 0;

    const projectRevenues = periodRevenues.filter(r => r.projectId);
    const averageProjectValue = projectRevenues.length > 0 
      ? totalRevenue / new Set(projectRevenues.map(r => r.projectId)).size 
      : 0;

    return {
      period,
      revenue: {
        totalRevenue,
        revenueByCategory,
        revenueByProject,
        revenueByCustomer,
        taxCollected,
        netRevenue
      },
      expenses: {
        totalExpenses,
        expensesByCategory,
        expensesByProject,
        expensesBySupplier,
        taxPaid,
        netExpenses
      },
      profit: {
        grossProfit,
        netProfit,
        profitMargin,
        grossMargin,
        ebitda: netProfit, // Simplified for construction
        operatingProfit: netProfit
      },
      metrics: {
        revenueGrowth,
        expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0,
        averageProjectValue,
        customerAcquisitionCost: 0, // Would need marketing expense data
        returnOnInvestment: totalExpenses > 0 ? (grossProfit / totalExpenses) * 100 : 0,
        burnRate: netExpenses / this.getDaysInPeriod(period)
      },
      comparisons: {}
    };
  }

  generateCashFlowStatement(period: FinancialPeriod): CashFlowStatement {
    const pnl = this.generateProfitLossStatement(period);
    
    // Simplified cash flow for construction business
    const netCashFromOperations = pnl.profit.netProfit * 0.85; // Assume 85% cash conversion
    const equipmentPurchases = this.getEquipmentExpenses(period);
    const netCashFlow = netCashFromOperations - equipmentPurchases;

    return {
      period,
      operatingActivities: {
        netIncome: pnl.profit.netProfit,
        depreciation: equipmentPurchases * 0.1, // 10% annual depreciation
        accountsReceivableChange: pnl.revenue.totalRevenue * 0.15, // 15% in AR
        accountsPayableChange: pnl.expenses.totalExpenses * 0.1, // 10% in AP
        inventoryChange: 0,
        netCashFromOperations
      },
      investingActivities: {
        equipmentPurchases: -equipmentPurchases,
        equipmentSales: 0,
        netCashFromInvesting: -equipmentPurchases
      },
      financingActivities: {
        loanProceeds: 0,
        loanRepayments: 0,
        ownerContributions: 0,
        ownerWithdrawals: 0,
        netCashFromFinancing: 0
      },
      netCashFlow,
      beginningCash: 50000, // Assumed starting cash
      endingCash: 50000 + netCashFlow
    };
  }

  generateFinancialRatios(period: FinancialPeriod): FinancialRatio[] {
    const pnl = this.generateProfitLossStatement(period);
    
    return [
      {
        name: 'Gewinnmarge',
        value: pnl.profit.profitMargin,
        description: 'Gewinn als Prozentsatz des Umsatzes',
        category: 'profitability',
        benchmark: 15,
        trend: pnl.profit.profitMargin > 15 ? 'improving' : 'declining'
      },
      {
        name: 'Kostenquote',
        value: pnl.metrics.expenseRatio,
        description: 'Kosten als Prozentsatz des Umsatzes',
        category: 'efficiency',
        benchmark: 75,
        trend: pnl.metrics.expenseRatio < 75 ? 'improving' : 'declining'
      },
      {
        name: 'ROI',
        value: pnl.metrics.returnOnInvestment,
        description: 'Return on Investment',
        category: 'profitability',
        benchmark: 20,
        trend: pnl.metrics.returnOnInvestment > 20 ? 'improving' : 'declining'
      },
      {
        name: 'Umsatzwachstum',
        value: pnl.metrics.revenueGrowth,
        description: 'Wachstum gegenüber Vorperiode',
        category: 'efficiency',
        benchmark: 10,
        trend: pnl.metrics.revenueGrowth > 10 ? 'improving' : pnl.metrics.revenueGrowth > 0 ? 'stable' : 'declining'
      }
    ];
  }

  generateForecast(period: FinancialPeriod): FinancialForecast {
    const historicalData = this.getHistoricalTrends(period);
    const baseRevenue = historicalData.avgRevenue;
    const baseExpenses = historicalData.avgExpenses;

    return {
      period,
      projectedRevenue: baseRevenue * 1.1, // 10% growth assumption
      projectedExpenses: baseExpenses * 1.05, // 5% cost increase
      projectedProfit: (baseRevenue * 1.1) - (baseExpenses * 1.05),
      confidence: 75,
      assumptions: [
        'Fortsetzung aktueller Markttrends',
        '10% Umsatzwachstum durch neue Projekte',
        '5% Kostensteigerung durch Inflation',
        'Keine größeren wirtschaftlichen Störungen'
      ],
      scenarios: {
        optimistic: {
          revenue: baseRevenue * 1.25,
          expenses: baseExpenses * 1.02,
          profit: (baseRevenue * 1.25) - (baseExpenses * 1.02)
        },
        realistic: {
          revenue: baseRevenue * 1.1,
          expenses: baseExpenses * 1.05,
          profit: (baseRevenue * 1.1) - (baseExpenses * 1.05)
        },
        pessimistic: {
          revenue: baseRevenue * 0.95,
          expenses: baseExpenses * 1.08,
          profit: (baseRevenue * 0.95) - (baseExpenses * 1.08)
        }
      }
    };
  }

  generateTaxReport(period: FinancialPeriod): TaxReport {
    const periodRevenues = this.getRevenuesForPeriod(period);
    const periodExpenses = this.getExpensesForPeriod(period);

    const vatCollected = periodRevenues.reduce((sum, r) => sum + r.taxAmount, 0);
    const vatPaid = periodExpenses.filter(e => e.vatDeductible).reduce((sum, e) => sum + e.taxAmount, 0);
    const taxableIncome = periodRevenues.reduce((sum, r) => sum + r.netAmount, 0);
    const deductibleExpenses = periodExpenses.reduce((sum, e) => sum + e.netAmount, 0);

    return {
      period,
      vatCollected,
      vatPaid,
      netVatLiability: vatCollected - vatPaid,
      taxableIncome,
      deductibleExpenses,
      estimatedTaxLiability: Math.max(0, (taxableIncome - deductibleExpenses) * 0.25), // 25% tax rate
      quarterlyPayments: [0, 0, 0, 0], // Would be calculated based on actual payments
      annualProjection: Math.max(0, (taxableIncome - deductibleExpenses) * 0.25) * 4
    };
  }

  // Helper methods
  private getRevenuesForPeriod(period: FinancialPeriod): Revenue[] {
    return this.revenues.filter(r => 
      r.date >= period.startDate && r.date <= period.endDate
    );
  }

  private getExpensesForPeriod(period: FinancialPeriod): Expense[] {
    return this.expenses.filter(e => 
      e.date >= period.startDate && e.date <= period.endDate
    );
  }

  private groupBy<T>(array: T[], key: keyof T, sumKey: keyof T): Record<string, number> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) groups[groupKey] = 0;
      groups[groupKey] += Number(item[sumKey]);
      return groups;
    }, {} as Record<string, number>);
  }

  private getPreviousPeriod(period: FinancialPeriod): FinancialPeriod | null {
    const duration = period.endDate.getTime() - period.startDate.getTime();
    const startDate = new Date(period.startDate.getTime() - duration);
    const endDate = new Date(period.endDate.getTime() - duration);
    
    return {
      id: `prev-${period.id}`,
      name: `Previous ${period.name}`,
      startDate,
      endDate,
      type: period.type
    };
  }

  private calculateGrowthRate(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private getDaysInPeriod(period: FinancialPeriod): number {
    return Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getEquipmentExpenses(period: FinancialPeriod): number {
    return this.getExpensesForPeriod(period)
      .filter(e => e.category === 'equipment')
      .reduce((sum, e) => sum + e.amount, 0);
  }

  private getHistoricalTrends(period: FinancialPeriod): { avgRevenue: number; avgExpenses: number } {
    // Get last 3 periods for trend analysis
    const periods = [];
    for (let i = 1; i <= 3; i++) {
      const prevPeriod = this.getPreviousPeriod(period);
      if (prevPeriod) periods.push(prevPeriod);
    }

    const revenues = periods.map(p => this.getRevenuesForPeriod(p).reduce((sum, r) => sum + r.amount, 0));
    const expenses = periods.map(p => this.getExpensesForPeriod(p).reduce((sum, e) => sum + e.amount, 0));

    return {
      avgRevenue: revenues.length > 0 ? revenues.reduce((sum, r) => sum + r, 0) / revenues.length : 0,
      avgExpenses: expenses.length > 0 ? expenses.reduce((sum, e) => sum + e, 0) / expenses.length : 0
    };
  }

  // Utility methods for creating periods
  createMonthlyPeriod(year: number, month: number): FinancialPeriod {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    return {
      id: `month-${year}-${month}`,
      name: `${startDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
      startDate,
      endDate,
      type: 'month'
    };
  }

  createQuarterlyPeriod(year: number, quarter: number): FinancialPeriod {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);
    
    return {
      id: `quarter-${year}-${quarter}`,
      name: `Q${quarter} ${year}`,
      startDate,
      endDate,
      type: 'quarter'
    };
  }

  createYearlyPeriod(year: number): FinancialPeriod {
    return {
      id: `year-${year}`,
      name: `${year}`,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31),
      type: 'year'
    };
  }
}

export default FinancialReportingService.getInstance();


