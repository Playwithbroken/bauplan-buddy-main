import { AnalyticsService, AnalyticsMetric, ChartData, ReportTemplate, ReportSection } from './analyticsService';
import { FinancialReportingService, ProfitLossStatement, FinancialRatio, FinancialPeriod } from './financialReportingService';
import jsPDF from 'jspdf';
import { utils as XLSXUtils, writeFile as writeXLSXFile } from 'xlsx';

export interface ProjectProfitabilityReport {
  projectId: string;
  projectName: string;
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  roi: number;
  budgetUsed: number;
  budgetTotal: number;
  timelineVariance: number; // days
  completionRate: number;
}

export interface CustomReportData {
  title: string;
  description: string;
  generatedAt: string;
  period?: {
    start: string;
    end: string;
  };
  sections: ReportSectionData[];
}

export interface ReportSectionData {
  id: string;
  title: string;
  type: 'metrics' | 'chart' | 'table' | 'text' | 'image' | 'project-profitability';
  content: Record<string, unknown> | AnalyticsMetric[] | ProjectProfitabilityReport[] | ChartData;
  config?: Record<string, unknown>;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeHeaders: boolean;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'letter' | 'legal';
}

export interface ReportSchedule {
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'email';
  nextRun: string;
  lastRun?: string;
  isActive: boolean;
}

export class EnhancedReportingService {
  private static instance: EnhancedReportingService;
  private financialService: FinancialReportingService;

  private constructor() {
    this.financialService = FinancialReportingService.getInstance();
  }

  static getInstance(): EnhancedReportingService {
    if (!EnhancedReportingService.instance) {
      EnhancedReportingService.instance = new EnhancedReportingService();
    }
    return EnhancedReportingService.instance;
  }

