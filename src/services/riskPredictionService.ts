import { ProjectInsight } from './aiInsightsService';

export interface RiskFactor {
  category: 'budget' | 'timeline' | 'resource' | 'quality' | 'safety';
  score: number; // 0-100, where 100 is high risk
  trend: 'increasing' | 'decreasing' | 'stable';
  details: string[];
}

export interface ProjectRiskProfile {
  projectId: string;
  overallRiskScore: number;
  factors: RiskFactor[];
  predictedDelayDays: number;
  predictedBudgetOverrun: number;
  lastUpdated: Date;
}

class RiskPredictionService {
  /**
   * Analyze project data to predict risks
   * In a real app, this would use ML models or statistical analysis
   */
  analyzeProjectRisks(projectId: string): ProjectRiskProfile {
    // Mock analysis logic
    const baseScore = Math.floor(Math.random() * 40) + 20; // Random base risk
    
    return {
      projectId,
      overallRiskScore: baseScore,
      predictedDelayDays: Math.floor(Math.random() * 14),
      predictedBudgetOverrun: Math.floor(Math.random() * 5000),
      lastUpdated: new Date(),
      factors: [
        {
          category: 'budget',
          score: Math.floor(Math.random() * 100),
          trend: 'increasing',
          details: ['Material costs rising', 'Unexpected scope creep']
        },
        {
          category: 'timeline',
          score: Math.floor(Math.random() * 100),
          trend: 'stable',
          details: ['Weather delays possible', 'Permit approval pending']
        },
        {
          category: 'resource',
          score: Math.floor(Math.random() * 60),
          trend: 'decreasing',
          details: ['Team availability good']
        },
        {
          category: 'quality',
          score: Math.floor(Math.random() * 30),
          trend: 'stable',
          details: ['Standard checks passed']
        },
        {
          category: 'safety',
          score: Math.floor(Math.random() * 20),
          trend: 'stable',
          details: ['No incidents reported']
        }
      ]
    };
  }

  getRiskColor(score: number): string {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  }
  
  getRiskLevel(score: number): 'High' | 'Medium' | 'Low' {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }
}

export const riskPredictionService = new RiskPredictionService();
export default riskPredictionService;
