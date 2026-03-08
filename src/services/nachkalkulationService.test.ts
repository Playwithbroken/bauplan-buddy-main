import { describe, test, expect, beforeEach } from 'vitest';
import { NachkalkulationService } from '../services/nachkalkulationService';
import { ProjectBudgetService } from '../services/projectBudgetService';

// Mock project data for testing
const mockProject = {
  id: 'TEST-PROJECT-001',
  name: 'Test Wohnhaus',
  description: 'Test project for Nachkalkulation',
  category: 'residential',
  status: 'completed' as const,
  priority: 'high' as const,
  startDate: '2024-01-01',
  endDate: '2024-06-30',
  actualStartDate: '2024-01-01',
  actualEndDate: '2024-07-15',
  progress: 100,
  budget: 400000,
  actualCost: 420000,
  invoicedAmount: 450000,
  clientId: 'test-client',
  projectManagerId: 'test-pm',
  teamMembers: ['team-001'],
  location: {
    address: 'Test Address 123',
    coordinates: { lat: 0, lng: 0 }
  },
  phases: [],
  tasks: [],
  milestones: [],
  documents: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-07-15T00:00:00Z',
  createdBy: 'test-user',
  tags: ['test'],
  customFields: {}
};

// Mock budget data
const mockBudget = {
  projectId: 'TEST-PROJECT-001',
  totalBudget: 400000,
  approvedBudget: 400000,
  spentAmount: 420000,
  commitments: 0,
  availableBudget: -20000,
  contingencyBudget: 40000,
  categories: [
    {
      id: 'test-budget-1',
      projectId: 'TEST-PROJECT-001',
      categoryId: 'cat-material',
      name: 'Test Materials',
      estimatedCost: 200000,
      actualCost: 220000,
      approvedBudget: 200000,
      remainingBudget: -20000,
      contingency: 20000,
      status: 'overbudget' as const,
      priority: 'high' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'test-budget-2',
      projectId: 'TEST-PROJECT-001',
      categoryId: 'cat-labor',
      name: 'Test Labor',
      estimatedCost: 150000,
      actualCost: 140000,
      approvedBudget: 150000,
      remainingBudget: 10000,
      contingency: 15000,
      status: 'under_budget' as const,
      priority: 'high' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'test-budget-3',
      projectId: 'TEST-PROJECT-001',
      categoryId: 'cat-equipment',
      name: 'Test Equipment',
      estimatedCost: 50000,
      actualCost: 60000,
      approvedBudget: 50000,
      remainingBudget: -10000,
      contingency: 5000,
      status: 'over_budget' as const,
      priority: 'medium' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ],
  variances: [],
  cashFlow: [],
  forecasts: [],
  lastUpdated: '2024-07-15T00:00:00Z'
};

// Mock cost entries
const mockCostEntries = [
  {
    id: 'test-cost-1',
    projectId: 'TEST-PROJECT-001',
    categoryId: 'cat-material',
    description: 'Test Material Cost 1',
    amount: 120000,
    currency: 'EUR',
    type: 'material' as const,
    date: '2024-02-15',
    isApproved: true,
    tags: ['material'],
    createdBy: 'test-user',
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    id: 'test-cost-2',
    projectId: 'TEST-PROJECT-001',
    categoryId: 'cat-material',
    description: 'Test Material Cost 2',
    amount: 100000,
    currency: 'EUR',
    type: 'material' as const,
    date: '2024-04-20',
    isApproved: true,
    tags: ['material'],
    createdBy: 'test-user',
    createdAt: '2024-04-20T00:00:00Z'
  },
  {
    id: 'test-cost-3',
    projectId: 'TEST-PROJECT-001',
    categoryId: 'cat-labor',
    description: 'Test Labor Cost',
    amount: 140000,
    currency: 'EUR',
    type: 'labor' as const,
    date: '2024-05-10',
    isApproved: true,
    tags: ['labor'],
    createdBy: 'test-user',
    createdAt: '2024-05-10T00:00:00Z'
  },
  {
    id: 'test-cost-4',
    projectId: 'TEST-PROJECT-001',
    categoryId: 'cat-equipment',
    description: 'Test Equipment Cost',
    amount: 60000,
    currency: 'EUR',
    type: 'equipment' as const,
    date: '2024-06-05',
    isApproved: true,
    tags: ['equipment'],
    createdBy: 'test-user',
    createdAt: '2024-06-05T00:00:00Z'
  }
];

describe('NachkalkulationService', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Mock ProjectBudgetService methods
    jest.spyOn(ProjectBudgetService, 'getProjectBudget').mockReturnValue(mockBudget);
    jest.spyOn(ProjectBudgetService, 'getProjectCostEntries').mockReturnValue(mockCostEntries);
  });

  test('should generate basic Nachkalkulation successfully', () => {
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    expect(result).toBeDefined();
    expect(result.projectId).toBe(mockProject.id);
    expect(result.projectName).toBe(mockProject.name);
    expect(result.status).toBe('final');
    expect(result.calculatedBy).toBe('test-user');
  });

  test('should calculate financial analysis correctly', () => {
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    expect(result.financial.plannedCosts).toBe(400000);
    expect(result.financial.actualCosts).toBe(420000);
    expect(result.financial.costVariance).toBe(20000);
    expect(result.financial.plannedRevenue).toBe(400000);
    expect(result.financial.actualRevenue).toBe(450000);
    expect(result.financial.actualProfit).toBe(30000); // 450000 - 420000
  });

  test('should calculate project duration correctly', () => {
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    expect(result.projectInfo.duration.planned).toBe(181); // days from Jan 1 to Jun 30
    expect(result.projectInfo.duration.actual).toBe(197); // days from Jan 1 to Jul 15
    expect(result.projectInfo.duration.variance).toBe(16); // 15 days delay
  });

  test('should analyze categories correctly', () => {
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    expect(result.costAnalysis.categories).toHaveLength(3);
    
    const materialCategory = result.costAnalysis.categories.find(c => c.categoryId === 'cat-material');
    expect(materialCategory).toBeDefined();
    expect(materialCategory?.planned.cost).toBe(200000);
    expect(materialCategory?.actual.cost).toBe(220000);
    expect(materialCategory?.variance.absolute).toBe(20000);
    expect(materialCategory?.status).toBe('over_budget');
  });

  test('should calculate performance metrics', () => {
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    expect(result.performance.costPerformanceIndex).toBeDefined();
    expect(result.performance.schedulePerformanceIndex).toBeDefined();
    expect(typeof result.performance.costPerformanceIndex).toBe('number');
  });

  test('should identify risks and recommendations', () => {
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    expect(result.riskAnalysis).toBeDefined();
    expect(result.riskAnalysis.budgetOverruns).toBeDefined();
    expect(result.riskAnalysis.recommendations).toBeDefined();
    expect(Array.isArray(result.riskAnalysis.recommendations)).toBe(true);
  });

  test('should generate lessons learned', () => {
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    expect(result.lessonsLearned).toBeDefined();
    expect(result.lessonsLearned.successes).toBeDefined();
    expect(result.lessonsLearned.challenges).toBeDefined();
    expect(result.lessonsLearned.improvements).toBeDefined();
    expect(result.lessonsLearned.futureRecommendations).toBeDefined();
  });

  test('should save and retrieve Nachkalkulation', () => {
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    // Should be able to retrieve the same data
    const retrieved = NachkalkulationService.getNachkalkulation(mockProject.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.projectId).toBe(result.projectId);
    expect(retrieved?.financial.costVariance).toBe(result.financial.costVariance);
  });

  test('should generate comprehensive report', () => {
    NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    const report = NachkalkulationService.generateReport(mockProject.id);
    expect(report).toBeDefined();
    expect(report?.data).toBeDefined();
    expect(report?.charts).toBeDefined();
    expect(report?.exportOptions).toBeDefined();
    
    expect(report?.charts.costComparison).toBeDefined();
    expect(report?.charts.varianceAnalysis).toBeDefined();
    expect(report?.charts.timelineAnalysis).toBeDefined();
    expect(report?.charts.categoryBreakdown).toBeDefined();
  });

  test('should handle missing budget gracefully', () => {
    jest.spyOn(ProjectBudgetService, 'getProjectBudget').mockReturnValue(null);
    
    expect(() => {
      NachkalkulationService.generateNachkalkulation(
        'NONEXISTENT-PROJECT',
        mockProject,
        'test-user'
      );
    }).toThrow('No budget found for project NONEXISTENT-PROJECT');
  });

  test('should update existing Nachkalkulation', () => {
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    const updates = {
      status: 'approved' as const,
      approvedBy: 'manager',
      approvedAt: new Date().toISOString()
    };

    const updated = NachkalkulationService.updateNachkalkulation(mockProject.id, updates);
    expect(updated).toBeDefined();
    expect(updated?.status).toBe('approved');
    expect(updated?.approvedBy).toBe('manager');
  });

  test('should delete Nachkalkulation', () => {
    NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );

    const deleted = NachkalkulationService.deleteNachkalkulation(mockProject.id);
    expect(deleted).toBe(true);

    const retrieved = NachkalkulationService.getNachkalkulation(mockProject.id);
    expect(retrieved).toBeNull();
  });
});

// Integration test
describe('Nachkalkulation Integration', () => {
  test('should work with real localStorage data', () => {
    localStorage.clear();
    
    // Set up real test data
    const testBudget = { ...mockBudget };
    const testCostEntries = [...mockCostEntries];
    
    localStorage.setItem('bauplan-buddy-project-budgets', JSON.stringify([testBudget]));
    localStorage.setItem('bauplan-buddy-cost-entries', JSON.stringify(testCostEntries));
    
    // Reset mocks to use real localStorage
    jest.restoreAllMocks();
    
    const result = NachkalkulationService.generateNachkalkulation(
      mockProject.id,
      mockProject,
      'test-user'
    );
    
    expect(result).toBeDefined();
    expect(result.financial.costVariance).toBe(20000);
    
    // Verify it was saved to localStorage
    const saved = localStorage.getItem('bauplan-buddy-nachkalkulation');
    expect(saved).toBeTruthy();
    
    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].projectId).toBe(mockProject.id);
  });
});

export { mockProject, mockBudget, mockCostEntries };