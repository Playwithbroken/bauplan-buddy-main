/**
 * AI Insights Service
 * Provides intelligent project analytics, risk detection, and recommendations
 */

export type InsightType = 'risk' | 'opportunity' | 'recommendation' | 'trend';
export type InsightSeverity = 'low' | 'medium' | 'high';

export interface ProjectInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  confidence: number;
  timestamp: Date;
  projectId?: string;
  metadata?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  budget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'delayed' | 'completed';
  teamSize: number;
}

class AIInsightsService {
  /**
   * Generate insights for all projects
   */
  async generateInsights(projects: Project[]): Promise<ProjectInsight[]> {
    const insights: ProjectInsight[] = [];

    for (const project of projects) {
      // Budget analysis
      insights.push(...this.analyzeBudget(project));
      
      // Timeline analysis
      insights.push(...this.analyzeTimeline(project));
      
      // Resource analysis
      insights.push(...this.analyzeResources(project));
    }

    // Cross-project analysis
    insights.push(...this.analyzeTrends(projects));
    insights.push(...this.findOptimizations(projects));

    // Sort by severity and confidence
    return insights.sort((a, b) => {
      const severityWeight = { high: 3, medium: 2, low: 1 };
      const aDiff = severityWeight[a.severity] * a.confidence;
      const bDiff = severityWeight[b.severity] * b.confidence;
      return bDiff - aDiff;
    });
  }

