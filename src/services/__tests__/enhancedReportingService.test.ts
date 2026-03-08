import { EnhancedReportingService, ProjectProfitabilityReport } from '../enhancedReportingService';
import { AnalyticsService } from '../analyticsService';

// Mock the AnalyticsService
jest.mock('../analyticsService', () => {
  return {
    AnalyticsService: {
      getKPIs: jest.fn(),
      getChartData: jest.fn()
    }
  };
});

describe('EnhancedReportingService', () => {
  let service: EnhancedReportingService;

  beforeEach(() => {
    service = EnhancedReportingService.getInstance();
    jest.clearAllMocks();
  });

  describe('generateProjectProfitabilityReport', () => {
    it('should generate project profitability reports', async () => {
      const reports = await service.generateProjectProfitabilityReport();
      
      expect(reports).toBeInstanceOf(Array);
      expect(reports.length).toBeGreaterThan(0);
      
      const report = reports[0];
      expect(report).toHaveProperty('projectId');
      expect(report).toHaveProperty('projectName');
      expect(report).toHaveProperty('totalRevenue');
      expect(report).toHaveProperty('totalCosts');
      expect(report).toHaveProperty('profit');
      expect(report).toHaveProperty('profitMargin');
      expect(report).toHaveProperty('roi');
    });

    it('should filter reports by projectId when provided', async () => {
      const projectId = 'PRJ-2024-001';
      const reports = await service.generateProjectProfitabilityReport(projectId);
      
      expect(reports).toBeInstanceOf(Array);
      reports.forEach(report => {
        expect(report.projectId).toBe(projectId);
      });
    });
  });

  describe('generateFinancialDashboard', () => {
    it('should generate financial dashboard data', async () => {
      // Mock the AnalyticsService methods
      (AnalyticsService.getKPIs as jest.Mock).mockResolvedValue([
        {
          id: 'total-revenue',
          name: 'Gesamtumsatz',
          value: 245000,
          trend: 'up',
          format: 'currency',
          category: 'financial',
          period: 'monthly',
          lastUpdated: new Date().toISOString()
        }
      ]);
      
      (AnalyticsService.getChartData as jest.Mock).mockResolvedValue({
        id: 'revenue-trend',
        name: 'Umsatzentwicklung',
        type: 'line',
        data: [{ label: 'Jan', value: 180000 }]
      });

      const dashboard = await service.generateFinancialDashboard();
      
      expect(dashboard).toHaveProperty('kpis');
      expect(dashboard).toHaveProperty('charts');
      expect(dashboard).toHaveProperty('profitLoss');
      expect(dashboard).toHaveProperty('ratios');
      
      expect(dashboard.kpis).toBeInstanceOf(Array);
      expect(dashboard.charts).toBeInstanceOf(Array);
    });
  });

  describe('exportReport', () => {
    it('should export report to JSON format', async () => {
      const mockReportData = {
        title: 'Test Report',
        description: 'Test Description',
        generatedAt: new Date().toISOString(),
        sections: []
      };
      
      const result = await service.exportReport(mockReportData, {
        format: 'json',
        includeCharts: true,
        includeHeaders: true
      });
      
      expect(typeof result).toBe('string');
      expect(result).toContain('Test Report');
    });
  });

  describe('scheduleReport', () => {
    it('should schedule a report', () => {
      const schedule = {
        templateId: 'test-template',
        frequency: 'daily' as const,
        recipients: ['test@example.com'],
        format: 'pdf' as const,
        nextRun: new Date().toISOString(),
        isActive: true
      };
      
      expect(() => {
        service.scheduleReport(schedule);
      }).not.toThrow();
      
      const schedules = service.getScheduledReports();
      expect(schedules).toBeInstanceOf(Array);
      expect(schedules.length).toBeGreaterThan(0);
    });
  });
});