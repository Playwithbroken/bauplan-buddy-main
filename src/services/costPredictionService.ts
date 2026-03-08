/**
 * Cost Prediction Service
 * AI-powered cost estimation based on project history
 */

export interface ProjectData {
  id: string;
  type: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation';
  size: number; // Square meters
  location: string;
  duration: number; // Days
  actualCost: number;
  estimatedCost: number;
  completedAt: Date;
  features: string[];
  complexity: 'low' | 'medium' | 'high';
}

export interface CostPrediction {
  estimatedTotal: number;
  confidence: number;
  range: {
    low: number;
    high: number;
  };
  breakdown: CostBreakdown[];
  factors: CostFactor[];
  historicalComparison: {
    similarProjects: number;
    averageCost: number;
    averageVariance: number;
  };
  risks: CostRisk[];
  recommendations: string[];
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  unit?: string;
  unitCost?: number;
}

export interface CostFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  adjustment: number; // Percentage adjustment
  description: string;
}

export interface CostRisk {
  category: string;
  probability: 'low' | 'medium' | 'high';
  impact: number; // Potential cost increase
  mitigation: string;
}

export interface PredictionInput {
  projectType: ProjectData['type'];
  size: number;
  location: string;
  duration?: number;
  complexity: ProjectData['complexity'];
  features: string[];
  startDate?: Date;
}

// Base costs per square meter by project type (in EUR)
const BASE_COSTS: Record<ProjectData['type'], number> = {
  residential: 2200,
  commercial: 1800,
  industrial: 1200,
  infrastructure: 3500,
  renovation: 1500,
};

// Complexity multipliers
const COMPLEXITY_MULTIPLIERS: Record<ProjectData['complexity'], number> = {
  low: 0.85,
  medium: 1.0,
  high: 1.35,
};

// Regional cost adjustments (simplified for Germany)
const REGIONAL_ADJUSTMENTS: Record<string, number> = {
  münchen: 1.25,
  munich: 1.25,
  frankfurt: 1.20,
  hamburg: 1.15,
  düsseldorf: 1.12,
  köln: 1.10,
  cologne: 1.10,
  stuttgart: 1.15,
  berlin: 1.08,
  default: 1.00,
};

// Feature cost adjustments
const FEATURE_COSTS: Record<string, { fixed: number; perSqm: number }> = {
  'solar': { fixed: 15000, perSqm: 50 },
  'smart-home': { fixed: 8000, perSqm: 30 },
  'elevator': { fixed: 45000, perSqm: 0 },
  'pool': { fixed: 35000, perSqm: 0 },
  'geothermal': { fixed: 25000, perSqm: 20 },
  'accessible': { fixed: 5000, perSqm: 80 },
  'high-end-finish': { fixed: 0, perSqm: 400 },
  'basement': { fixed: 0, perSqm: 350 },
  'green-roof': { fixed: 0, perSqm: 120 },
  'fire-protection': { fixed: 10000, perSqm: 25 },
};

// Mock historical data for predictions
const MOCK_HISTORICAL_DATA: ProjectData[] = [
  {
    id: '1',
    type: 'residential',
    size: 180,
    location: 'Berlin',
    duration: 240,
    actualCost: 420000,
    estimatedCost: 400000,
    completedAt: new Date('2024-06-15'),
    features: ['smart-home'],
    complexity: 'medium',
  },
  {
    id: '2',
    type: 'commercial',
    size: 500,
    location: 'München',
    duration: 180,
    actualCost: 1200000,
    estimatedCost: 1100000,
    completedAt: new Date('2024-03-20'),
    features: ['elevator', 'fire-protection'],
    complexity: 'high',
  },
  {
    id: '3',
    type: 'renovation',
    size: 120,
    location: 'Hamburg',
    duration: 90,
    actualCost: 185000,
    estimatedCost: 170000,
    completedAt: new Date('2024-08-10'),
    features: ['accessible'],
    complexity: 'medium',
  },
];

class CostPredictionService {
  private historicalData: ProjectData[] = MOCK_HISTORICAL_DATA;

  /**
   * Load historical project data
   */
  loadHistoricalData(data: ProjectData[]): void {
    this.historicalData = data;
  }