  /**
   * Analyze project budget for risks and opportunities
   */
  private analyzeBudget(project: Project): ProjectInsight[] {
    const insights: ProjectInsight[] = [];
    const budgetUsage = (project.spent / project.budget) * 100;
    const daysElapsed = Math.floor(
      (Date.now() - project.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.floor(
      (project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const timeProgress = (daysElapsed / totalDays) * 100;

    // Budget overrun risk
    if (budgetUsage > timeProgress + 15) {
      insights.push({
        id: `budget-risk-${project.id}`,
        type: 'risk',
        severity: budgetUsage > timeProgress + 30 ? 'high' : 'medium',
        title: `${project.name}: Budget Overrun Risk`,
        description: `Project is ${Math.round(budgetUsage - timeProgress)}% over expected budget usage`,
        impact: `Potential overrun of €${Math.round((project.spent / timeProgress * 100) - project.budget).toLocaleString()}`,
        actionItems: [
          'Review material costs and negotiate with suppliers',
          'Optimize labor allocation',
          'Consider scope adjustments',
        ],
        confidence: 0.85,
        timestamp: new Date(),
        projectId: project.id,
      });
    }

    // Budget opportunity
    if (budgetUsage < timeProgress - 10 && project.status === 'active') {
      insights.push({
        id: `budget-opportunity-${project.id}`,
        type: 'opportunity',
        severity: 'low',
        title: `${project.name}: Under Budget`,
        description: `Project is ${Math.round(timeProgress - budgetUsage)}% under expected budget`,
        impact: `Potential savings of €${Math.round(project.budget - (project.spent / timeProgress * 100)).toLocaleString()}`,
        actionItems: [
          'Consider quality upgrades',
          'Invest in additional features',
          'Build contingency buffer',
        ],
        confidence: 0.75,
        timestamp: new Date(),
        projectId: project.id,
      });
    }

    return insights;
  }

  /**
   * Analyze project timeline for delays
   */
  private analyzeTimeline(project: Project): ProjectInsight[] {
    const insights: ProjectInsight[] = [];
    const now = new Date();
    const daysUntilDeadline = Math.floor(
      (project.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Approaching deadline
    if (daysUntilDeadline <= 14 && daysUntilDeadline > 0 && project.status === 'active') {
      insights.push({
        id: `deadline-warning-${project.id}`,
        type: 'risk',
        severity: daysUntilDeadline <= 7 ? 'high' : 'medium',
        title: `${project.name}: Deadline Approaching`,
        description: `Only ${daysUntilDeadline} days remaining until project deadline`,
        impact: 'Potential delays may affect client satisfaction and future contracts',
        actionItems: [
          'Increase team resources if possible',
          'Prioritize critical path tasks',
          'Communicate timeline with stakeholders',
        ],
        confidence: 0.95,
        timestamp: new Date(),
        projectId: project.id,
      });
    }

    // Delayed project
    if (project.status === 'delayed') {
      insights.push({
        id: `project-delayed-${project.id}`,
        type: 'risk',
        severity: 'high',
        title: `${project.name}: Project Delayed`,
        description: 'Project is currently behind schedule',
        impact: 'May result in penalties, lost revenue, and damaged reputation',
        actionItems: [
          'Conduct root cause analysis',
          'Develop recovery plan',
          'Negotiate deadline extension if needed',
        ],
        confidence: 1.0,
        timestamp: new Date(),
        projectId: project.id,
      });
    }

    return insights;
  }

  /**
   * Analyze resource allocation
   */
  private analyzeResources(project: Project): ProjectInsight[] {
    const insights: ProjectInsight[] = [];
    const budgetPerPerson = project.budget / project.teamSize;

    // Small team for large budget
    if (budgetPerPerson > 100000 && project.teamSize < 5) {
      insights.push({
        id: `resource-opportunity-${project.id}`,
        type: 'recommendation',
        severity: 'medium',
        title: `${project.name}: Consider Team Expansion`,
        description: `High budget-to-team ratio (€${Math.round(budgetPerPerson).toLocaleString()} per person)`,
        impact: 'Adding team members could accelerate delivery',
        actionItems: [
          'Evaluate hiring additional specialists',
          'Consider subcontractors for specific tasks',
          'Review workload distribution',
        ],
        confidence: 0.7,
        timestamp: new Date(),
        projectId: project.id,
      });
    }

    return insights;
  }

  /**
   * Analyze trends across all projects
   */
  private analyzeTrends(projects: Project[]): ProjectInsight[] {
    const insights: ProjectInsight[] = [];
    
    if (projects.length < 2) return insights;

    // Calculate average budget overrun
    const overruns = projects
      .filter(p => p.status === 'completed' || p.status === 'active')
      .map(p => ((p.spent / p.budget) - 1) * 100);

    if (overruns.length > 0) {
      const avgOverrun = overruns.reduce((a, b) => a + b, 0) / overruns.length;

      if (avgOverrun > 10) {
        insights.push({
          id: 'trend-budget-overrun',
          type: 'trend',
          severity: 'high',
          title: 'Budget Overrun Trend Detected',
          description: `Projects averaging ${Math.round(avgOverrun)}% over budget`,
          impact: 'Systematic cost control issues affecting profitability',
          actionItems: [
            'Review estimation methodology',
            'Implement stricter budget controls',
            'Analyze cost drivers across projects',
          ],
          confidence: 0.9,
          timestamp: new Date(),
        });
      }
    }

    // Delayed projects trend
    const delayedCount = projects.filter(p => p.status === 'delayed').length;
    const delayedPercentage = (delayedCount / projects.length) * 100;

    if (delayedPercentage > 25) {
      insights.push({
        id: 'trend-delays',
        type: 'trend',
        severity: 'high',
        title: 'High Delay Rate Across Projects',
        description: `${delayedCount} of ${projects.length} projects (${Math.round(delayedPercentage)}%) are delayed`,
        impact: 'Systematic scheduling issues affecting delivery reliability',
        actionItems: [
          'Review project planning process',
          'Identify common bottlenecks',
          'Improve resource allocation',
        ],
        confidence: 0.95,
        timestamp: new Date(),
      });
    }

    return insights;
  }

  /**
   * Find optimization opportunities across projects
   */
  private findOptimizations(projects: Project[]): ProjectInsight[] {
    const insights: ProjectInsight[] = [];

    // Resource sharing opportunity
    const activeProjects = projects.filter(p => p.status === 'active');
    if (activeProjects.length >= 3) {
      insights.push({
        id: 'optimization-resource-sharing',
        type: 'opportunity',
        severity: 'medium',
        title: 'Resource Sharing Opportunity',
        description: `${activeProjects.length} active projects could benefit from shared resources`,
        impact: 'Potential cost savings of 15-20% through equipment and specialist sharing',
        actionItems: [
          'Create shared resource pool',
          'Coordinate project schedules',
          'Implement resource booking system',
        ],
        confidence: 0.75,
        timestamp: new Date(),
      });
    }

    return insights;
  }

  /**
   * Generate mock insights for demo purposes
   */
  generateMockInsights(): ProjectInsight[] {
    return [
      {
        id: 'mock-1',
        type: 'risk',
        severity: 'high',
        title: 'Office Building Renovation: Budget Overrun Risk',
        description: 'Project is 23% over expected budget usage at current timeline',
        impact: 'Potential overrun of €45,000',
        actionItems: [
          'Review material costs with suppliers',
          'Optimize labor allocation',
          'Consider scope adjustments',
        ],
        confidence: 0.87,
        timestamp: new Date(),
        projectId: 'proj-1',
      },
      {
        id: 'mock-2',
        type: 'opportunity',
        severity: 'medium',
        title: 'Resource Sharing Opportunity',
        description: '3 active projects could benefit from shared equipment',
        impact: 'Potential savings of €12,000 through equipment sharing',
        actionItems: [
          'Create shared equipment pool',
          'Coordinate project schedules',
          'Implement booking system',
        ],
        confidence: 0.75,
        timestamp: new Date(),
      },
      {
        id: 'mock-3',
        type: 'recommendation',
        severity: 'low',
        title: 'Weather Optimization',
        description: 'Optimal weather conditions next week for outdoor work',
        impact: 'Schedule concrete work for 15% faster curing',
        actionItems: [
          'Schedule concrete pour for Tuesday-Thursday',
          'Prepare materials in advance',
          'Notify subcontractors',
        ],
        confidence: 0.92,
        timestamp: new Date(),
      },
      {
        id: 'mock-4',
        type: 'trend',
        severity: 'medium',
        title: 'Labor Costs Trending Higher',
        description: 'Labor costs are 18% higher than Q3 average',
        impact: 'Affecting project profitability margins',
        actionItems: [
          'Negotiate rates with subcontractors',
          'Review staffing efficiency',
          'Consider automation opportunities',
        ],
        confidence: 0.82,
        timestamp: new Date(),
      },
    ];
  }
}

export const aiInsightsService = new AIInsightsService();
export default aiInsightsService;
