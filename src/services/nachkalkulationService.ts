import { ErrorHandlingService } from './errorHandlingService';
import { ProjectBudgetService, ProjectBudget, CostEntry, BudgetItem } from './projectBudgetService';
import { Project } from './projectTemplateService';

/**
 * Nachkalkulation (Post-Calculation) Service
 * Provides comprehensive analysis of actual vs planned costs after project completion
 */

export interface NachkalkulationData {
  projectId: string;
  projectName: string;
  status: 'draft' | 'in_progress' | 'final' | 'approved';
  calculationDate: string;
  calculatedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  
  // Basic project information
  projectInfo: {
    startDate: string;
    endDate: string;
    actualStartDate?: string;
    actualEndDate?: string;
    duration: {
      planned: number; // days
      actual: number;  // days
      variance: number; // days
    };
    progress: number; // percentage
  };

  // Financial overview
  financial: {
    plannedRevenue: number;
    actualRevenue: number;
    revenueVariance: number;
    
    plannedCosts: number;
    actualCosts: number;
    costVariance: number;
    
    plannedProfit: number;
    actualProfit: number;
    profitVariance: number;
    
    profitMargin: {
      planned: number;  // percentage
      actual: number;   // percentage
      variance: number; // percentage points
    };
    
    roi: {
      planned: number;  // percentage
      actual: number;   // percentage
      variance: number; // percentage points
    };
  };

  // Detailed cost analysis
  costAnalysis: {
    categories: CategoryAnalysis[];
    topVariances: VarianceAnalysis[];
    costDrivers: CostDriver[];
    timeline: TimelineAnalysis[];
  };

  // Performance metrics
  performance: {
    costPerformanceIndex: number; // CPI = Earned Value / Actual Cost
    schedulePerformanceIndex: number; // SPI = Earned Value / Planned Value
    efficiency: {
      laborEfficiency: number;     // planned hours / actual hours
      materialUtilization: number; // percentage
      equipmentUtilization: number; // percentage
    };
  };

  // Risk analysis
  riskAnalysis: {
    budgetOverruns: RiskItem[];
    scheduleDelays: RiskItem[];
    qualityIssues: RiskItem[];
    recommendations: string[];
  };

  // Lessons learned
  lessonsLearned: {
    successes: string[];
    challenges: string[];
    improvements: string[];
    futureRecommendations: string[];
  };

  createdAt: string;
  updatedAt: string;
}

export interface CategoryAnalysis {
  categoryId: string;
  categoryName: string;
  
  planned: {
    cost: number;
    percentage: number; // of total budget
  };
  
  actual: {
    cost: number;
    percentage: number; // of total actual costs
  };
  
  variance: {
    absolute: number;   // actual - planned
    percentage: number; // (actual - planned) / planned * 100
  };
  
  status: 'under_budget' | 'on_budget' | 'over_budget' | 'critical';
  impact: 'low' | 'medium' | 'high' | 'critical';
  
  details: {
    plannedQuantity?: number;
    actualQuantity?: number;
    unitCostVariance?: number;
    quantityVariance?: number;
  };
}

export interface VarianceAnalysis {
  itemId: string;
  itemName: string;
  categoryId: string;
  categoryName: string;
  
  plannedCost: number;
  actualCost: number;
  variance: number;
  variancePercent: number;
  
  causes: string[];
  impact: string;
  preventiveMeasures: string[];
}

export interface CostDriver {
  id: string;
  name: string;
  category: string;
  impact: number;        // absolute cost impact
  impactPercent: number; // percentage of total variance
  frequency: number;     // how often this driver occurred
  controllable: boolean; // whether this was controllable
  description: string;
}

export interface TimelineAnalysis {
  period: string; // month/quarter
  plannedCosts: number;
  actualCosts: number;
  cumulativePlanned: number;
  cumulativeActual: number;
  variance: number;
  events: string[]; // significant events in this period
}

export interface RiskItem {
  id: string;
  type: 'cost' | 'schedule' | 'quality' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation: string;
  preventiveMeasures: string[];
}

