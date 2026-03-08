import { EnhancedReportingService } from '../enhancedReportingService';

describe('EnhancedReportingService Integration', () => {
  let service: EnhancedReportingService;

  beforeEach(() => {
    service = EnhancedReportingService.getInstance();
  });

  describe('Service Initialization', () => {
    it('should be a singleton instance', () => {
      const instance1 = EnhancedReportingService.getInstance();
      const instance2 = EnhancedReportingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Project Profitability Reports', () => {
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
      expect(reports.length).toBeGreaterThan(0);
      reports.forEach(report => {
        expect(report.projectId).toBe(projectId);
      });
    });
  });

  describe('Report Scheduling', () => {
    it('should schedule and retrieve reports', () => {
      const schedule = {
        templateId: 'test-template',
        frequency: 'daily' as const,
        recipients: ['test@example.com'],
        format: 'pdf' as const,
        nextRun: new Date().toISOString(),
        isActive: true
      };
      
      // Clear any existing schedules
      localStorage.removeItem('enhanced-reporting-schedules');
      
      service.scheduleReport(schedule);
      
      const schedules = service.getScheduledReports();
      expect(schedules).toBeInstanceOf(Array);
      expect(schedules.length).toBe(1);
      expect(schedules[0]).toEqual(schedule);
    });
  });
});