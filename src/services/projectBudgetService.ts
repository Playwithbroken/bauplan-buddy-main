import { ErrorHandlingService } from './errorHandlingService';

export interface BudgetCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  parentCategoryId?: string;
  isSystemCategory: boolean;
}

export interface BudgetItem {
  id: string;
  projectId: string;
  categoryId: string;
  name: string;
  description?: string;
  estimatedCost: number;
  actualCost: number;
  approvedBudget: number;
  remainingBudget: number;
  contingency: number;
  status: 'planned' | 'approved' | 'in_progress' | 'completed' | 'overbudget' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostEntry {
  id: string;
  projectId: string;
  budgetItemId?: string;
  categoryId: string;
  description: string;
  amount: number;
  currency: string;
  type: 'steel_material' | 'fabrication_labor' | 'welding_consumables' | 'surface_treatment' | 'machining_equipment' | 'assembly_installation' | 'quality_testing' | 'engineering' | 'subcontractor' | 'other';
  date: string;
  invoiceId?: string;
  supplierId?: string;
  supplierName?: string;
  receiptPath?: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  tags: string[];
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface BudgetVariance {
  budgetItemId: string;
  estimatedCost: number;
  actualCost: number;
  variance: number;
  variancePercent: number;
  status: 'under_budget' | 'on_budget' | 'over_budget' | 'critical_overrun';
  impactDescription?: string;
  correctionPlan?: string;
}

export interface ProjectBudget {
  projectId: string;
  totalBudget: number;
  approvedBudget: number;
  spentAmount: number;
  commitments: number;
  availableBudget: number;
  contingencyBudget: number;
  categories: BudgetItem[];
  variances: BudgetVariance[];
  cashFlow: CashFlowEntry[];
  forecasts: BudgetForecast[];
  lastUpdated: string;
}

export interface CashFlowEntry {
  id: string;
  projectId: string;
  date: string;
  type: 'planned_expense' | 'actual_expense' | 'planned_income' | 'actual_income';
  amount: number;
  description: string;
  categoryId: string;
  status: 'planned' | 'committed' | 'paid';
}

export interface BudgetForecast {
  id: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
  forecastedSpend: number;
  forecastedIncome: number;
  projectedCompletion: number;
  riskAdjustment: number;
  confidence: 'low' | 'medium' | 'high';
  assumptions: string[];
  createdAt: string;
}

export interface BudgetAlert {
  id: string;
  projectId: string;
  type: 'budget_exceeded' | 'variance_threshold' | 'cash_flow_risk' | 'approval_required';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  threshold?: number;
  currentValue?: number;
  recommendedAction?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface BudgetReport {
  projectId: string;
  reportDate: string;
  budget: ProjectBudget;
  summary: {
    totalBudget: number;
    spentAmount: number;
    remainingBudget: number;
    spentPercentage: number;
    projectedOverrun: number;
    estimatedCompletionCost: number;
  };
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    budgeted: number;
    spent: number;
    variance: number;
    variancePercent: number;
  }>;
  topExpenses: CostEntry[];
  alerts: BudgetAlert[];
  recommendations: string[];
  trends: {
    monthlySpend: Array<{ month: string; amount: number }>;
    categoryTrends: Array<{ category: string; trend: 'increasing' | 'decreasing' | 'stable' }>;
  };
}

export class ProjectBudgetService {
  private static readonly BUDGET_STORAGE_KEY = 'bauplan-buddy-project-budgets';
  private static readonly COST_ENTRIES_KEY = 'bauplan-buddy-cost-entries';
  private static readonly BUDGET_CATEGORIES_KEY = 'bauplan-buddy-budget-categories';
  private static readonly BUDGET_ALERTS_KEY = 'bauplan-buddy-budget-alerts';

  /**
   * Initialize default budget categories
   */
  static initialize(): void {
    if (!this.getStoredCategories().length) {
      this.createDefaultCategories();
    }
  }

  /**
   * Create or update project budget
   */
  static createProjectBudget(
    projectId: string,
    totalBudget: number,
    categories: Omit<BudgetItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]
  ): ProjectBudget {
    try {
      const budgetItems: BudgetItem[] = categories.map(cat => ({
        ...cat,
        id: this.generateId(),
        projectId,
        actualCost: 0,
        remainingBudget: cat.estimatedCost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      const budget: ProjectBudget = {
        projectId,
        totalBudget,
        approvedBudget: totalBudget,
        spentAmount: 0,
        commitments: 0,
        availableBudget: totalBudget,
        contingencyBudget: totalBudget * 0.1, // 10% contingency
        categories: budgetItems,
        variances: [],
        cashFlow: [],
        forecasts: [],
        lastUpdated: new Date().toISOString()
      };

      this.saveProjectBudget(budget);

      ErrorHandlingService.info(
        `Project budget created: ${totalBudget} EUR`,
        'budget_management',
        { projectId, totalBudget }
      );

      return budget;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to create project budget',
        error as Error,
        'budget_management'
      );
      throw error;
    }
  }

  /**
   * Add cost entry
   */
  static addCostEntry(costEntry: Omit<CostEntry, 'id' | 'createdAt'>): CostEntry {
    try {
      const entry: CostEntry = {
        ...costEntry,
        id: this.generateId(),
        createdAt: new Date().toISOString()
      };

      const entries = this.getStoredCostEntries();
      entries.push(entry);
      this.saveCostEntries(entries);

      // Update budget calculations
      this.updateBudgetFromCostEntry(entry);

      // Check for budget alerts
      this.checkBudgetAlerts(entry.projectId);

      ErrorHandlingService.info(
        `Cost entry added: ${entry.amount} ${entry.currency}`,
        'budget_management',
        { projectId: entry.projectId, amount: entry.amount, type: entry.type }
      );

      return entry;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to add cost entry',
        error as Error,
        'budget_management'
      );
      throw error;
    }
  }

  /**
   * Update budget item
   */
  static updateBudgetItem(
    projectId: string,
    budgetItemId: string,
    updates: Partial<BudgetItem>
  ): BudgetItem | null {
    try {
      const budget = this.getProjectBudget(projectId);
      if (!budget) throw new Error('Project budget not found');

      const itemIndex = budget.categories.findIndex(item => item.id === budgetItemId);
      if (itemIndex === -1) throw new Error('Budget item not found');

      budget.categories[itemIndex] = {
        ...budget.categories[itemIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Recalculate budget totals
      this.recalculateBudgetTotals(budget);
      this.saveProjectBudget(budget);

      return budget.categories[itemIndex];
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to update budget item',
        error as Error,
        'budget_management'
      );
      throw error;
    }
  }

  /**
   * Calculate budget variance
   */
  static calculateBudgetVariance(projectId: string): BudgetVariance[] {
    try {
      const budget = this.getProjectBudget(projectId);
      if (!budget) return [];

      const variances: BudgetVariance[] = budget.categories.map(item => {
        const variance = item.actualCost - item.estimatedCost;
        const variancePercent = item.estimatedCost > 0 
          ? (variance / item.estimatedCost) * 100 
          : 0;

        let status: BudgetVariance['status'] = 'on_budget';
        if (variancePercent > 20) status = 'critical_overrun';
        else if (variancePercent > 10) status = 'over_budget';
        else if (variancePercent < -5) status = 'under_budget';

        return {
          budgetItemId: item.id,
          estimatedCost: item.estimatedCost,
          actualCost: item.actualCost,
          variance,
          variancePercent,
          status
        };
      });

      // Update budget with new variances
      budget.variances = variances;
      budget.lastUpdated = new Date().toISOString();
      this.saveProjectBudget(budget);

      return variances;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to calculate budget variance',
        error as Error,
        'budget_management'
      );
      return [];
    }
  }

  /**
   * Generate budget forecast
   */
  static generateBudgetForecast(
    projectId: string,
    forecastPeriodMonths: number = 6
  ): BudgetForecast {
    try {
      const budget = this.getProjectBudget(projectId);
      const costEntries = this.getProjectCostEntries(projectId);

      if (!budget) throw new Error('Project budget not found');

      // Calculate spending velocity
      const recentEntries = costEntries.filter(entry => 
        new Date(entry.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      );

      const averageMonthlySpend = recentEntries.reduce((sum, entry) => sum + entry.amount, 0) / 3;
      const forecastedSpend = averageMonthlySpend * forecastPeriodMonths;

      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + forecastPeriodMonths);

      const forecast: BudgetForecast = {
        id: this.generateId(),
        projectId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        forecastedSpend,
        forecastedIncome: 0, // Would be calculated from project income
        projectedCompletion: budget.spentAmount + forecastedSpend,
        riskAdjustment: forecastedSpend * 0.15, // 15% risk buffer
        confidence: recentEntries.length > 10 ? 'high' : recentEntries.length > 5 ? 'medium' : 'low',
        assumptions: [
          'Basiert auf durchschnittlichen Ausgaben der letzten 90 Tage',
          'Berücksichtigt 15% Risikopuffer',
          'Saisonale Schwankungen nicht berücksichtigt'
        ],
        createdAt: new Date().toISOString()
      };

      // Update budget with new forecast
      budget.forecasts.push(forecast);
      this.saveProjectBudget(budget);

      return forecast;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to generate budget forecast',
        error as Error,
        'budget_management'
      );
      throw error;
    }
  }

  /**
   * Generate comprehensive budget report
   */
  static generateBudgetReport(projectId: string): BudgetReport {
    try {
      const budget = this.getProjectBudget(projectId);
      const costEntries = this.getProjectCostEntries(projectId);
      const alerts = this.getProjectBudgetAlerts(projectId);

      if (!budget) throw new Error('Project budget not found');

      const spentPercentage = budget.totalBudget > 0 
        ? (budget.spentAmount / budget.totalBudget) * 100 
        : 0;

      const projectedOverrun = Math.max(0, budget.spentAmount - budget.totalBudget);
      
      // Calculate category breakdown
      const categories = this.getStoredCategories();
      const categoryBreakdown = budget.categories.map(item => {
        const category = categories.find(c => c.id === item.categoryId);
        const variance = item.actualCost - item.estimatedCost;
        const variancePercent = item.estimatedCost > 0 
          ? (variance / item.estimatedCost) * 100 
          : 0;

        return {
          categoryId: item.categoryId,
          categoryName: category?.name || 'Unknown',
          budgeted: item.estimatedCost,
          spent: item.actualCost,
          variance,
          variancePercent
        };
      });

      // Get top expenses
      const topExpenses = costEntries
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Calculate monthly trends
      const monthlySpend = this.calculateMonthlySpendTrends(costEntries);

      const report: BudgetReport = {
        projectId,
        reportDate: new Date().toISOString(),
        budget,
        summary: {
          totalBudget: budget.totalBudget,
          spentAmount: budget.spentAmount,
          remainingBudget: budget.availableBudget,
          spentPercentage,
          projectedOverrun,
          estimatedCompletionCost: budget.spentAmount + (budget.totalBudget - budget.spentAmount)
        },
        categoryBreakdown,
        topExpenses,
        alerts: alerts.filter(alert => !alert.acknowledged),
        recommendations: this.generateBudgetRecommendations(budget, spentPercentage),
        trends: {
          monthlySpend,
          categoryTrends: this.calculateCategoryTrends(costEntries)
        }
      };

      return report;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to generate budget report',
        error as Error,
        'budget_management'
      );
      throw error;
    }
  }