export interface NachkalkulationReport {
  data: NachkalkulationData;
  charts: {
    costComparison: ChartData;
    varianceAnalysis: ChartData;
    timelineAnalysis: ChartData;
    categoryBreakdown: ChartData;
  };
  exportOptions: {
    pdf: boolean;
    excel: boolean;
    csv: boolean;
  };
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  data: Record<string, unknown>[];
  labels: string[];
  colors: string[];
}

export class NachkalkulationService {
  private static readonly NACHKALKULATION_KEY = 'bauplan-buddy-nachkalkulation';
  private static readonly TEMPLATES_KEY = 'bauplan-buddy-nachkalkulation-templates';

  /**
   * Generate comprehensive Nachkalkulation for a project
   */
  static generateNachkalkulation(
    projectId: string,
    projectData: Project,
    calculatedBy: string
  ): NachkalkulationData {
    try {
      const budget = ProjectBudgetService.getProjectBudget(projectId);
      const costEntries = ProjectBudgetService.getProjectCostEntries(projectId);
      
      if (!budget) {
        throw new Error(`No budget found for project ${projectId}`);
      }

      const nachkalkulation: NachkalkulationData = {
        projectId,
        projectName: projectData.name,
        status: projectData.status === 'completed' ? 'final' : 'in_progress',
        calculationDate: new Date().toISOString(),
        calculatedBy,
        
        projectInfo: this.calculateProjectInfo(projectData),
        financial: this.calculateFinancialAnalysis(projectData, budget, costEntries),
        costAnalysis: this.calculateCostAnalysis(budget, costEntries),
        performance: this.calculatePerformanceMetrics(projectData, budget, costEntries),
        riskAnalysis: this.calculateRiskAnalysis(budget, costEntries, projectData),
        lessonsLearned: this.generateLessonsLearned(projectData, budget, costEntries),
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.saveNachkalkulation(nachkalkulation);
      
      ErrorHandlingService.info(
        `Nachkalkulation generated for project: ${projectData.name}`,
        'nachkalkulation',
        { projectId, status: nachkalkulation.status }
      );

      return nachkalkulation;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to generate Nachkalkulation',
        error as Error,
        'nachkalkulation'
      );
      throw error;
    }
  }

  /**
   * Get Nachkalkulation by project ID
   */
  static getNachkalkulation(projectId: string): NachkalkulationData | null {
    try {
      const data = this.getStoredNachkalkulationen();
      return data.find(n => n.projectId === projectId) || null;
    } catch {
      return null;
    }
  }

  /**
   * Get all Nachkalkulationen
   */
  static getAllNachkalkulationen(): NachkalkulationData[] {
    return this.getStoredNachkalkulationen();
  }

  /**
   * Update Nachkalkulation
   */
  static updateNachkalkulation(
    projectId: string,
    updates: Partial<NachkalkulationData>
  ): NachkalkulationData | null {
    try {
      const data = this.getStoredNachkalkulationen();
      const index = data.findIndex(n => n.projectId === projectId);
      
      if (index === -1) return null;

      data[index] = {
        ...data[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.saveNachkalkulationen(data);
      return data[index];
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to update Nachkalkulation',
        error as Error,
        'nachkalkulation'
      );
      throw error;
    }
  }

  /**
   * Delete Nachkalkulation
   */
  static deleteNachkalkulation(projectId: string): boolean {
    try {
      const data = this.getStoredNachkalkulationen();
      const filtered = data.filter(n => n.projectId !== projectId);
      
      if (filtered.length === data.length) return false;
      
      this.saveNachkalkulationen(filtered);
      return true;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to delete Nachkalkulation',
        error as Error,
        'nachkalkulation'
      );
      return false;
    }
  }

  /**
   * Generate comprehensive report
   */
  static generateReport(projectId: string): NachkalkulationReport | null {
    const data = this.getNachkalkulation(projectId);
    if (!data) return null;

    return {
      data,
      charts: this.generateChartData(data),
      exportOptions: {
        pdf: true,
        excel: true,
        csv: true
      }
    };
  }

