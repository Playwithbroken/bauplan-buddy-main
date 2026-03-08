import { ErrorHandlingService } from './errorHandlingService';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'percentage' | 'number' | 'duration';
  category: 'financial' | 'project' | 'team' | 'customer' | 'efficiency';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastUpdated: string;
}

export interface ChartData {
  id: string;
  name: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'gauge';
  data: Array<{
    label: string;
    value: number;
    color?: string;
    metadata?: Record<string, unknown>;
  }>;
  xAxis?: string;
  yAxis?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  config?: {
    showLegend?: boolean;
    showGrid?: boolean;
    animation?: boolean;
    responsive?: boolean;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'project' | 'financial' | 'operational' | 'custom';
  sections: ReportSection[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    format: 'pdf' | 'excel' | 'email';
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'metrics' | 'chart' | 'table' | 'text' | 'image';
  content: Record<string, unknown>;
  order: number;
  config?: {
    columns?: number;
    height?: string;
    showHeader?: boolean;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'kpi' | 'progress' | 'alert';
  dataSource: string;
  config: {
    refreshInterval?: number; // seconds
    showHeader?: boolean;
    showFooter?: boolean;
    height?: string;
    width?: string;
  };
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  filters?: Record<string, unknown>;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  padding: [number, number];
  breakpoints: Record<string, number>;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'range' | 'text';
  options?: Array<{ label: string; value: unknown }>;
  defaultValue?: unknown;
  required?: boolean;
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions: string[];
  filters?: Record<string, unknown>;
  timeRange?: {
    start: string;
    end: string;
  };
  groupBy?: string;
  orderBy?: string;
  limit?: number;
}

export interface AnalyticsResult {
  data: Array<Record<string, unknown>>;
  totals?: Record<string, number>;
  metadata: {
    totalRows: number;
    executionTime: number;
    cacheHit: boolean;
    lastUpdated: string;
  };
}

export class AnalyticsService {
  private static readonly DASHBOARDS_KEY = 'bauplan-buddy-dashboards';
  private static readonly REPORTS_KEY = 'bauplan-buddy-reports';
  private static readonly ANALYTICS_CACHE_KEY = 'bauplan-buddy-analytics-cache';

  /**
   * Initialize analytics service with default dashboards and reports
   */
  static initialize(): void {
    if (!this.getStoredDashboards().length) {
      this.createDefaultDashboards();
    }
    if (!this.getStoredReports().length) {
      this.createDefaultReports();
    }

    ErrorHandlingService.info(
      'Analytics service initialized',
      'analytics_service'
    );
  }

  /**
   * Reset dashboards to defaults (useful after updates)
   */
  static resetDashboards(): void {
    this.createDefaultDashboards();
    ErrorHandlingService.info(
      'Dashboards reset to defaults',
      'analytics_service'
    );
  }

  /**
   * Get key performance indicators
   */
  static async getKPIs(timeRange?: { start: string; end: string }): Promise<AnalyticsMetric[]> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Mock data - in production this would query actual database
      const kpis: AnalyticsMetric[] = [
        {
          id: 'total-revenue',
          name: 'Gesamtumsatz',
          value: 245000,
          previousValue: 220000,
          change: 25000,
          changePercent: 11.4,
          trend: 'up',
          format: 'currency',
          category: 'financial',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'active-projects',
          name: 'Aktive Projekte',
          value: 23,
          previousValue: 19,
          change: 4,
          changePercent: 21.1,
          trend: 'up',
          format: 'number',
          category: 'project',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'completion-rate',
          name: 'Fertigstellungsrate',
          value: 87.5,
          previousValue: 82.3,
          change: 5.2,
          changePercent: 6.3,
          trend: 'up',
          format: 'percentage',
          category: 'efficiency',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'profit-margin',
          name: 'Gewinnmarge',
          value: 18.3,
          previousValue: 16.7,
          change: 1.6,
          changePercent: 9.6,
          trend: 'up',
          format: 'percentage',
          category: 'financial',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'customer-satisfaction',
          name: 'Kundenzufriedenheit',
          value: 4.6,
          previousValue: 4.4,
          change: 0.2,
          changePercent: 4.5,
          trend: 'up',
          format: 'number',
          category: 'customer',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'avg-project-duration',
          name: 'Ø Projektdauer',
          value: 45,
          previousValue: 52,
          change: -7,
          changePercent: -13.5,
          trend: 'up', // Shorter duration is better
          format: 'duration',
          category: 'efficiency',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'uptime',
          name: 'System Uptime',
          value: 99.92,
          previousValue: 99.85,
          change: 0.07,
          changePercent: 0.07,
          trend: 'up',
          format: 'percentage',
          category: 'efficiency',
          period: 'weekly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'error-rate',
          name: 'Fehlerquote',
          value: 0.08,
          previousValue: 0.12,
          change: -0.04,
          changePercent: -33.3,
          trend: 'up',
          format: 'percentage',
          category: 'efficiency',
          period: 'weekly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'api-latency',
          name: 'API Latenz (p95)',
          value: 185,
          previousValue: 210,
          change: -25,
          changePercent: -11.9,
          trend: 'up',
          format: 'number',
          category: 'efficiency',
          period: 'weekly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'page-load-time',
          name: 'Page Load Time',
          value: 2.7,
          previousValue: 3.1,
          change: -0.4,
          changePercent: -12.9,
          trend: 'up',
          format: 'number',
          category: 'efficiency',
          period: 'weekly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'lighthouse-score',
          name: 'Lighthouse Score',
          value: 92,
          previousValue: 88,
          change: 4,
          changePercent: 4.5,
          trend: 'up',
          format: 'number',
          category: 'efficiency',
          period: 'weekly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'wcag-aa-compliance',
          name: 'WCAG 2.1 AA',
          value: 100,
          previousValue: 100,
          change: 0,
          changePercent: 0,
          trend: 'stable',
          format: 'percentage',
          category: 'efficiency',
          period: 'quarterly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'landing-to-register',
          name: 'Landing→Register Conversion',
          value: 5.4,
          previousValue: 4.8,
          change: 0.6,
          changePercent: 12.5,
          trend: 'up',
          format: 'percentage',
          category: 'customer',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'scroll-depth',
          name: 'Scrolltiefe Landing',
          value: 78,
          previousValue: 71,
          change: 7,
          changePercent: 9.9,
          trend: 'up',
          format: 'percentage',
          category: 'customer',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'cta-click-rate',
          name: 'CTA Click Rate',
          value: 5.6,
          previousValue: 4.9,
          change: 0.7,
          changePercent: 14.3,
          trend: 'up',
          format: 'percentage',
          category: 'customer',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'register-to-onboarding',
          name: 'Register→Onboarding',
          value: 81,
          previousValue: 78,
          change: 3,
          changePercent: 3.8,
          trend: 'up',
          format: 'percentage',
          category: 'customer',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'empty-state-action-rate',
          name: 'Empty State → Action',
          value: 63,
          previousValue: 58,
          change: 5,
          changePercent: 8.6,
          trend: 'up',
          format: 'percentage',
          category: 'customer',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'test-coverage',
          name: 'Test Coverage',
          value: 82,
          previousValue: 79,
          change: 3,
          changePercent: 3.8,
          trend: 'up',
          format: 'percentage',
          category: 'efficiency',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'breadcrumb-usage',
          name: 'Breadcrumb Nutzung',
          value: 64,
          previousValue: 58,
          change: 6,
          changePercent: 10.3,
          trend: 'up',
          format: 'percentage',
          category: 'project',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'quick-actions-usage',
          name: 'Quick Actions',
          value: 41,
          previousValue: 36,
          change: 5,
          changePercent: 13.9,
          trend: 'up',
          format: 'percentage',
          category: 'project',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'search-success-rate',
          name: 'Search Success Rate',
          value: 86,
          previousValue: 80,
          change: 6,
          changePercent: 7.5,
          trend: 'up',
          format: 'percentage',
          category: 'project',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'tooltip-hover-rate',
          name: 'Tooltip Nutzung',
          value: 37,
          previousValue: 31,
          change: 6,
          changePercent: 19.3,
          trend: 'up',
          format: 'percentage',
          category: 'team',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'support-ticket-reduction',
          name: 'Support Ticket Reduktion',
          value: 24,
          previousValue: 21,
          change: 3,
          changePercent: 14.3,
          trend: 'up',
          format: 'percentage',
          category: 'team',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'knowledge-base-hit-rate',
          name: 'Knowledge-Base Treffer',
          value: 72,
          previousValue: 66,
          change: 6,
          changePercent: 9.1,
          trend: 'up',
          format: 'percentage',
          category: 'team',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'sla-compliance',
          name: 'SLA ErfǬllung',
          value: 97,
          previousValue: 95,
          change: 2,
          changePercent: 2.1,
          trend: 'up',
          format: 'percentage',
          category: 'team',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'monthly-active-users',
          name: 'Monatlich aktive Nutzer',
          value: 1280,
          previousValue: 1205,
          change: 75,
          changePercent: 6.2,
          trend: 'up',
          format: 'number',
          category: 'customer',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'user-retention-30d',
          name: 'Retention (30 Tage)',
          value: 72,
          previousValue: 69,
          change: 3,
          changePercent: 4.3,
          trend: 'up',
          format: 'percentage',
          category: 'customer',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'nps-score',
          name: 'NPS Score',
          value: 46,
          previousValue: 42,
          change: 4,
          changePercent: 9.5,
          trend: 'up',
          format: 'number',
          category: 'customer',
          period: 'quarterly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'cost-per-user',
          name: 'Cost per User',
          value: 8.4,
          previousValue: 8.9,
          change: -0.5,
          changePercent: -5.6,
          trend: 'up',
          format: 'currency',
          category: 'financial',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'revenue-per-user',
          name: 'Revenue per User',
          value: 57,
          previousValue: 52,
          change: 5,
          changePercent: 9.6,
          trend: 'up',
          format: 'currency',
          category: 'financial',
          period: 'monthly',
          lastUpdated: now.toISOString()
        },
        {
          id: 'churn-rate',
          name: 'Churn Rate',
          value: 3.4,
          previousValue: 4.1,
          change: -0.7,
          changePercent: -17.1,
          trend: 'up',
          format: 'percentage',
          category: 'customer',
          period: 'monthly',
          lastUpdated: now.toISOString()
        }
      ];

      return kpis;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to get KPIs',
        error as Error,
        'analytics_service'
      );
      return [];
    }
  }

