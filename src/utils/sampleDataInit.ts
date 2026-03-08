// Sample data setup for testing Nachkalkulation functionality
// This script sets up mock project data, budgets, and cost entries in localStorage

import { ProjectBudgetService } from '../services/projectBudgetService';
import { NachkalkulationService } from '../services/nachkalkulationService';
import { db } from '../services/localDatabaseService';

// Initialize sample project budgets and cost entries
export const initializeSampleData = async () => {
  console.log('Initializing sample data for Metallbau Nachkalkulation testing...');

  // Sample project 1: Stahlhalle Industriebau
  const project1Id = 'PRJ-2024-001';
  const project1Budget = {
    projectId: project1Id,
    totalBudget: 450000,
    approvedBudget: 450000,
    spentAmount: 337500,
    commitments: 0,
    availableBudget: 112500,
    contingencyBudget: 45000,
    categories: [
      {
        id: 'budget-item-1',
        projectId: project1Id,
        categoryId: 'cat-steel-materials',
        name: 'Stahlmaterialien',
        description: 'Stahlträger, Bleche, Profile, Rohre',
        estimatedCost: 180000,
        actualCost: 185000,
        approvedBudget: 180000,
        remainingBudget: -5000,
        contingency: 18000,
        status: 'over_budget' as const,
        priority: 'high' as const,
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'budget-item-2',
        projectId: project1Id,
        categoryId: 'cat-fabrication-labor',
        name: 'Fertigungskosten',
        description: 'Schweißer, Schlosser, Fertigungspersonal',
        estimatedCost: 120000,
        actualCost: 115000,
        approvedBudget: 120000,
        remainingBudget: 5000,
        contingency: 12000,
        status: 'under_budget' as const,
        priority: 'high' as const,
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'budget-item-3',
        projectId: project1Id,
        categoryId: 'cat-welding-consumables',
        name: 'Schweißzusätze',
        description: 'Elektroden, Draht, Gase, Flussmittel',
        estimatedCost: 25000,
        actualCost: 28000,
        approvedBudget: 25000,
        remainingBudget: -3000,
        contingency: 2500,
        status: 'over_budget' as const,
        priority: 'medium' as const,
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'budget-item-4',
        projectId: project1Id,
        categoryId: 'cat-surface-treatment',
        name: 'Oberflächenbehandlung',
        description: 'Sandstrahlen, Grundierung, Lackierung',
        estimatedCost: 45000,
        actualCost: 42000,
        approvedBudget: 45000,
        remainingBudget: 3000,
        contingency: 4500,
        status: 'under_budget' as const,
        priority: 'medium' as const,
        startDate: '2024-03-01',
        endDate: '2024-06-30',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'budget-item-5',
        projectId: project1Id,
        categoryId: 'cat-assembly-installation',
        name: 'Montage & Installation',
        description: 'Montagekosten, Transport, Installation vor Ort',
        estimatedCost: 80000,
        actualCost: 67500,
        approvedBudget: 80000,
        remainingBudget: 12500,
        contingency: 8000,
        status: 'under_budget' as const,
        priority: 'high' as const,
        startDate: '2024-05-01',
        endDate: '2024-06-30',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    variances: [],
    cashFlow: [],
    forecasts: [],
    lastUpdated: new Date().toISOString()
  };

  // Sample cost entries for project 1: Stahlhalle
  const project1CostEntries = [
    {
      id: 'cost-entry-1',
      projectId: project1Id,
      budgetItemId: 'budget-item-1',
      categoryId: 'cat-steel-materials',
      description: 'HEB-Träger 200-600mm',
      amount: 45000,
      currency: 'EUR',
      type: 'steel_material' as const,
      date: '2024-01-20',
      isApproved: true,
      approvedBy: 'project-manager',
      approvedAt: '2024-01-21',
      tags: ['traeger', 'stahl'],
      notes: 'Haupttragwerk S355',
      createdBy: 'einkauf',
      createdAt: '2024-01-20T10:00:00Z'
    },
    {
      id: 'cost-entry-2',
      projectId: project1Id,
      budgetItemId: 'budget-item-1',
      categoryId: 'cat-steel-materials',
      description: 'Stahlbleche und Trapezbleche',
      amount: 32000,
      currency: 'EUR',
      type: 'steel_material' as const,
      date: '2024-02-15',
      isApproved: true,
      approvedBy: 'project-manager',
      approvedAt: '2024-02-16',
      tags: ['blech', 'trapez'],
      notes: 'Wandverkleidung und Dach',
      createdBy: 'einkauf',
      createdAt: '2024-02-15T14:30:00Z'
    },
    {
      id: 'cost-entry-3',
      projectId: project1Id,
      budgetItemId: 'budget-item-2',
      categoryId: 'cat-fabrication-labor',
      description: 'Schweißer und Schlosser',
      amount: 65000,
      currency: 'EUR',
      type: 'fabrication_labor' as const,
      date: '2024-02-28',
      isApproved: true,
      approvedBy: 'project-manager',
      approvedAt: '2024-03-01',
      tags: ['schweisser', 'fertigung'],
      notes: 'Fertigungsarbeiten Haupthalle',
      createdBy: 'werkstattleiter',
      createdAt: '2024-02-28T16:00:00Z'
    },
    {
      id: 'cost-entry-4',
      projectId: project1Id,
      budgetItemId: 'budget-item-3',
      categoryId: 'cat-welding-consumables',
      description: 'Schweißelektroden und Schutzgas',
      amount: 15000,
      currency: 'EUR',
      type: 'welding_consumables' as const,
      date: '2024-03-05',
      isApproved: true,
      approvedBy: 'project-manager',
      approvedAt: '2024-03-06',
      tags: ['elektroden', 'gas'],
      notes: 'Verbrauchsmaterial für Schweißarbeiten',
      createdBy: 'werkstattleiter',
      createdAt: '2024-03-05T09:15:00Z'
    },
    {
      id: 'cost-entry-5',
      projectId: project1Id,
      budgetItemId: 'budget-item-4',
      categoryId: 'cat-surface-treatment',
      description: 'Sandstrahlen und Grundierung',
      amount: 28000,
      currency: 'EUR',
      type: 'surface_treatment' as const,
      date: '2024-03-20',
      isApproved: true,
      approvedBy: 'project-manager',
      approvedAt: '2024-03-21',
      tags: ['sandstrahlen', 'grundierung'],
      notes: 'Oberflächenbehandlung Stahlkonstruktion',
      createdBy: 'oberflaechenbehandlung',
      createdAt: '2024-03-20T11:45:00Z'
    },
    // Additional entries
    {
      id: 'cost-entry-6',
      projectId: project1Id,
      budgetItemId: 'budget-item-1',
      categoryId: 'cat-steel-materials',
      description: 'Pfetten und Riegel',
      amount: 28000,
      currency: 'EUR',
      type: 'steel_material' as const,
      date: '2024-04-10',
      isApproved: true,
      tags: ['pfetten', 'riegel'],
      createdBy: 'einkauf',
      createdAt: '2024-04-10T08:30:00Z'
    },
    {
      id: 'cost-entry-7',
      projectId: project1Id,
      budgetItemId: 'budget-item-2',
      categoryId: 'cat-fabrication-labor',
      description: 'CNC-Bearbeitung und Bohrarbeiten',
      amount: 25000,
      currency: 'EUR',
      type: 'fabrication_labor' as const,
      date: '2024-04-25',
      isApproved: true,
      tags: ['cnc', 'bohrung'],
      createdBy: 'cnc-operator',
      createdAt: '2024-04-25T15:20:00Z'
    },
    {
      id: 'cost-entry-8',
      projectId: project1Id,
      budgetItemId: 'budget-item-1',
      categoryId: 'cat-steel-materials',
      description: 'Verbindungsmittel und Schrauben',
      amount: 12000,
      currency: 'EUR',
      type: 'steel_material' as const,
      date: '2024-05-15',
      isApproved: true,
      tags: ['schrauben', 'verbindung'],
      createdBy: 'einkauf',
      createdAt: '2024-05-15T10:00:00Z'
    },
    {
      id: 'cost-entry-9',
      projectId: project1Id,
      budgetItemId: 'budget-item-2',
      categoryId: 'cat-fabrication-labor',
      description: 'Montagevorarbeiten',
      amount: 25000,
      currency: 'EUR',
      type: 'fabrication_labor' as const,
      date: '2024-05-30',
      isApproved: true,
      tags: ['montage', 'vorbereitung'],
      createdBy: 'montageplan',
      createdAt: '2024-05-30T14:10:00Z'
    },
    {
      id: 'cost-entry-10',
      projectId: project1Id,
      budgetItemId: 'budget-item-5',
      categoryId: 'cat-assembly-installation',
      description: 'Kranmiete und Montage vor Ort',
      amount: 35000,
      currency: 'EUR',
      type: 'assembly_installation' as const,
      date: '2024-06-05',
      isApproved: true,
      tags: ['kran', 'montage'],
      createdBy: 'montage-leiter',
      createdAt: '2024-06-05T09:00:00Z'
    },
    {
      id: 'cost-entry-11',
      projectId: project1Id,
      budgetItemId: 'budget-item-3',
      categoryId: 'cat-welding-consumables',
      description: 'Zusätzliche Schweißdrähte',
      amount: 8000,
      currency: 'EUR',
      type: 'welding_consumables' as const,
      date: '2024-06-10',
      isApproved: true,
      tags: ['draht', 'nacharbeit'],
      createdBy: 'werkstattleiter',
      createdAt: '2024-06-10T11:30:00Z'
    },
    {
      id: 'cost-entry-12',
      projectId: project1Id,
      budgetItemId: 'budget-item-4',
      categoryId: 'cat-surface-treatment',
      description: 'Decklackierung',
      amount: 14000,
      currency: 'EUR',
      type: 'surface_treatment' as const,
      date: '2024-06-15',
      isApproved: true,
      tags: ['lack', 'finish'],
      createdBy: 'maler',
      createdAt: '2024-06-15T13:45:00Z'
    },
    {
      id: 'cost-entry-13',
      projectId: project1Id,
      budgetItemId: 'budget-item-5',
      categoryId: 'cat-assembly-installation',
      description: 'Transport und Abschlussarbeiten',
      amount: 32500,
      currency: 'EUR',
      type: 'assembly_installation' as const,
      date: '2024-06-20',
      isApproved: true,
      tags: ['transport', 'abschluss'],
      createdBy: 'montage-leiter',
      createdAt: '2024-06-20T16:20:00Z'
    }
  ];

  try {
    // Initialize budget categories if not exists
    ProjectBudgetService.initialize();

    // Save budget to localStorage (simulate service call)
    localStorage.setItem('bauplan-buddy-project-budgets', JSON.stringify([project1Budget]));
    
    // Save cost entries to localStorage
    localStorage.setItem('bauplan-buddy-cost-entries', JSON.stringify(project1CostEntries));

    // Save samples to Dexie
    await db.projects.bulkPut([
      {
        id: project1Id,
        name: 'Stahlhalle Industriebau',
        customer: 'Fa. Stahlwerk GmbH',
        location: 'Hamburg',
        budget: 450000,
        spent: 337500,
        status: 'active',
        progress: 75,
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        description: 'Neubau einer Industriehalle in Stahlskelettbauweise.',
        documents: ['Plan_A1.pdf', 'Statik.pdf'],
        updatedAt: new Date().toISOString()
      },
      {
        id: 'PRJ-LEGACY',
        name: 'Altes Projekt (Archiv)',
        customer: 'Bestandskunde AG',
        location: 'Berlin',
        budget: 120000,
        spent: 120000,
        status: 'archived',
        progress: 100,
        startDate: '2012-05-10', // > 10 years ago
        endDate: '2013-02-15',
        description: 'Historisches Projekt zur Verifikation der Aufbewahrungsfrist.',
        documents: [],
        updatedAt: new Date().toISOString()
      }
    ]);

    console.log('Sample data initialized successfully!');
    console.log('Project budget total:', project1Budget.totalBudget);
    console.log('Total cost entries:', project1CostEntries.length);
    console.log('Total actual costs:', project1CostEntries.reduce((sum, entry) => sum + entry.amount, 0));

    return true;
  } catch (error) {
    console.error('Error initializing sample data:', error);
    return false;
  }
};

// Function to test Nachkalkulation generation
export const testNachkalkulationGeneration = () => {
  try {
    const testProject = {
      id: 'PRJ-2024-001',
      name: 'Wohnhaus Familie Müller',
      description: 'Neubau eines Einfamilienhauses mit Keller, 2 Stockwerken und ausgebautem Dachgeschoss.',
      category: 'residential',
      status: 'active' as const,
      priority: 'high' as const,
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      actualStartDate: '2024-01-15',
      progress: 75,
      budget: 450000,
      actualCost: 337500,
      invoicedAmount: 300000,
      clientId: 'client-mueller',
      projectManagerId: 'pm-001',
      teamMembers: ['team-001', 'team-002'],
      location: {
        address: 'Musterstraße 12, 80331 München',
        coordinates: { lat: 48.1351, lng: 11.5820 }
      },
      phases: [],
      tasks: [],
      milestones: [],
      documents: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      tags: ['residential', 'munich'],
      customFields: {}
    };

    const nachkalkulation = NachkalkulationService.generateNachkalkulation(
      testProject.id,
      testProject,
      'test-user'
    );

    console.log('Nachkalkulation generated successfully!');
    console.log('Status:', nachkalkulation.status);
    console.log('Cost variance:', nachkalkulation.financial.costVariance);
    console.log('Profit margin actual:', nachkalkulation.financial.profitMargin.actual);
    
    return nachkalkulation;
  } catch (error) {
    console.error('Error generating test Nachkalkulation:', error);
    return null;
  }
};

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    const hasData = localStorage.getItem('bauplan-buddy-project-budgets');
    if (!hasData) {
      initializeSampleData();
    }
  }, 1000);
}