  /**
   * Predict project costs based on input parameters
   */
  async predictCost(input: PredictionInput): Promise<CostPrediction> {
    // Calculate base cost
    const baseCostPerSqm = BASE_COSTS[input.projectType];
    const baseCost = baseCostPerSqm * input.size;

    // Apply complexity multiplier
    const complexityMultiplier = COMPLEXITY_MULTIPLIERS[input.complexity];

    // Apply regional adjustment
    const locationKey = input.location.toLowerCase();
    const regionalMultiplier = REGIONAL_ADJUSTMENTS[locationKey] || REGIONAL_ADJUSTMENTS.default;

    // Calculate feature costs
    let featureCosts = 0;
    const featureBreakdown: CostBreakdown[] = [];
    
    for (const feature of input.features) {
      const featureCost = FEATURE_COSTS[feature];
      if (featureCost) {
        const totalFeatureCost = featureCost.fixed + (featureCost.perSqm * input.size);
        featureCosts += totalFeatureCost;
        featureBreakdown.push({
          category: feature,
          amount: totalFeatureCost,
          percentage: 0, // Will calculate after total
        });
      }
    }

    // Calculate adjusted base cost
    const adjustedBaseCost = baseCost * complexityMultiplier * regionalMultiplier;

    // Collect cost factors
    const factors: CostFactor[] = [];
    
    if (complexityMultiplier !== 1) {
      factors.push({
        name: 'Projektkomplexität',
        impact: complexityMultiplier > 1 ? 'negative' : 'positive',
        adjustment: (complexityMultiplier - 1) * 100,
        description: input.complexity === 'high' 
          ? 'Hohe Komplexität erhöht die Kosten'
          : input.complexity === 'low'
          ? 'Geringe Komplexität reduziert die Kosten'
          : 'Standardkomplexität',
      });
    }

    if (regionalMultiplier !== 1) {
      factors.push({
        name: 'Regionale Faktoren',
        impact: regionalMultiplier > 1 ? 'negative' : 'positive',
        adjustment: (regionalMultiplier - 1) * 100,
        description: `Standort ${input.location} - ${regionalMultiplier > 1 ? 'überdurchschnittliche' : 'unterdurchschnittliche'} Baukosten`,
      });
    }

    // Seasonal adjustment
    const seasonalMultiplier = this.getSeasonalMultiplier(input.startDate);
    if (seasonalMultiplier !== 1) {
      factors.push({
        name: 'Saisonale Faktoren',
        impact: seasonalMultiplier > 1 ? 'negative' : 'positive',
        adjustment: (seasonalMultiplier - 1) * 100,
        description: seasonalMultiplier > 1 
          ? 'Bauhauptsaison - höhere Auslastung'
          : 'Nebensaison - mögliche Rabatte',
      });
    }

    // Market conditions (simulated)
    const marketMultiplier = 1.05; // Simulate current market conditions
    factors.push({
      name: 'Marktentwicklung',
      impact: 'negative',
      adjustment: 5,
      description: 'Aktuelle Materialpreise und Fachkräftemangel',
    });

    // Calculate total estimate
    const totalBeforeMarket = adjustedBaseCost + featureCosts;
    const totalWithSeasons = totalBeforeMarket * seasonalMultiplier;
    const estimatedTotal = totalWithSeasons * marketMultiplier;

    // Calculate breakdown
    const breakdown: CostBreakdown[] = [
      {
        category: 'Rohbau',
        amount: estimatedTotal * 0.35,
        percentage: 35,
        unit: 'm²',
        unitCost: (estimatedTotal * 0.35) / input.size,
      },
      {
        category: 'Innenausbau',
        amount: estimatedTotal * 0.25,
        percentage: 25,
        unit: 'm²',
        unitCost: (estimatedTotal * 0.25) / input.size,
      },
      {
        category: 'Haustechnik',
        amount: estimatedTotal * 0.20,
        percentage: 20,
      },
      {
        category: 'Außenanlagen',
        amount: estimatedTotal * 0.08,
        percentage: 8,
      },
      {
        category: 'Planung & Genehmigungen',
        amount: estimatedTotal * 0.07,
        percentage: 7,
      },
      {
        category: 'Reserve',
        amount: estimatedTotal * 0.05,
        percentage: 5,
      },
    ];

    // Add feature breakdown
    featureBreakdown.forEach(fb => {
      fb.percentage = (fb.amount / estimatedTotal) * 100;
    });

    // Find similar historical projects
    const similarProjects = this.findSimilarProjects(input);
    const historicalAverage = similarProjects.length > 0
      ? similarProjects.reduce((sum, p) => sum + (p.actualCost / p.size), 0) / similarProjects.length * input.size
      : estimatedTotal;
    
    const historicalVariance = similarProjects.length > 0
      ? similarProjects.reduce((sum, p) => {
          const variance = Math.abs(p.actualCost - p.estimatedCost) / p.estimatedCost;
          return sum + variance;
        }, 0) / similarProjects.length
      : 0.1;

    // Calculate confidence based on historical data
    const confidence = Math.max(0.6, Math.min(0.95, 0.85 - (historicalVariance / 2)));

    // Calculate range
    const varianceAmount = estimatedTotal * (historicalVariance + 0.05);
    const range = {
      low: Math.round(estimatedTotal * 0.9 - varianceAmount),
      high: Math.round(estimatedTotal * 1.1 + varianceAmount),
    };

    // Identify risks
    const risks = this.identifyRisks(input, factors);

    // Generate recommendations
    const recommendations = this.generateRecommendations(input, factors, risks);

    return {
      estimatedTotal: Math.round(estimatedTotal),
      confidence,
      range,
      breakdown: [...breakdown, ...featureBreakdown],
      factors,
      historicalComparison: {
        similarProjects: similarProjects.length,
        averageCost: Math.round(historicalAverage),
        averageVariance: historicalVariance,
      },
      risks,
      recommendations,
    };
  }