  /**
   * Get project budget
   */
  static getProjectBudget(projectId: string): ProjectBudget | null {
    try {
      const budgets = this.getStoredBudgets();
      return budgets.find(b => b.projectId === projectId) || null;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to get project budget',
        error as Error,
        'budget_management'
      );
      return null;
    }
  }

  /**
   * Get project cost entries
   */
  static getProjectCostEntries(projectId: string): CostEntry[] {
    try {
      const entries = this.getStoredCostEntries();
      return entries.filter(entry => entry.projectId === projectId);
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to get project cost entries',
        error as Error,
        'budget_management'
      );
      return [];
    }
  }

  // Private helper methods

  private static updateBudgetFromCostEntry(entry: CostEntry): void {
    const budget = this.getProjectBudget(entry.projectId);
    if (!budget) return;

    // Update spent amount
    budget.spentAmount += entry.amount;
    budget.availableBudget = budget.totalBudget - budget.spentAmount;

    // Update specific budget item if linked
    if (entry.budgetItemId) {
      const item = budget.categories.find(cat => cat.id === entry.budgetItemId);
      if (item) {
        item.actualCost += entry.amount;
        item.remainingBudget = item.estimatedCost - item.actualCost;
        
        // Update status based on spending
        if (item.actualCost > item.estimatedCost * 1.1) {
          item.status = 'overbudget';
        } else if (item.actualCost > item.estimatedCost * 0.9) {
          item.status = 'in_progress';
        }
      }
    }

    budget.lastUpdated = new Date().toISOString();
    this.saveProjectBudget(budget);
  }

  private static checkBudgetAlerts(projectId: string): void {
    const budget = this.getProjectBudget(projectId);
    if (!budget) return;

    const alerts: BudgetAlert[] = [];

    // Check total budget threshold
    const spentPercentage = (budget.spentAmount / budget.totalBudget) * 100;
    if (spentPercentage > 90) {
      alerts.push({
        id: this.generateId(),
        projectId,
        type: 'budget_exceeded',
        severity: 'critical',
        title: 'Budget-Warnung',
        message: `Projekt hat ${spentPercentage.toFixed(1)}% des Budgets verbraucht`,
        threshold: 90,
        currentValue: spentPercentage,
        recommendedAction: 'Sofortige Budgetüberprüfung und Kostenkontrolle erforderlich',
        acknowledged: false,
        createdAt: new Date().toISOString()
      });
    }

    // Check category variances
    budget.categories.forEach(item => {
      const variancePercent = item.estimatedCost > 0 
        ? ((item.actualCost - item.estimatedCost) / item.estimatedCost) * 100 
        : 0;

      if (variancePercent > 15) {
        alerts.push({
          id: this.generateId(),
          projectId,
          type: 'variance_threshold',
          severity: variancePercent > 25 ? 'critical' : 'warning',
          title: 'Kategorieüberschreitung',
          message: `${item.name} überschreitet Budget um ${variancePercent.toFixed(1)}%`,
          threshold: 15,
          currentValue: variancePercent,
          acknowledged: false,
          createdAt: new Date().toISOString()
        });
      }
    });

    if (alerts.length > 0) {
      const existingAlerts = this.getStoredBudgetAlerts();
      existingAlerts.push(...alerts);
      this.saveBudgetAlerts(existingAlerts);
    }
  }

  private static recalculateBudgetTotals(budget: ProjectBudget): void {
    budget.totalBudget = budget.categories.reduce((sum, item) => sum + item.estimatedCost, 0);
    budget.spentAmount = budget.categories.reduce((sum, item) => sum + item.actualCost, 0);
    budget.availableBudget = budget.totalBudget - budget.spentAmount;
    budget.lastUpdated = new Date().toISOString();
  }

  private static calculateMonthlySpendTrends(entries: CostEntry[]): Array<{ month: string; amount: number }> {
    const monthlyData = new Map<string, number>();
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + entry.amount);
    });

    return Array.from(monthlyData.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private static calculateCategoryTrends(entries: CostEntry[]): Array<{ category: string; trend: 'increasing' | 'decreasing' | 'stable' }> {
    // Simplified trend calculation - would need more sophisticated analysis
    return [
      { category: 'material', trend: 'increasing' },
      { category: 'labor', trend: 'stable' },
      { category: 'equipment', trend: 'decreasing' }
    ];
  }

  private static generateBudgetRecommendations(budget: ProjectBudget, spentPercentage: number): string[] {
    const recommendations: string[] = [];

    if (spentPercentage > 80) {
      recommendations.push('Budget-Überwachung verstärken - kritischer Bereich erreicht');
    }

    if (spentPercentage > 50) {
      recommendations.push('Regelmäßige Kostenkontrolle und Ausgabenfreigabe implementieren');
    }

    const overbudgetCategories = budget.categories.filter(item => 
      item.actualCost > item.estimatedCost * 1.1
    );

    if (overbudgetCategories.length > 0) {
      recommendations.push(`${overbudgetCategories.length} Kategorien überschreiten Budget - Analyse erforderlich`);
    }

    if (budget.availableBudget < budget.contingencyBudget) {
      recommendations.push('Verfügbares Budget unter Notreserve - zusätzliche Mittel beantragen');
    }

    return recommendations;
  }

  private static getProjectBudgetAlerts(projectId: string): BudgetAlert[] {
    const alerts = this.getStoredBudgetAlerts();
    return alerts.filter(alert => alert.projectId === projectId);
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static createDefaultCategories(): void {
    const categories: BudgetCategory[] = [
      {
        id: 'cat-steel-materials',
        name: 'Stahlmaterialien',
        description: 'Stahlträger, Bleche, Profile, Rohre',
        color: '#3B82F6',
        isSystemCategory: true
      },
      {
        id: 'cat-fabrication-labor',
        name: 'Fertigungskosten',
        description: 'Schweißer, Schlosser, Fertigungspersonal',
        color: '#10B981',
        isSystemCategory: true
      },
      {
        id: 'cat-welding-consumables',
        name: 'Schweißzusätze',
        description: 'Elektroden, Draht, Gase, Flussmittel',
        color: '#F59E0B',
        isSystemCategory: true
      },
      {
        id: 'cat-surface-treatment',
        name: 'Oberflächenbehandlung',
        description: 'Sandstrahlen, Grundierung, Lackierung, Verzinkung',
        color: '#8B5CF6',
        isSystemCategory: true
      },
      {
        id: 'cat-machining-equipment',
        name: 'Bearbeitungsmaschinen',
        description: 'CNC-Maschinen, Schweißgeräte, Krane, Werkzeuge',
        color: '#EF4444',
        isSystemCategory: true
      },
      {
        id: 'cat-assembly-installation',
        name: 'Montage & Installation',
        description: 'Montagekosten, Transport, Installation vor Ort',
        color: '#06B6D4',
        isSystemCategory: true
      },
      {
        id: 'cat-quality-testing',
        name: 'Prüfung & Qualität',
        description: 'Schweißnahtprüfung, Materialprüfung, Zertifizierung',
        color: '#84CC16',
        isSystemCategory: true
      },
      {
        id: 'cat-engineering',
        name: 'Konstruktion & Planung',
        description: 'CAD-Konstruktion, Statik, Werkstattzeichnungen',
        color: '#A855F7',
        isSystemCategory: true
      },
      {
        id: 'cat-subcontractor',
        name: 'Subunternehmer',
        description: 'Externe Dienstleister (Galvanik, Sandstrahlung)',
        color: '#F97316',
        isSystemCategory: true
      },
      {
        id: 'cat-other',
        name: 'Sonstiges',
        description: 'Sonstige Projektkosten',
        color: '#6B7280',
        isSystemCategory: true
      }
    ];

    this.saveCategories(categories);
  }

  private static saveProjectBudget(budget: ProjectBudget): void {
    const budgets = this.getStoredBudgets().filter(b => b.projectId !== budget.projectId);
    budgets.push(budget);
    localStorage.setItem(this.BUDGET_STORAGE_KEY, JSON.stringify(budgets));
  }

  private static getStoredBudgets(): ProjectBudget[] {
    try {
      const data = localStorage.getItem(this.BUDGET_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveCostEntries(entries: CostEntry[]): void {
    localStorage.setItem(this.COST_ENTRIES_KEY, JSON.stringify(entries));
  }

  private static getStoredCostEntries(): CostEntry[] {
    try {
      const data = localStorage.getItem(this.COST_ENTRIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveCategories(categories: BudgetCategory[]): void {
    localStorage.setItem(this.BUDGET_CATEGORIES_KEY, JSON.stringify(categories));
  }

  private static getStoredCategories(): BudgetCategory[] {
    try {
      const data = localStorage.getItem(this.BUDGET_CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveBudgetAlerts(alerts: BudgetAlert[]): void {
    localStorage.setItem(this.BUDGET_ALERTS_KEY, JSON.stringify(alerts));
  }

  private static getStoredBudgetAlerts(): BudgetAlert[] {
    try {
      const data = localStorage.getItem(this.BUDGET_ALERTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  ProjectBudgetService.initialize();
}