  /**
   * Generate a project profitability report
   */
  async generateProjectProfitabilityReport(
    projectId?: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<ProjectProfitabilityReport[]> {
    try {
      // In a real implementation, this would query actual project data
      // For now, we'll generate mock data
      const mockReports: ProjectProfitabilityReport[] = [
        {
          projectId: 'PRJ-2024-001',
          projectName: 'Wohnhaus Familie Müller',
          totalRevenue: 450000,
          totalCosts: 315000,
          profit: 135000,
          profitMargin: 30,
          roi: 42.9,
          budgetUsed: 315000,
          budgetTotal: 450000,
          timelineVariance: -5, // 5 days ahead of schedule
          completionRate: 100
        },
        {
          projectId: 'PRJ-2024-002',
          projectName: 'Bürogebäude TechCorp',
          totalRevenue: 1200000,
          totalCosts: 900000,
          profit: 300000,
          profitMargin: 25,
          roi: 33.3,
          budgetUsed: 900000,
          budgetTotal: 1050000,
          timelineVariance: 3, // 3 days behind schedule
          completionRate: 85
        },
        {
          projectId: 'PRJ-2024-003',
          projectName: 'Dachsanierung Hamburg',
          totalRevenue: 180000,
          totalCosts: 126000,
          profit: 54000,
          profitMargin: 30,
          roi: 42.9,
          budgetUsed: 126000,
          budgetTotal: 140000,
          timelineVariance: 0, // On schedule
          completionRate: 90
        }
      ];

      // Filter by project ID if provided
      if (projectId) {
        return mockReports.filter(report => report.projectId === projectId);
      }

      return mockReports;
    } catch (error) {
      console.error('Failed to generate project profitability report:', error);
      throw error;
    }
  }

  /**
   * Generate a custom report with multiple sections
   */
  async generateCustomReport(template: ReportTemplate): Promise<CustomReportData> {
    try {
      const reportData: CustomReportData = {
        title: template.name,
        description: template.description,
        generatedAt: new Date().toISOString(),
        sections: []
      };

      // Process each section in the template
      for (const section of template.sections) {
        const sectionData: ReportSectionData = {
          id: section.id,
          title: section.title,
          type: section.type as 'metrics' | 'chart' | 'table' | 'text' | 'image' | 'project-profitability',
          content: await this.processSectionContent(section),
          config: section.config
        };
        reportData.sections.push(sectionData);
      }

      return reportData;
    } catch (error) {
      console.error('Failed to generate custom report:', error);
      throw error;
    }
  }

  /**
   * Export report data to various formats
   */
  async exportReport(
    reportData: CustomReportData,
    options: ExportOptions
  ): Promise<Blob | string> {
    try {
      switch (options.format) {
        case 'pdf':
          return this.exportToPDF(reportData, options);
        case 'excel':
          return this.exportToExcel(reportData, options);
        case 'csv':
          return this.exportToCSV(reportData, options);
        case 'json':
          return JSON.stringify(reportData, null, 2);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  }

  /**
   * Schedule automated report generation
   */
  scheduleReport(schedule: ReportSchedule): void {
    try {
      // In a real implementation, this would integrate with a job scheduler
      // For now, we'll just store the schedule
      const schedules = this.getStoredSchedules();
      schedules.push(schedule);
      this.saveSchedules(schedules);
      
      console.log(`Report scheduled: ${schedule.templateId} - ${schedule.frequency}`);
    } catch (error) {
      console.error('Failed to schedule report:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled reports
   */
  getScheduledReports(): ReportSchedule[] {
    return this.getStoredSchedules();
  }

  /**
   * Generate financial dashboard data
   */
  async generateFinancialDashboard(): Promise<{
    kpis: AnalyticsMetric[];
    charts: ChartData[];
    profitLoss: ProfitLossStatement;
    ratios: FinancialRatio[];
  }> {
    try {
      // Get KPIs from analytics service
      const kpis = await AnalyticsService.getKPIs();
      
      // Get charts from analytics service
      const charts = await Promise.all([
        AnalyticsService.getChartData('revenue-trend'),
        AnalyticsService.getChartData('project-status'),
        AnalyticsService.getChartData('team-productivity'),
        AnalyticsService.getChartData('cost-breakdown')
      ]);
      
      // Generate financial statements
      const period = this.financialService.createMonthlyPeriod(
        new Date().getFullYear(),
        new Date().getMonth()
      );
      
      const profitLoss = this.financialService.generateProfitLossStatement(period);
      const ratios = this.financialService.generateFinancialRatios(period);
      
      return {
        kpis: kpis.filter(kpi => kpi !== null) as AnalyticsMetric[],
        charts: charts.filter(chart => chart !== null) as ChartData[],
        profitLoss,
        ratios
      };
    } catch (error) {
      console.error('Failed to generate financial dashboard:', error);
      throw error;
    }
  }

  // Private helper methods
  private async processSectionContent(section: ReportSection): Promise<Record<string, unknown> | AnalyticsMetric[] | ProjectProfitabilityReport[] | ChartData> {
    switch (section.type) {
      case 'metrics':
        return await AnalyticsService.getKPIs();
      case 'chart':
        {
          const chartId = (section.content as { chartId?: string }).chartId;
          if (chartId) {
            const chartData = await AnalyticsService.getChartData(chartId);
            return chartData || { id: chartId, name: 'Chart', type: 'bar', data: [] };
          }
          return { id: 'default', name: 'Chart', type: 'bar', data: [] };
        }
      case 'text':
        return section.content;
      case 'project-profitability':
        return await this.generateProjectProfitabilityReport();
      default:
        return section.content;
    }
  }

  private async exportToPDF(reportData: CustomReportData, options: ExportOptions): Promise<Blob> {
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.pageSize || 'A4'
    });

    // Add title
    doc.setFontSize(22);
    doc.text(reportData.title, 105, 20, { align: 'center' });
    
    // Add description
    doc.setFontSize(12);
    doc.text(reportData.description, 105, 30, { align: 'center' });
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleDateString()}`, 105, 35, { align: 'center' });
    
    // Add sections
    let yPosition = 45;
    for (const section of reportData.sections) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Add section title
      doc.setFontSize(16);
      doc.text(section.title, 20, yPosition);
      yPosition += 10;
      
      // Add section content based on type
      switch (section.type) {
        case 'metrics':
          yPosition = this.addMetricsToPDF(doc, section.content as AnalyticsMetric[], yPosition);
          break;
        case 'text':
          yPosition = this.addTextToPDF(doc, section.content as Record<string, unknown>, yPosition);
          break;
        case 'project-profitability':
          yPosition = this.addProjectProfitabilityToPDF(doc, section.content as ProjectProfitabilityReport[], yPosition);
          break;
        default:
          doc.setFontSize(12);
          doc.text('Content type not supported in PDF export', 20, yPosition);
          yPosition += 10;
      }
      
      yPosition += 10; // Space between sections
    }

    return doc.output('blob');
  }

  private addMetricsToPDF(doc: jsPDF, metrics: AnalyticsMetric[], yPosition: number): number {
    doc.setFontSize(12);
    let yPos = yPosition;
    
    metrics.forEach(metric => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(`${metric.name}: ${this.formatMetricValue(metric)}`, 25, yPos);
      yPos += 7;
    });
    
    return yPos;
  }

  private addTextToPDF(doc: jsPDF, content: Record<string, unknown>, yPosition: number): number {
    doc.setFontSize(12);
    const text = (content.text as string) || 'No text content';
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, yPosition);
    return yPosition + (lines.length * 7);
  }

  private addProjectProfitabilityToPDF(doc: jsPDF, projects: ProjectProfitabilityReport[], yPosition: number): number {
    doc.setFontSize(12);
    let yPos = yPosition;
    
    // Add table header
    doc.setFont(undefined, 'bold');
    doc.text('Project | Revenue | Costs | Profit | Margin | ROI', 20, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    // Add project data
    projects.forEach(project => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      const row = `${project.projectName} | €${project.totalRevenue.toLocaleString()} | €${project.totalCosts.toLocaleString()} | €${project.profit.toLocaleString()} | ${project.profitMargin}% | ${project.roi}%`;
      doc.text(row, 20, yPos);
      yPos += 7;
    });
    
    return yPos;
  }

  private async exportToExcel(reportData: CustomReportData, options: ExportOptions): Promise<string> {
    const workbook = XLSXUtils.book_new();
    workbook.Props = {
      Title: reportData.title,
      Subject: reportData.description,
      Author: "Bauplan Buddy",
      CreatedDate: new Date(reportData.generatedAt)
    };

    // Create worksheet for each section
    reportData.sections.forEach(section => {
      const worksheetData = this.prepareSectionForExcel(section);
      const worksheet = XLSXUtils.aoa_to_sheet(worksheetData);
      XLSXUtils.book_append_sheet(workbook, worksheet, section.title.substring(0, 31)); // Excel sheet names limited to 31 chars
    });

    // Generate filename
    const filename = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // In a real implementation, we would save the file
    // writeXLSXFile(workbook, filename);
    
    // For now, we'll return the filename
    return filename;
  }

  private prepareSectionForExcel(section: ReportSectionData): (string | number)[][] {
    const data: (string | number)[][] = [];
    
    // Add section title as first row
    data.push([section.title]);
    
    switch (section.type) {
      case 'metrics':
        // Add header row
        data.push(['Metric', 'Value', 'Previous Value', 'Change', 'Trend']);
        // Add metric data
        (section.content as AnalyticsMetric[]).forEach(metric => {
          data.push([
            metric.name,
            this.formatMetricValue(metric),
            metric.previousValue ? this.formatMetricValue({...metric, value: metric.previousValue}) : '',
            metric.change ? `${metric.change >= 0 ? '+' : ''}${metric.change}` : '',
            metric.trend
          ]);
        });
        break;
      case 'project-profitability':
        // Add header row
        data.push(['Project', 'Revenue', 'Costs', 'Profit', 'Margin %', 'ROI %']);
        // Add project data
        (section.content as ProjectProfitabilityReport[]).forEach(project => {
          data.push([
            project.projectName,
            project.totalRevenue,
            project.totalCosts,
            project.profit,
            project.profitMargin,
            project.roi
          ]);
        });
        break;
      case 'text':
        data.push([(section.content as Record<string, unknown>).text as string || '']);
        break;
      default:
        data.push(['Content type not supported in Excel export']);
    }
    
    return data;
  }

  private async exportToCSV(reportData: CustomReportData, options: ExportOptions): Promise<string> {
    let csvContent = '';
    
    // Add report metadata
    csvContent += `Title,${reportData.title}\n`;
    csvContent += `Description,${reportData.description}\n`;
    csvContent += `Generated,${new Date(reportData.generatedAt).toISOString()}\n\n`;
    
    // Add sections
    reportData.sections.forEach(section => {
      csvContent += `${section.title}\n`;
      
      switch (section.type) {
        case 'metrics':
          csvContent += 'Metric,Value,Previous Value,Change,Trend\n';
          (section.content as AnalyticsMetric[]).forEach(metric => {
            csvContent += `${metric.name},${this.formatMetricValue(metric)},${metric.previousValue || ''},${metric.change || ''},${metric.trend}\n`;
          });
          break;
        case 'project-profitability':
          csvContent += 'Project,Revenue,Costs,Profit,Margin %,ROI %\n';
          (section.content as ProjectProfitabilityReport[]).forEach(project => {
            csvContent += `${project.projectName},${project.totalRevenue},${project.totalCosts},${project.profit},${project.profitMargin},${project.roi}\n`;
          });
          break;
        case 'text':
          csvContent += `${(section.content as Record<string, unknown>).text || ''}\n`;
          break;
        default:
          csvContent += 'Content type not supported in CSV export\n';
      }
      
      csvContent += '\n';
    });
    
    return csvContent;
  }

  private formatMetricValue(metric: AnalyticsMetric): string {
    switch (metric.format) {
      case 'currency':
        return `€${metric.value.toLocaleString()}`;
      case 'percentage':
        return `${metric.value}%`;
      case 'duration':
        return `${metric.value} days`;
      default:
        return metric.value.toString();
    }
  }

  private getStoredSchedules(): ReportSchedule[] {
    try {
      const data = localStorage.getItem('enhanced-reporting-schedules');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveSchedules(schedules: ReportSchedule[]): void {
    localStorage.setItem('enhanced-reporting-schedules', JSON.stringify(schedules));
  }
}

export default EnhancedReportingService.getInstance();