  /**
   * Get chart data for analytics
   */
  static async getChartData(chartId: string, timeRange?: { start: string; end: string }): Promise<ChartData | null> {
    try {
      const charts: Record<string, ChartData> = {
        'revenue-trend': {
          id: 'revenue-trend',
          name: 'Umsatzentwicklung',
          type: 'line',
          data: [
            { label: 'Jan', value: 180000 },
            { label: 'Feb', value: 195000 },
            { label: 'Mär', value: 210000 },
            { label: 'Apr', value: 185000 },
            { label: 'Mai', value: 225000 },
            { label: 'Jun', value: 245000 }
          ],
          xAxis: 'Monat',
          yAxis: 'Umsatz (€)',
          config: {
            showLegend: true,
            showGrid: true,
            animation: true,
            responsive: true
          }
        },
        'project-status': {
          id: 'project-status',
          name: 'Projektstatus',
          type: 'pie',
          data: [
            { label: 'Abgeschlossen', value: 15, color: '#10b981' },
            { label: 'In Bearbeitung', value: 23, color: '#3b82f6' },
            { label: 'Geplant', value: 8, color: '#f59e0b' },
            { label: 'Pausiert', value: 2, color: '#ef4444' }
          ],
          config: {
            showLegend: true,
            animation: true,
            responsive: true
          }
        },
        'team-productivity': {
          id: 'team-productivity',
          name: 'Team-Produktivität',
          type: 'bar',
          data: [
            { label: 'Team A', value: 92 },
            { label: 'Team B', value: 87 },
            { label: 'Team C', value: 95 },
            { label: 'Team D', value: 78 },
            { label: 'Team E', value: 89 }
          ],
          xAxis: 'Team',
          yAxis: 'Produktivität (%)',
          config: {
            showGrid: true,
            animation: true,
            responsive: true
          }
        },
        'cost-breakdown': {
          id: 'cost-breakdown',
          name: 'Kostenaufschlüsselung',
          type: 'pie',
          data: [
            { label: 'Material', value: 45, color: '#8b5cf6' },
            { label: 'Arbeitskraft', value: 35, color: '#06b6d4' },
            { label: 'Ausrüstung', value: 12, color: '#84cc16' },
            { label: 'Sonstiges', value: 8, color: '#f97316' }
          ],
          config: {
            showLegend: true,
            animation: true,
            responsive: true
          }
        },
        'monthly-growth': {
          id: 'monthly-growth',
          name: 'Monatliches Wachstum',
          type: 'area',
          data: [
            { label: 'Jan', value: 5.2 },
            { label: 'Feb', value: 8.3 },
            { label: 'Mär', value: 7.9 },
            { label: 'Apr', value: -2.1 },
            { label: 'Mai', value: 12.4 },
            { label: 'Jun', value: 15.7 }
          ],
          xAxis: 'Monat',
          yAxis: 'Wachstum (%)',
          config: {
            showGrid: true,
            animation: true,
            responsive: true
          }
        }
      };

      return charts[chartId] || null;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to get chart data',
        error as Error,
        'analytics_service',
        { chartId }
      );
      return null;
    }
  }

  /**
   * Execute analytics query
   */
  static async executeQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    try {
      const startTime = Date.now();
      
      // Mock query execution - in production would query actual database
      const mockData = this.generateMockQueryData(query);
      
      const executionTime = Date.now() - startTime;
      
      const result: AnalyticsResult = {
        data: mockData,
        totals: this.calculateTotals(mockData, query.metrics),
        metadata: {
          totalRows: mockData.length,
          executionTime,
          cacheHit: false,
          lastUpdated: new Date().toISOString()
        }
      };

      return result;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to execute analytics query',
        error as Error,
        'analytics_query',
        { query }
      );
      throw error;
    }
  }

  /**
   * Create custom dashboard
   */
  static createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Dashboard {
    try {
      const newDashboard: Dashboard = {
        ...dashboard,
        id: `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const dashboards = this.getStoredDashboards();
      dashboards.push(newDashboard);
      this.saveDashboards(dashboards);

      ErrorHandlingService.info(
        `Dashboard created: ${newDashboard.name}`,
        'analytics_dashboard',
        { dashboardId: newDashboard.id }
      );

      return newDashboard;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to create dashboard',
        error as Error,
        'analytics_dashboard'
      );
      throw error;
    }
  }

  /**
   * Update dashboard
   */
  static updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Dashboard | null {
    try {
      const dashboards = this.getStoredDashboards();
      const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
      
      if (dashboardIndex === -1) return null;

      dashboards[dashboardIndex] = {
        ...dashboards[dashboardIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.saveDashboards(dashboards);
      return dashboards[dashboardIndex];
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to update dashboard',
        error as Error,
        'analytics_dashboard'
      );
      throw error;
    }
  }

  /**
   * Get all dashboards
   */
  static getDashboards(): Dashboard[] {
    return this.getStoredDashboards();
  }

  /**
   * Get dashboard by ID
   */
  static getDashboard(dashboardId: string): Dashboard | null {
    const dashboards = this.getStoredDashboards();
    return dashboards.find(d => d.id === dashboardId) || null;
  }

  /**
   * Generate report
   */
  static async generateReport(templateId: string, format: 'pdf' | 'excel' | 'json' = 'json'): Promise<string | { template: ReportTemplate; generatedAt: string; sections: unknown[] } > {
    try {
      const template = this.getReportTemplate(templateId);
      if (!template) {
        throw new Error('Report template not found');
      }

      const reportData = await this.buildReportData(template);
      
      switch (format) {
        case 'pdf':
          return this.generatePDFReport(reportData, template);
        case 'excel':
          return this.generateExcelReport(reportData, template);
        default:
          return reportData;
      }
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to generate report',
        error as Error,
        'analytics_report',
        { templateId, format }
      );
      throw error;
    }
  }

  /**
   * Schedule automated report
   */
  static scheduleReport(templateId: string, schedule: ReportTemplate['schedule']): void {
    try {
      const templates = this.getStoredReports();
      const templateIndex = templates.findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        throw new Error('Report template not found');
      }

      templates[templateIndex].schedule = schedule;
      templates[templateIndex].updatedAt = new Date().toISOString();
      
      this.saveReports(templates);

      ErrorHandlingService.info(
        `Report scheduled: ${templates[templateIndex].name}`,
        'analytics_schedule',
        { templateId, frequency: schedule?.frequency }
      );
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to schedule report',
        error as Error,
        'analytics_schedule'
      );
      throw error;
    }
  }

  // Private helper methods

  private static generateMockQueryData(query: AnalyticsQuery): Array<Record<string, string | number>> {
    const mockData: Array<Record<string, string | number>> = [];
    const recordCount = Math.min(query.limit || 100, 100);
    
    for (let i = 0; i < recordCount; i++) {
      const record: Record<string, string | number> = {};
      
      query.dimensions.forEach(dimension => {
        switch (dimension) {
          case 'project_name':
            record[dimension] = `Projekt ${i + 1}`;
            break;
          case 'team':
            record[dimension] = `Team ${String.fromCharCode(65 + (i % 5))}`;
            break;
          case 'month':
            record[dimension] = new Date(2024, i % 12).toLocaleDateString('de-DE', { month: 'long' });
            break;
          default:
            record[dimension] = `${dimension}_${i}`;
        }
      });

      query.metrics.forEach(metric => {
        switch (metric) {
          case 'revenue':
            record[metric] = Math.random() * 100000 + 50000;
            break;
          case 'profit':
            record[metric] = Math.random() * 20000 + 5000;
            break;
          case 'duration':
            record[metric] = Math.random() * 100 + 20;
            break;
          default:
            record[metric] = Math.random() * 1000;
        }
      });
      
      mockData.push(record);
    }
    
    return mockData;
  }

  private static calculateTotals(data: Array<Record<string, string | number>>, metrics: string[]): Record<string, number> {
    const totals: Record<string, number> = {};
    
    metrics.forEach(metric => {
      totals[metric] = data.reduce((sum, record) => sum + (Number(record[metric]) || 0), 0);
    });
    
    return totals;
  }

  private static async buildReportData(template: ReportTemplate): Promise<{ template: ReportTemplate; generatedAt: string; sections: unknown[] }> {
    const reportData: { template: ReportTemplate; generatedAt: string; sections: unknown[] } = {
      template,
      generatedAt: new Date().toISOString(),
      sections: []
    };

    for (const section of template.sections) {
      const sectionData = await this.buildSectionData(section);
      reportData.sections.push(sectionData);
    }

    return reportData;
  }

  private static async buildSectionData(section: ReportSection): Promise<unknown> {
    // Mock section data building
    switch (section.type) {
      case 'metrics':
        return {
          ...section,
          data: await this.getKPIs()
        };
      case 'chart':
        {
          const chartId = (section.content as { chartId?: string }).chartId || '';
        return {
          ...section,
          data: await this.getChartData(chartId)
        };
        }
      default:
        return section;
    }
  }

  private static generatePDFReport(reportData: unknown, template: ReportTemplate): string {
    // Mock PDF generation - would use jsPDF or similar library
    return `PDF report data for ${template.name}`;
  }

  private static generateExcelReport(reportData: unknown, template: ReportTemplate): string {
    // Mock Excel generation - would use xlsx library
    return `Excel report data for ${template.name}`;
  }

  private static getReportTemplate(templateId: string): ReportTemplate | null {
    const templates = this.getStoredReports();
    return templates.find(t => t.id === templateId) || null;
  }

  static getSupplyChainSnapshot(): {
    delayedDeliveries: number;
    inTransitDeliveries: number;
    plannedDeliveries: number;
    averageDelayHours: number;
  } {
    // Placeholder implementation until backend integration is available
    return {
      delayedDeliveries: 2,
      inTransitDeliveries: 5,
      plannedDeliveries: 3,
      averageDelayHours: 4.5,
    };
  }
  private static createDefaultDashboards(): void {
    const defaultDashboards: Dashboard[] = [
      {
        id: 'executive-dashboard',
        name: 'Executive Dashboard',
        description: 'Überblick über alle wichtigen Kennzahlen',
        widgets: [
          {
            id: 'revenue-kpi',
            title: 'Gesamtumsatz',
            type: 'metric',
            dataSource: 'total-revenue',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 0, y: 0, w: 3, h: 2 }
          },
          {
            id: 'projects-kpi',
            title: 'Aktive Projekte',
            type: 'metric',
            dataSource: 'active-projects',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 3, y: 0, w: 3, h: 2 }
          },
          {
            id: 'revenue-chart',
            title: 'Umsatzentwicklung',
            type: 'chart',
            dataSource: 'revenue-trend',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 0, y: 2, w: 6, h: 4 }
          }
        ],
        layout: {
          columns: 12,
          rowHeight: 60,
          margin: [10, 10],
          padding: [10, 10],
          breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 }
        },
        filters: [
          {
            id: 'time-range',
            name: 'Zeitraum',
            type: 'date',
            defaultValue: 'last-30-days'
          }
        ],
        permissions: ['reports.read'],
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: 'analytics-overview',
        name: 'Übersicht Dashboard',
        description: 'Anpassbares Übersichts-Dashboard mit wichtigsten KPIs und Projektfortschritt',
        widgets: [
          {
            id: 'overview-revenue-kpi',
            title: 'Gesamtumsatz',
            type: 'metric',
            dataSource: 'total-revenue',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 0, y: 0, w: 3, h: 2 }
          },
          {
            id: 'overview-profit-kpi',
            title: 'Gewinn',
            type: 'metric',
            dataSource: 'total-profit',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 3, y: 0, w: 3, h: 2 }
          },
          {
            id: 'overview-projects-kpi',
            title: 'Aktive Projekte',
            type: 'metric',
            dataSource: 'active-projects',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 6, y: 0, w: 3, h: 2 }
          },
          {
            id: 'overview-roi-kpi',
            title: 'ROI',
            type: 'metric',
            dataSource: 'avg-roi',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 9, y: 0, w: 3, h: 2 }
          },
          {
            id: 'overview-revenue-chart',
            title: 'Umsatzentwicklung',
            type: 'chart',
            dataSource: 'revenue-trend',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 0, y: 2, w: 4, h: 4 }
          },
          {
            id: 'overview-progress',
            title: 'Projektfortschritt',
            type: 'progress',
            dataSource: 'progress-widget',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 4, y: 2, w: 2, h: 2 }
          },
          {
            id: 'overview-alerts',
            title: 'Wichtige Benachrichtigungen',
            type: 'alert',
            dataSource: 'alert-widget',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 6, y: 2, w: 2, h: 3 }
          },
          {
            id: 'overview-projects-table',
            title: 'Projekt-Übersicht',
            type: 'table',
            dataSource: 'table-projects',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 8, y: 2, w: 4, h: 5 }
          }
        ],
        layout: {
          columns: 12,
          rowHeight: 60,
          margin: [10, 10],
          padding: [10, 10],
          breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 }
        },
        filters: [
          {
            id: 'time-range',
            name: 'Zeitraum',
            type: 'date',
            defaultValue: 'last-30-days'
          }
        ],
        permissions: ['reports.read'],
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: 'analytics-revenue',
        name: 'Umsatz Dashboard',
        description: 'Detaillierte Umsatzanalyse mit Trendentwicklung',
        widgets: [
          {
            id: 'revenue-total-kpi',
            title: 'Gesamtumsatz',
            type: 'metric',
            dataSource: 'total-revenue',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 0, y: 0, w: 3, h: 2 }
          },
          {
            id: 'revenue-profit-kpi',
            title: 'Gewinn',
            type: 'metric',
            dataSource: 'total-profit',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 3, y: 0, w: 3, h: 2 }
          },
          {
            id: 'revenue-roi-kpi',
            title: 'ROI',
            type: 'metric',
            dataSource: 'avg-roi',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 6, y: 0, w: 3, h: 2 }
          },
          {
            id: 'revenue-trend-chart',
            title: 'Umsatzentwicklung',
            type: 'chart',
            dataSource: 'revenue-trend',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 0, y: 2, w: 6, h: 4 }
          },
          {
            id: 'revenue-cost-distribution',
            title: 'Kostenverteilung',
            type: 'chart',
            dataSource: 'cost-distribution',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 6, y: 2, w: 6, h: 4 }
          }
        ],
        layout: {
          columns: 12,
          rowHeight: 60,
          margin: [10, 10],
          padding: [10, 10],
          breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 }
        },
        filters: [
          {
            id: 'time-range',
            name: 'Zeitraum',
            type: 'date',
            defaultValue: 'last-30-days'
          }
        ],
        permissions: ['reports.read'],
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: 'analytics-projects',
        name: 'Projekt Dashboard',
        description: 'Projektanalyse mit Statusübersicht und Performance-Kennzahlen',
        widgets: [
          {
            id: 'projects-active-kpi',
            title: 'Aktive Projekte',
            type: 'metric',
            dataSource: 'active-projects',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 0, y: 0, w: 3, h: 2 }
          },
          {
            id: 'projects-revenue-kpi',
            title: 'Gesamtumsatz',
            type: 'metric',
            dataSource: 'total-revenue',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 3, y: 0, w: 3, h: 2 }
          },
          {
            id: 'projects-roi-kpi',
            title: 'ROI',
            type: 'metric',
            dataSource: 'avg-roi',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 6, y: 0, w: 3, h: 2 }
          },
          {
            id: 'projects-cost-chart',
            title: 'Kostenverteilung',
            type: 'chart',
            dataSource: 'cost-distribution',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 0, y: 2, w: 6, h: 4 }
          },
          {
            id: 'projects-table',
            title: 'Projekt-Performance',
            type: 'table',
            dataSource: 'table-projects',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 6, y: 2, w: 6, h: 5 }
          }
        ],
        layout: {
          columns: 12,
          rowHeight: 60,
          margin: [10, 10],
          padding: [10, 10],
          breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 }
        },
        filters: [
          {
            id: 'time-range',
            name: 'Zeitraum',
            type: 'date',
            defaultValue: 'last-30-days'
          }
        ],
        permissions: ['reports.read'],
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: 'analytics-customers',
        name: 'Kunden Dashboard',
        description: 'Kundenanalyse mit Top-Kunden und Aktivitäten',
        widgets: [
          {
            id: 'customers-revenue-kpi',
            title: 'Gesamtumsatz',
            type: 'metric',
            dataSource: 'total-revenue',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 0, y: 0, w: 3, h: 2 }
          },
          {
            id: 'customers-projects-kpi',
            title: 'Aktive Projekte',
            type: 'metric',
            dataSource: 'active-projects',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 3, y: 0, w: 3, h: 2 }
          },
          {
            id: 'customers-roi-kpi',
            title: 'ROI',
            type: 'metric',
            dataSource: 'avg-roi',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 6, y: 0, w: 3, h: 2 }
          },
          {
            id: 'customers-revenue-chart',
            title: 'Umsatzentwicklung',
            type: 'chart',
            dataSource: 'revenue-trend',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 0, y: 2, w: 6, h: 4 }
          },
          {
            id: 'customers-alerts',
            title: 'Kunden-Aktivitäten',
            type: 'alert',
            dataSource: 'alert-widget',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 6, y: 2, w: 6, h: 4 }
          }
        ],
        layout: {
          columns: 12,
          rowHeight: 60,
          margin: [10, 10],
          padding: [10, 10],
          breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 }
        },
        filters: [
          {
            id: 'time-range',
            name: 'Zeitraum',
            type: 'date',
            defaultValue: 'last-30-days'
          }
        ],
        permissions: ['reports.read'],
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: 'analytics-custom',
        name: 'Anpassbares Dashboard',
        description: 'Individuelles Dashboard mit Drag-and-Drop Widgets',
        widgets: [
          {
            id: 'custom-revenue-kpi',
            title: 'Gesamtumsatz',
            type: 'metric',
            dataSource: 'total-revenue',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 0, y: 0, w: 3, h: 2 }
          },
          {
            id: 'custom-profit-kpi',
            title: 'Gewinn',
            type: 'metric',
            dataSource: 'total-profit',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 3, y: 0, w: 3, h: 2 }
          },
          {
            id: 'custom-projects-kpi',
            title: 'Aktive Projekte',
            type: 'metric',
            dataSource: 'active-projects',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 6, y: 0, w: 3, h: 2 }
          },
          {
            id: 'custom-roi-kpi',
            title: 'ROI',
            type: 'metric',
            dataSource: 'avg-roi',
            config: { refreshInterval: 300, showHeader: true },
            position: { x: 9, y: 0, w: 3, h: 2 }
          },
          {
            id: 'custom-revenue-chart',
            title: 'Umsatzentwicklung',
            type: 'chart',
            dataSource: 'revenue-trend',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 0, y: 2, w: 4, h: 4 }
          },
          {
            id: 'custom-cost-chart',
            title: 'Kostenverteilung',
            type: 'chart',
            dataSource: 'cost-distribution',
            config: { refreshInterval: 600, showHeader: true },
            position: { x: 8, y: 2, w: 4, h: 4 }
          }
        ],
        layout: {
          columns: 12,
          rowHeight: 60,
          margin: [10, 10],
          padding: [10, 10],
          breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 }
        },
        filters: [
          {
            id: 'time-range',
            name: 'Zeitraum',
            type: 'date',
            defaultValue: 'last-30-days'
          }
        ],
        permissions: ['reports.read'],
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];

    this.saveDashboards(defaultDashboards);
  }

  private static createDefaultReports(): void {
    const defaultReports: ReportTemplate[] = [
      {
        id: 'monthly-report',
        name: 'Monatlicher Projektbericht',
        description: 'Übersicht über alle Projekte und wichtige Kennzahlen des Monats',
        category: 'executive',
        sections: [
          {
            id: 'kpis',
            title: 'Wichtige Kennzahlen',
            type: 'metrics',
            content: { metrics: ['total-revenue', 'active-projects', 'completion-rate'] },
            order: 1
          },
          {
            id: 'revenue-chart',
            title: 'Umsatzentwicklung',
            type: 'chart',
            content: { chartId: 'revenue-trend' },
            order: 2
          }
        ],
        schedule: {
          frequency: 'monthly',
          recipients: ['management@bauplan-buddy.de'],
          format: 'pdf'
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];

    this.saveReports(defaultReports);
  }

  private static getStoredDashboards(): Dashboard[] {
    try {
      const data = localStorage.getItem(this.DASHBOARDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static getStoredReports(): ReportTemplate[] {
    try {
      const data = localStorage.getItem(this.REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveDashboards(dashboards: Dashboard[]): void {
    localStorage.setItem(this.DASHBOARDS_KEY, JSON.stringify(dashboards));
  }

  private static saveReports(reports: ReportTemplate[]): void {
    localStorage.setItem(this.REPORTS_KEY, JSON.stringify(reports));
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Reset dashboards to load new dashboard configurations
  // This can be removed after first load, or keep for dynamic updates
  const DASHBOARD_VERSION_KEY = 'bauplan-buddy-dashboard-version';
  const CURRENT_DASHBOARD_VERSION = '2.0'; // Increment when adding new dashboards
  
  const storedVersion = localStorage.getItem(DASHBOARD_VERSION_KEY);
  
  if (storedVersion !== CURRENT_DASHBOARD_VERSION) {
    AnalyticsService.resetDashboards();
    localStorage.setItem(DASHBOARD_VERSION_KEY, CURRENT_DASHBOARD_VERSION);
  }
  
  AnalyticsService.initialize();
}