  /**
   * Calculate project information analysis
   */
  private static calculateProjectInfo(project: Project) {
    const plannedStart = new Date(project.startDate);
    const plannedEnd = new Date(project.endDate);
    const actualStart = project.actualStartDate ? new Date(project.actualStartDate) : plannedStart;
    const actualEnd = project.actualEndDate ? new Date(project.actualEndDate) : new Date();
    
    const plannedDuration = Math.ceil((plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 60 * 60 * 24));
    const actualDuration = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      startDate: project.startDate,
      endDate: project.endDate,
      actualStartDate: project.actualStartDate,
      actualEndDate: project.actualEndDate,
      duration: {
        planned: plannedDuration,
        actual: actualDuration,
        variance: actualDuration - plannedDuration
      },
      progress: project.progress
    };
  }

  /**
   * Calculate financial analysis
   */
  private static calculateFinancialAnalysis(
    project: Project,
    budget: ProjectBudget,
    costEntries: CostEntry[]
  ) {
    const actualCosts = costEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const plannedCosts = budget.totalBudget;
    const actualRevenue = project.invoicedAmount || 0;
    const plannedRevenue = project.budget || 0;
    
    const plannedProfit = plannedRevenue - plannedCosts;
    const actualProfit = actualRevenue - actualCosts;
    
    return {
      plannedRevenue,
      actualRevenue,
      revenueVariance: actualRevenue - plannedRevenue,
      
      plannedCosts,
      actualCosts,
      costVariance: actualCosts - plannedCosts,
      
      plannedProfit,
      actualProfit,
      profitVariance: actualProfit - plannedProfit,
      
      profitMargin: {
        planned: plannedRevenue > 0 ? (plannedProfit / plannedRevenue) * 100 : 0,
        actual: actualRevenue > 0 ? (actualProfit / actualRevenue) * 100 : 0,
        variance: 0 // calculated below
      },
      
      roi: {
        planned: plannedCosts > 0 ? (plannedProfit / plannedCosts) * 100 : 0,
        actual: actualCosts > 0 ? (actualProfit / actualCosts) * 100 : 0,
        variance: 0 // calculated below
      }
    };
  }

  /**
   * Calculate cost analysis
   */
  private static calculateCostAnalysis(budget: ProjectBudget, costEntries: CostEntry[]) {
    const categories = this.analyzeCategoryCosts(budget, costEntries);
    const topVariances = this.identifyTopVariances(budget, costEntries);
    const costDrivers = this.analyzeCostDrivers(costEntries);
    const timeline = this.analyzeTimeline(costEntries);
    
    return {
      categories,
      topVariances,
      costDrivers,
      timeline
    };
  }

  /**
   * Calculate performance metrics
   */
  private static calculatePerformanceMetrics(
    project: Project,
    budget: ProjectBudget,
    costEntries: CostEntry[]
  ) {
    const actualCosts = costEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const earnedValue = (project.progress / 100) * budget.totalBudget;
    
    return {
      costPerformanceIndex: actualCosts > 0 ? earnedValue / actualCosts : 1,
      schedulePerformanceIndex: budget.totalBudget > 0 ? earnedValue / budget.totalBudget : 1,
      efficiency: {
        laborEfficiency: this.calculateLaborEfficiency(costEntries),
        materialUtilization: this.calculateMaterialUtilization(costEntries),
        equipmentUtilization: this.calculateEquipmentUtilization(costEntries)
      }
    };
  }

  /**
   * Calculate risk analysis
   */
  private static calculateRiskAnalysis(
    budget: ProjectBudget,
    costEntries: CostEntry[],
    project: Project
  ) {
    return {
      budgetOverruns: this.identifyBudgetOverruns(budget, costEntries),
      scheduleDelays: this.identifyScheduleDelays(project),
      qualityIssues: this.identifyQualityIssues(project),
      recommendations: this.generateRecommendations(budget, costEntries, project)
    };
  }

  /**
   * Generate lessons learned
   */
  private static generateLessonsLearned(
    project: Project,
    budget: ProjectBudget,
    costEntries: CostEntry[]
  ) {
    const actualCosts = costEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const costVariance = actualCosts - budget.totalBudget;
    const costVariancePercent = budget.totalBudget > 0 ? (costVariance / budget.totalBudget) * 100 : 0;
    
    const successes: string[] = [];
    const challenges: string[] = [];
    const improvements: string[] = [];
    const futureRecommendations: string[] = [];
    
    // Analyze performance and generate lessons
    if (costVariancePercent <= 5) {
      successes.push('Sehr gute Kostenkontrolle innerhalb von 5% der Planung');
    } else if (costVariancePercent > 20) {
      challenges.push('Erhebliche Kostenüberschreitung - Budgetplanung überarbeiten');
      improvements.push('Detailliertere Kostenschätzung in der Planungsphase');
      futureRecommendations.push('Implementierung regelmäßiger Kostenreviews');
    }
    
    if (project.progress === 100) {
      successes.push('Projekt erfolgreich abgeschlossen');
    } else if (project.progress < 80) {
      challenges.push('Projektfortschritt hinter dem Plan');
      improvements.push('Verbesserte Projektfortschrittsverfolgung erforderlich');
    }
    
    return {
      successes,
      challenges,
      improvements,
      futureRecommendations
    };
  }

  /**
   * Generate chart data for visualization
   */
  private static generateChartData(data: NachkalkulationData) {
    return {
      costComparison: {
        type: 'bar' as const,
        data: [
          { category: 'Geplant', value: data.financial.plannedCosts },
          { category: 'Tatsächlich', value: data.financial.actualCosts }
        ],
        labels: ['Geplant', 'Tatsächlich'],
        colors: ['#3b82f6', '#ef4444']
      },
      varianceAnalysis: {
        type: 'bar' as const,
        data: data.costAnalysis.categories.map(cat => ({
          category: cat.categoryName,
          variance: cat.variance.percentage
        })),
        labels: data.costAnalysis.categories.map(cat => cat.categoryName),
        colors: data.costAnalysis.categories.map(cat => 
          cat.variance.percentage > 0 ? '#ef4444' : '#10b981'
        )
      },
      timelineAnalysis: {
        type: 'line' as const,
        data: data.costAnalysis.timeline.map(t => ({
          period: t.period,
          planned: t.cumulativePlanned,
          actual: t.cumulativeActual
        })),
        labels: data.costAnalysis.timeline.map(t => t.period),
        colors: ['#3b82f6', '#ef4444']
      },
      categoryBreakdown: {
        type: 'pie' as const,
        data: data.costAnalysis.categories.map(cat => ({
          name: cat.categoryName,
          value: cat.actual.cost
        })),
        labels: data.costAnalysis.categories.map(cat => cat.categoryName),
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280']
      }
    };
  }
  
  private static getStoredNachkalkulationen(): NachkalkulationData[] {
    try {
      const data = localStorage.getItem(this.NACHKALKULATION_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveNachkalkulation(nachkalkulation: NachkalkulationData): void {
    const data = this.getStoredNachkalkulationen();
    const existingIndex = data.findIndex(n => n.projectId === nachkalkulation.projectId);
    
    if (existingIndex >= 0) {
      data[existingIndex] = nachkalkulation;
    } else {
      data.push(nachkalkulation);
    }
    
    this.saveNachkalkulationen(data);
  }

  private static saveNachkalkulationen(data: NachkalkulationData[]): void {
    localStorage.setItem(this.NACHKALKULATION_KEY, JSON.stringify(data));
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper methods for detailed analysis
  private static analyzeCategoryCosts(budget: ProjectBudget, costEntries: CostEntry[]): CategoryAnalysis[] {
    return budget.categories.map(budgetItem => {
      const actualCost = costEntries
        .filter(entry => entry.categoryId === budgetItem.categoryId)
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      const variance = actualCost - budgetItem.estimatedCost;
      const variancePercent = budgetItem.estimatedCost > 0 ? 
        (variance / budgetItem.estimatedCost) * 100 : 0;
      
      let status: 'under_budget' | 'on_budget' | 'over_budget' | 'critical';
      if (variancePercent <= -5) status = 'under_budget';
      else if (variancePercent <= 5) status = 'on_budget';
      else if (variancePercent <= 20) status = 'over_budget';
      else status = 'critical';
      
      return {
        categoryId: budgetItem.categoryId,
        categoryName: budgetItem.name,
        planned: {
          cost: budgetItem.estimatedCost,
          percentage: budget.totalBudget > 0 ? (budgetItem.estimatedCost / budget.totalBudget) * 100 : 0
        },
        actual: {
          cost: actualCost,
          percentage: budget.spentAmount > 0 ? (actualCost / budget.spentAmount) * 100 : 0
        },
        variance: {
          absolute: variance,
          percentage: variancePercent
        },
        status,
        impact: Math.abs(variancePercent) > 20 ? 'critical' : 
               Math.abs(variancePercent) > 10 ? 'high' : 
               Math.abs(variancePercent) > 5 ? 'medium' : 'low',
        details: {
          plannedQuantity: undefined,
          actualQuantity: undefined,
          unitCostVariance: undefined,
          quantityVariance: undefined
        }
      };
    });
  }

  private static identifyTopVariances(budget: ProjectBudget, costEntries: CostEntry[]): VarianceAnalysis[] {
    const variances = budget.categories.map(budgetItem => {
      const actualCost = costEntries
        .filter(entry => entry.categoryId === budgetItem.categoryId)
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      const variance = actualCost - budgetItem.estimatedCost;
      const variancePercent = budgetItem.estimatedCost > 0 ? 
        Math.abs(variance / budgetItem.estimatedCost) * 100 : 0;
      
      return {
        itemId: budgetItem.id,
        itemName: budgetItem.name,
        categoryId: budgetItem.categoryId,
        categoryName: budgetItem.name,
        plannedCost: budgetItem.estimatedCost,
        actualCost,
        variance,
        variancePercent,
        causes: this.identifyVarianceCauses(variance, budgetItem.categoryId),
        impact: this.assessVarianceImpact(variance, budgetItem.estimatedCost),
        preventiveMeasures: this.suggestPreventiveMeasures(budgetItem.categoryId, variance)
      };
    });
    
    return variances
      .sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))
      .slice(0, 10);
  }

  private static analyzeCostDrivers(costEntries: CostEntry[]): CostDriver[] {
    const drivers: CostDriver[] = [];
    const totalVariance = costEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    // Group by type and analyze
    const typeGroups = costEntries.reduce((groups, entry) => {
      if (!groups[entry.type]) groups[entry.type] = [];
      groups[entry.type].push(entry);
      return groups;
    }, {} as Record<string, CostEntry[]>);
    
    Object.entries(typeGroups).forEach(([type, entries]) => {
      const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
      
      drivers.push({
        id: this.generateId(),
        name: this.getTypeDisplayName(type),
        category: type,
        impact: totalAmount,
        impactPercent: totalVariance > 0 ? (totalAmount / totalVariance) * 100 : 0,
        frequency: entries.length,
        controllable: this.isTypeControllable(type),
        description: `${entries.length} Positionen in Kategorie ${this.getTypeDisplayName(type)}`
      });
    });
    
    return drivers.sort((a, b) => b.impact - a.impact);
  }

  private static analyzeTimeline(costEntries: CostEntry[]): TimelineAnalysis[] {
    const monthlyData = new Map<string, { actual: number; entries: CostEntry[] }>();
    
    costEntries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { actual: 0, entries: [] });
      }
      
      const data = monthlyData.get(monthKey)!;
      data.actual += entry.amount;
      data.entries.push(entry);
    });
    
    let cumulativeActual = 0;
    let cumulativePlanned = 0;
    
    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        cumulativeActual += data.actual;
        cumulativePlanned += data.actual; // Simplified - would need planned timeline
        
        return {
          period: month,
          plannedCosts: data.actual, // Simplified
          actualCosts: data.actual,
          cumulativePlanned,
          cumulativeActual,
          variance: data.actual - data.actual, // Simplified
          events: this.extractSignificantEvents(data.entries)
        };
      });
  }

  private static calculateLaborEfficiency(costEntries: CostEntry[]): number {
    const laborEntries = costEntries.filter(entry => entry.type === 'fabrication_labor');
    // Simplified calculation - would need actual vs planned hours
    return laborEntries.length > 0 ? 85 : 100; // Default values
  }

  private static calculateMaterialUtilization(costEntries: CostEntry[]): number {
    const materialEntries = costEntries.filter(entry => entry.type === 'steel_material');
    // Simplified calculation - would need waste/usage data
    return materialEntries.length > 0 ? 92 : 100; // Default values
  }

  private static calculateEquipmentUtilization(costEntries: CostEntry[]): number {
    const equipmentEntries = costEntries.filter(entry => entry.type === 'machining_equipment');
    // Simplified calculation - would need usage time data
    return equipmentEntries.length > 0 ? 78 : 100; // Default values
  }

  private static identifyBudgetOverruns(budget: ProjectBudget, costEntries: CostEntry[]): RiskItem[] {
    const risks: RiskItem[] = [];
    const totalActual = costEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const overrunPercent = budget.totalBudget > 0 ? 
      ((totalActual - budget.totalBudget) / budget.totalBudget) * 100 : 0;
    
    if (overrunPercent > 10) {
      risks.push({
        id: this.generateId(),
        type: 'cost',
        severity: overrunPercent > 25 ? 'critical' : overrunPercent > 15 ? 'high' : 'medium',
        description: `Budgetüberschreitung von ${overrunPercent.toFixed(1)}%`,
        impact: `Zusätzliche Kosten von €${(totalActual - budget.totalBudget).toLocaleString('de-DE')}`,
        mitigation: 'Sofortige Kostenreduzierung und Neuplanung erforderlich',
        preventiveMeasures: [
          'Regelmäßige Budgetkontrollen',
          'Frühe Warnsysteme implementieren',
          'Kontingenzplanung verbessern'
        ]
      });
    }
    
    return risks;
  }

  private static identifyScheduleDelays(project: Project): RiskItem[] {
    const risks: RiskItem[] = [];
    
    if (project.actualEndDate && project.endDate) {
      const planned = new Date(project.endDate);
      const actual = new Date(project.actualEndDate);
      const delayDays = Math.ceil((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
      
      if (delayDays > 0) {
        risks.push({
          id: this.generateId(),
          type: 'schedule',
          severity: delayDays > 30 ? 'critical' : delayDays > 14 ? 'high' : 'medium',
          description: `Terminverzögerung von ${delayDays} Tagen`,
          impact: 'Mögliche Vertragsstrafen und Folgekosten',
          mitigation: 'Ressourcen erhöhen oder Scope anpassen',
          preventiveMeasures: [
            'Realistische Zeitplanung',
            'Pufferzeiten einplanen',
            'Kritischen Pfad überwachen'
          ]
        });
      }
    }
    
    return risks;
  }

  private static identifyQualityIssues(project: Project): RiskItem[] {
    // Simplified - would analyze quality metrics from project data
    return [];
  }

  private static generateRecommendations(
    budget: ProjectBudget,
    costEntries: CostEntry[],
    project: Project
  ): string[] {
    const recommendations: string[] = [];
    const totalActual = costEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const overrunPercent = budget.totalBudget > 0 ? 
      ((totalActual - budget.totalBudget) / budget.totalBudget) * 100 : 0;
    
    if (overrunPercent > 10) {
      recommendations.push('Implementierung strengerer Kostenkontrolle für zukünftige Projekte');
      recommendations.push('Überarbeitung der Kalkulationsmethoden');
    }
    
    if (project.progress < 100) {
      recommendations.push('Verbesserung der Projektfortschrittsverfolgung');
    }
    
    recommendations.push('Regelmäßige Nachkalkulationen während der Projektlaufzeit');
    recommendations.push('Dokumentation von Lessons Learned für zukünftige Projekte');
    
    return recommendations;
  }

  // Utility methods
  private static identifyVarianceCauses(variance: number, categoryId: string): string[] {
    const causes: string[] = [];
    
    if (variance > 0) {
      causes.push('Höhere als geplante Kosten');
      if (categoryId.includes('cat-steel-materials')) {
        causes.push('Stahlpreissteigerungen', 'Zusätzlicher Materialbedarf', 'Qualitätsupgrade erforderlich');
      } else if (categoryId.includes('cat-fabrication-labor')) {
        causes.push('Überstunden', 'Höhere Stundensätze', 'Komplexere Schweißarbeiten');
      } else if (categoryId.includes('cat-welding-consumables')) {
        causes.push('Höherer Verbrauch', 'Teurere Elektroden', 'Nacharbeiten');
      } else if (categoryId.includes('cat-surface-treatment')) {
        causes.push('Zusätzliche Beschichtungen', 'Aufwendigere Vorbehandlung');
      } else if (categoryId.includes('cat-machining-equipment')) {
        causes.push('Maschinenstundensätze gestiegen', 'Längere Bearbeitungszeiten');
      } else if (categoryId.includes('cat-assembly-installation')) {
        causes.push('Montageschwierigkeiten', 'Zusätzliche Kranstunden', 'Transportkosten');
      }
    } else {
      causes.push('Kosteneinsparungen realisiert');
      if (categoryId.includes('cat-steel-materials')) {
        causes.push('Günstigere Stahlpreise', 'Materialoptimierung');
      } else if (categoryId.includes('cat-fabrication-labor')) {
        causes.push('Effizientere Fertigung', 'Keine Überstunden');
      }
    }
    
    return causes;
  }

  private static assessVarianceImpact(variance: number, planned: number): string {
    const percent = planned > 0 ? Math.abs(variance / planned) * 100 : 0;
    
    if (percent > 25) return 'Kritische Auswirkung auf Projektrentabilität';
    if (percent > 15) return 'Hohe Auswirkung auf Budget';
    if (percent > 5) return 'Moderate Auswirkung';
    return 'Geringe Auswirkung';
  }

  private static suggestPreventiveMeasures(categoryId: string, variance: number): string[] {
    const measures: string[] = [];
    
    if (variance > 0) {
      measures.push('Detailliertere Kostenschätzung');
      measures.push('Regelmäßige Kostenüberwachung');
      
      if (categoryId.includes('cat-steel-materials')) {
        measures.push('Langfristige Stahllieferverträge', 'Materialpreisüberwachung', 'Optimierte Verschnittplanung');
      } else if (categoryId.includes('cat-fabrication-labor')) {
        measures.push('Bessere Arbeitsplanung', 'Schweißerqualifizierung', 'Fertigungsoptimierung');
      } else if (categoryId.includes('cat-welding-consumables')) {
        measures.push('Verbrauchskontrolle', 'Qualitätssicherung', 'Schweißverfahren optimieren');
      } else if (categoryId.includes('cat-surface-treatment')) {
        measures.push('Oberflächenplanung verbessern', 'Beschichtungsverfahren optimieren');
      } else if (categoryId.includes('cat-machining-equipment')) {
        measures.push('Maschinenlaufzeiten optimieren', 'Wartungsplanung', 'CNC-Programmierung verbessern');
      } else if (categoryId.includes('cat-assembly-installation')) {
        measures.push('Montageplanung detaillieren', 'Krankapazitäten prüfen', 'Logistik optimieren');
      }
    }
    
    return measures;
  }

  private static getTypeDisplayName(type: string): string {
    const names: Record<string, string> = {
      'steel_material': 'Stahlmaterialien',
      'fabrication_labor': 'Fertigungskosten',
      'welding_consumables': 'Schweißzusätze',
      'surface_treatment': 'Oberflächenbehandlung',
      'machining_equipment': 'Bearbeitungsmaschinen',
      'assembly_installation': 'Montage & Installation',
      'quality_testing': 'Prüfung & Qualität',
      'engineering': 'Konstruktion & Planung',
      'subcontractor': 'Subunternehmer',
      'other': 'Sonstiges'
    };
    return names[type] || type;
  }

  private static isTypeControllable(type: string): boolean {
    const controllable = ['cat-steel-materials', 'cat-fabrication-labor', 'cat-welding-consumables', 'cat-surface-treatment', 'cat-machining-equipment'];
    return controllable.includes(type);
  }

  private static extractSignificantEvents(entries: CostEntry[]): string[] {
    const events: string[] = [];
    
    // Find large expenses
    const largeExpenses = entries.filter(entry => entry.amount > 10000);
    largeExpenses.forEach(expense => {
      events.push(`Große Ausgabe: ${expense.description} (€${expense.amount.toLocaleString('de-DE')})`);
    });
    
    return events;
  }
}