  /**
   * Get cost trend over time
   */
  async getCostTrend(
    projectType: ProjectData['type'],
    months: number = 12
  ): Promise<Array<{ month: string; avgCostPerSqm: number }>> {
    const trend: Array<{ month: string; avgCostPerSqm: number }> = [];
    const baseRate = BASE_COSTS[projectType];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Simulate gradual cost increase with some variation
      const monthlyIncrease = 1 + (0.003 * (months - i)); // ~3.6% annual increase
      const variation = 1 + (Math.random() - 0.5) * 0.04; // ±2% random variation
      
      trend.push({
        month: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        avgCostPerSqm: Math.round(baseRate * monthlyIncrease * variation),
      });
    }

    return trend;
  }

  // Private helpers

  private getSeasonalMultiplier(startDate?: Date): number {
    if (!startDate) return 1;

    const month = startDate.getMonth();
    
    // Construction high season: April-October
    if (month >= 3 && month <= 9) {
      return 1.05;
    }
    // Low season: November-March
    return 0.97;
  }

  private findSimilarProjects(input: PredictionInput): ProjectData[] {
    return this.historicalData.filter(project => {
      // Same project type
      if (project.type !== input.projectType) return false;

      // Similar size (within 50%)
      const sizeRatio = project.size / input.size;
      if (sizeRatio < 0.5 || sizeRatio > 2) return false;

      // Similar complexity
      if (project.complexity !== input.complexity) return false;

      return true;
    });
  }

  private identifyRisks(input: PredictionInput, factors: CostFactor[]): CostRisk[] {
    const risks: CostRisk[] = [];

    // High complexity risk
    if (input.complexity === 'high') {
      risks.push({
        category: 'Projektkomplexität',
        probability: 'high',
        impact: 15,
        mitigation: 'Detaillierte Planung und regelmäßige Reviews',
      });
    }

    // Large project risk
    if (input.size > 500) {
      risks.push({
        category: 'Projektgröße',
        probability: 'medium',
        impact: 10,
        mitigation: 'Bauabschnitte definieren und Meilensteine setzen',
      });
    }

    // Many features risk
    if (input.features.length > 3) {
      risks.push({
        category: 'Technische Anforderungen',
        probability: 'medium',
        impact: 8,
        mitigation: 'Erfahrene Fachplaner einbinden',
      });
    }

    // Material price risk
    risks.push({
      category: 'Materialpreise',
      probability: 'medium',
      impact: 5,
      mitigation: 'Frühzeitige Materialbeschaffung und Festpreise vereinbaren',
    });

    // Labor shortage risk
    risks.push({
      category: 'Fachkräfteverfügbarkeit',
      probability: 'medium',
      impact: 7,
      mitigation: 'Frühzeitige Kapazitätsplanung mit Gewerken',
    });

    return risks;
  }

  private generateRecommendations(
    input: PredictionInput,
    factors: CostFactor[],
    risks: CostRisk[]
  ): string[] {
    const recommendations: string[] = [];

    // Time-based recommendations
    const now = new Date();
    const month = now.getMonth();
    if (month >= 3 && month <= 6) {
      recommendations.push(
        'Erwägen Sie einen Baubeginn im Herbst für potenziell günstigere Konditionen'
      );
    }

    // Complexity recommendations
    if (input.complexity === 'high') {
      recommendations.push(
        'Bei hoher Komplexität sollte eine erweiterte Planungsphase einkalkuliert werden'
      );
    }

    // Size recommendations
    if (input.size > 300) {
      recommendations.push(
        'Bei größeren Projekten können Mengenrabatte bei Materialbestellungen erzielt werden'
      );
    }

    // Feature recommendations
    if (input.features.includes('solar') && input.features.includes('geothermal')) {
      recommendations.push(
        'Kombinierte Energiesysteme qualifizieren für erhöhte Förderungen'
      );
    }

    // General recommendations
    recommendations.push(
      'Holen Sie mindestens drei Vergleichsangebote für jeden Hauptgewerksbereich ein'
    );

    if (risks.some(r => r.category === 'Materialpreise')) {
      recommendations.push(
        'Fixieren Sie Materialpreise für kritische Komponenten frühzeitig vertraglich'
      );
    }

    return recommendations.slice(0, 5);
  }
}

// Export singleton
export const costPredictionService = new CostPredictionService();
export default costPredictionService;
