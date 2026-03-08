import { v4 as uuidv4 } from 'uuid';
import { featureFlags } from '@/lib/featureFlags';
import {
  startQuoteConversion,
  getQuoteConversionJob,
  getProjectById,
  type QuoteConversionJob,
  type QuoteConversionRequest,
  type ProjectSummary,
} from './api/quoteWorkflowApi';

export interface QuotePosition {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
  estimatedHours?: number;
  materials?: string[];
}

export interface QuoteData {
  id: string;
  number: string;
  customer: string;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  project: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  date: string;
  validUntil: string;
  positions: QuotePosition[];
  notes?: string;
  projectType?: 'steel_construction' | 'facade_systems' | 'railings_stairs' | 'bridge_construction' | 'industrial_structures' | 'residential' | 'commercial' | 'renovation' | 'infrastructure';
  estimatedDuration?: number; // in days
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface ProjectTemplate {
  id: string;
  name: string;
  type: 'steel_construction' | 'facade_systems' | 'railings_stairs' | 'bridge_construction' | 'industrial_structures' | 'residential' | 'commercial' | 'renovation' | 'infrastructure';
  phases: ProjectPhase[];
  defaultMilestones: ProjectMilestone[];
  requiredDocuments: string[];
  estimatedDurationMultiplier: number; // multiply quote duration
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedDurationPercent: number; // percentage of total project duration
  dependsOn?: string[]; // phase IDs
  tasks: ProjectTask[];
}

export interface ProjectTask {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  requiredSkills: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  phaseId: string;
  dayOffset: number; // days from project start
  isPaymentMilestone: boolean;
  paymentPercentage?: number;
  deliverables: string[];
}

export interface ConvertedProject {
  id: string;
  name: string;
  customer: string;
  customerId: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  budget: number;
  estimatedDuration: number;
  startDate?: string;
  endDate?: string;
  phases: ProjectPhase[];
  milestones: ProjectMilestone[];
  team: ProjectTeamMember[];
  documents: ProjectDocument[];
  risks: ProjectRisk[];
  quoteReference: string;
  createdAt: string;
  createdBy: string;
}

export interface ProjectTeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  hourlyRate: number;
  allocation: number; // percentage 0-100
  phaseIds: string[];
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'contract' | 'permit' | 'plan' | 'specification' | 'report' | 'other';
  status: 'required' | 'requested' | 'received' | 'approved';
  dueDate?: string;
  category: string;
}

export interface ProjectRisk {
  id: string;
  description: string;
  category: 'weather' | 'material' | 'regulatory' | 'technical' | 'financial' | 'resource';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'identified' | 'mitigated' | 'monitoring' | 'resolved';
}

export class QuoteToProjectService {
  private static instance: QuoteToProjectService;
  private projectTemplates: ProjectTemplate[] = [];

  public static getInstance(): QuoteToProjectService {
    if (!QuoteToProjectService.instance) {
      QuoteToProjectService.instance = new QuoteToProjectService();
    }
    return QuoteToProjectService.instance;
  }

  constructor() {
    this.initializeProjectTemplates();
  }

  /**
   * Initialize project templates for Metallbau industry
   */
  private initializeProjectTemplates(): void {
    this.projectTemplates = [
      // Residential basic template to support tests
      {
        id: 'residential-basic',
        name: 'Wohnbau Basis',
        type: 'residential',
        estimatedDurationMultiplier: 1.0,
        phases: [
          {
            id: 'planning',
            name: 'Planung',
            description: 'Projektplanung und Genehmigungen',
            order: 1,
            estimatedDurationPercent: 20,
            tasks: [
              { id: 'planning-01', name: 'Genehmigungen', description: 'Behördliche Genehmigungen einholen', estimatedHours: 40, requiredSkills: ['planning'], priority: 'medium', category: 'planning' }
            ]
          },
          {
            id: 'construction',
            name: 'Bauphase',
            description: 'Ausführung der Bauarbeiten',
            order: 2,
            estimatedDurationPercent: 80,
            dependsOn: ['planning'],
            tasks: [
              { id: 'construction-01', name: 'Rohbau', description: 'Rohbau erstellen', estimatedHours: 120, requiredSkills: ['construction'], priority: 'high', category: 'construction' }
            ]
          }
        ],
        defaultMilestones: [
          { id: 'ms-planning-approved', name: 'Planung genehmigt', description: 'Genehmigungen abgeschlossen', phaseId: 'planning', dayOffset: 20, isPaymentMilestone: true, paymentPercentage: 20, deliverables: ['Genehmigungen'] },
          { id: 'ms-handover', name: 'Projektübergabe', description: 'Fertigstellung und Übergabe', phaseId: 'construction', dayOffset: 100, isPaymentMilestone: true, paymentPercentage: 80, deliverables: ['Abnahmeprotokoll'] }
        ],
        requiredDocuments: ['Baugenehmigung', 'Pläne', 'Abnahmeprotokoll']
      },
      {
        id: 'steel-hall-construction',
        name: 'Stahlhalle Industriebau',
        type: 'steel_construction',
        estimatedDurationMultiplier: 1.0,
        phases: [
          {
            id: 'design',
            name: 'Konstruktion & Planung',
            description: 'CAD-Konstruktion, Statik und technische Planung',
            order: 1,
            estimatedDurationPercent: 15,
            tasks: [
              {
                id: 'cad-design',
                name: '3D-Konstruktion',
                description: 'CAD-Modellierung der Stahlkonstruktion',
                estimatedHours: 60,
                requiredSkills: ['CAD', 'Tekla', 'Stahlbau'],
                priority: 'high',
                category: 'design'
              },
              {
                id: 'structural-analysis',
                name: 'Statische Berechnung',
                description: 'Tragwerksberechnung und Prüfung',
                estimatedHours: 40,
                requiredSkills: ['Statik', 'Stahlbau'],
                priority: 'critical',
                category: 'design'
              }
            ]
          },
          {
            id: 'fabrication',
            name: 'Fertigung',
            description: 'Stahlzuschnitt, Schweißarbeiten und Vorfertigung',
            order: 2,
            estimatedDurationPercent: 50,
            dependsOn: ['design'],
            tasks: [
              {
                id: 'steel-cutting',
                name: 'CNC-Zuschnitt',
                description: 'Stahlteile nach Maß zuschneiden',
                estimatedHours: 80,
                requiredSkills: ['CNC-Programmierung', 'Brennschneiden'],
                priority: 'high',
                category: 'fabrication'
              },
              {
                id: 'welding-work',
                name: 'Schweißarbeiten',
                description: 'WIG/MAG-Schweißen der Bauteile',
                estimatedHours: 120,
                requiredSkills: ['WIG-Schweißen', 'MAG-Schweißen'],
                priority: 'critical',
                category: 'fabrication'
              }
            ]
          },
          {
            id: 'surface-treatment',
            name: 'Oberflächenbehandlung',
            description: 'Sandstrahlen, Grundierung und Beschichtung',
            order: 3,
            estimatedDurationPercent: 15,
            dependsOn: ['fabrication'],
            tasks: [
              {
                id: 'sandblasting',
                name: 'Sandstrahlen',
                description: 'Oberflächenvorbereitung durch Strahlen',
                estimatedHours: 40,
                requiredSkills: ['Oberflächenbehandlung', 'Strahlarbeiten'],
                priority: 'medium',
                category: 'surface_treatment'
              },
              {
                id: 'coating',
                name: 'Beschichtung',
                description: 'Grundierung und Decklackierung',
                estimatedHours: 30,
                requiredSkills: ['Lackierung', 'Korrosionsschutz'],
                priority: 'medium',
                category: 'surface_treatment'
              }
            ]
          },
          {
            id: 'assembly',
            name: 'Montage & Installation',
            description: 'Transport und Montage vor Ort',
            order: 4,
            estimatedDurationPercent: 20,
            dependsOn: ['surface-treatment'],
            tasks: [
              {
                id: 'transport',
                name: 'Transport',
                description: 'Transport der Bauteile zur Baustelle',
                estimatedHours: 16,
                requiredSkills: ['Logistik', 'Schwertransport'],
                priority: 'high',
                category: 'assembly'
              },
              {
                id: 'on-site-assembly',
                name: 'Montage vor Ort',
                description: 'Aufbau und Befestigung der Stahlkonstruktion',
                estimatedHours: 80,
                requiredSkills: ['Montage', 'Kranführer', 'Stahlbau'],
                priority: 'critical',
                category: 'assembly'
              }
            ]
          }
        ],
        defaultMilestones: [
          {
            id: 'design-approved',
            name: 'Konstruktion freigegeben',
            description: 'Statik geprüft und Konstruktion genehmigt',
            phaseId: 'design',
            dayOffset: 20,
            isPaymentMilestone: true,
            paymentPercentage: 15,
            deliverables: ['Werkstattzeichnungen', 'Statikprüfung']
          },
          {
            id: 'fabrication-complete',
            name: 'Fertigung abgeschlossen',
            description: 'Alle Stahlbauteile fertiggestellt',
            phaseId: 'fabrication',
            dayOffset: 90,
            isPaymentMilestone: true,
            paymentPercentage: 50,
            deliverables: ['Fertige Bauteile', 'Qualitätsprüfung']
          },
          {
            id: 'surface-complete',
            name: 'Oberflächenbehandlung abgeschlossen',
            description: 'Korrosionsschutz aufgebracht',
            phaseId: 'surface-treatment',
            dayOffset: 110,
            isPaymentMilestone: false,
            paymentPercentage: 0,
            deliverables: ['Beschichtungsprotokoll']
          },
          {
            id: 'project-handover',
            name: 'Projekt übergeben',
            description: 'Montage abgeschlossen und übergeben',
            phaseId: 'assembly',
            dayOffset: 140,
            isPaymentMilestone: true,
            paymentPercentage: 35,
            deliverables: ['Abnahmeprotokoll', 'Wartungsanleitung', 'Garantieschein']
          }
        ],
        requiredDocuments: [
          'Werkvertrag Stahlbau',
          'Werkstattzeichnungen',
          'Statische Berechnung',
          'Schweißplan WPS',
          'Prüfplan Qualität',
          'CE-Kennzeichnung',
          'Montageplan'
        ]
      },
      {
        id: 'facade-system',
        name: 'Fassadenkonstruktion Pfosten-Riegel',
        type: 'facade_systems',
        estimatedDurationMultiplier: 1.3,
        phases: [
          {
            id: 'survey-planning',
            name: 'Aufmaß & Planung',
            description: 'Fassadenvermessung und Detailkonstruktion',
            order: 1,
            estimatedDurationPercent: 20,
            tasks: [
              {
                id: 'facade-survey',
                name: 'Fassadenaufmaß',
                description: 'Präzise Vermessung der Fassade',
                estimatedHours: 40,
                requiredSkills: ['Vermessung', 'Fassadenbau'],
                priority: 'critical',
                category: 'survey'
              },
              {
                id: 'detail-design',
                name: 'Detailkonstruktion',
                description: 'Pfosten-Riegel-System planen',
                estimatedHours: 60,
                requiredSkills: ['CAD', 'Fassadentechnik'],
                priority: 'high',
                category: 'design'
              }
            ]
          },
          {
            id: 'prefabrication',
            name: 'Vorfertigung',
            description: 'Werkstattfertigung der Fassadenelemente',
            order: 2,
            estimatedDurationPercent: 30,
            dependsOn: ['survey-planning'],
            tasks: [
              {
                id: 'profile-cutting',
                name: 'Profilzuschnitt',
                description: 'Aluminium/Stahl-Profile zuschneiden',
                estimatedHours: 80,
                requiredSkills: ['CNC-Bearbeitung', 'Metallbearbeitung'],
                priority: 'high',
                category: 'fabrication'
              },
              {
                id: 'assembly-workshop',
                name: 'Werkstattmontage',
                description: 'Vormontage der Fassadenelemente',
                estimatedHours: 100,
                requiredSkills: ['Fassadenbau', 'Montage'],
                priority: 'high',
                category: 'fabrication'
              }
            ]
          },
          {
            id: 'installation',
            name: 'Montage vor Ort',
            description: 'Installation der Fassadenkonstruktion',
            order: 3,
            estimatedDurationPercent: 35,
            dependsOn: ['prefabrication'],
            tasks: [
              {
                id: 'substructure-install',
                name: 'Unterkonstruktion montieren',
                description: 'Befestigung an der Gebäudehülle',
                estimatedHours: 60,
                requiredSkills: ['Fassadenbau', 'Befestigungstechnik'],
                priority: 'critical',
                category: 'installation'
              },
              {
                id: 'glazing-install',
                name: 'Verglasung einbauen',
                description: 'Glas einsetzen und abdichten',
                estimatedHours: 80,
                requiredSkills: ['Glaserarbeiten', 'Abdichtung'],
                priority: 'high',
                category: 'installation'
              }
            ]
          },
          {
            id: 'finishing',
            name: 'Fertigstellung',
            description: 'Abschlussarbeiten und Qualitätskontrolle',
            order: 4,
            estimatedDurationPercent: 15,
            dependsOn: ['installation'],
            tasks: [
              {
                id: 'sealing-work',
                name: 'Abdichtungsarbeiten',
                description: 'Finale Abdichtung und Fugenarbeiten',
                estimatedHours: 40,
                requiredSkills: ['Abdichtung', 'Fugentechnik'],
                priority: 'medium',
                category: 'finishing'
              },
              {
                id: 'cleaning-handover',
                name: 'Reinigung und Übergabe',
                description: 'Fassadenreinigung und Abnahme',
                estimatedHours: 20,
                requiredSkills: ['Fassadenreinigung', 'Qualitätskontrolle'],
                priority: 'medium',
                category: 'finishing'
              }
            ]
          }
        ],
        defaultMilestones: [
          {
            id: 'planning-approved',
            name: 'Planung freigegeben',
            description: 'Detailplanung vom Kunden genehmigt',
            phaseId: 'survey-planning',
            dayOffset: 25,
            isPaymentMilestone: true,
            paymentPercentage: 20,
            deliverables: ['Fassadenplanung', 'Materialliste']
          },
          {
            id: 'prefab-complete',
            name: 'Vorfertigung abgeschlossen',
            description: 'Alle Fassadenelemente fertiggestellt',
            phaseId: 'prefabrication',
            dayOffset: 60,
            isPaymentMilestone: true,
            paymentPercentage: 40,
            deliverables: ['Fertige Elemente', 'Qualitätsprüfung']
          },
          {
            id: 'installation-complete',
            name: 'Montage abgeschlossen',
            description: 'Fassade vollständig montiert',
            phaseId: 'installation',
            dayOffset: 100,
            isPaymentMilestone: true,
            paymentPercentage: 30,
            deliverables: ['Montierte Fassade', 'Dichtheitprüfung']
          },
          {
            id: 'project-finished',
            name: 'Projekt fertiggestellt',
            description: 'Fassade abgenommen und übergeben',
            phaseId: 'finishing',
            dayOffset: 120,
            isPaymentMilestone: true,
            paymentPercentage: 10,
            deliverables: ['Abnahmeprotokoll', 'Wartungsanleitung']
          }
        ],
        requiredDocuments: [
          'Werkvertrag Fassadenbau',
          'Fassadenplanung',
          'Befestigungsnachweis',
          'Glasspezifikation',
          'Dichtheitprüfung',
          'CE-Kennzeichnung',
          'Montageprotokoll'
        ]
      }
    ];
  }

  /**
   * Convert quote to project with selected template
   */
  public async convertQuoteToProject(
    quote: QuoteData,
    templateId: string,
    options: {
      startDate?: string;
      teamAssignments?: { [phaseId: string]: string[] };
      customMilestones?: ProjectMilestone[];
      riskAssessment?: ProjectRisk[];
    } = {}
  ): Promise<ConvertedProject> {
    if (!quote.positions || quote.positions.length === 0) {
      throw new Error('Quote must have at least one position');
    }

    if (!this.projectTemplates.some((template) => template.id === templateId)) {
      throw new Error(`Project template ${templateId} not found`);
    }

    if (featureFlags.isEnabled('ENABLE_API_QUOTE_CONVERSION')) {
      const apiResult = await this.convertQuoteToProjectViaApi(quote, templateId, options);
      if (apiResult) {
        return apiResult;
      }
    }

    return this.convertQuoteToProjectLocally(quote, templateId, options);
  }

  private async convertQuoteToProjectLocally(
    quote: QuoteData,
    templateId: string,
    options: {
      startDate?: string;
      teamAssignments?: { [phaseId: string]: string[] };
      customMilestones?: ProjectMilestone[];
      riskAssessment?: ProjectRisk[];
    } = {}
  ): Promise<ConvertedProject> {
    if (!quote.positions || quote.positions.length === 0) {
      throw new Error('Quote must have at least one position');
    }

    const template = this.projectTemplates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Project template ${templateId} not found`);
    }

    const projectId = uuidv4();
    const estimatedDuration = quote.estimatedDuration
      ? Math.ceil(quote.estimatedDuration * template.estimatedDurationMultiplier)
      : this.estimateProjectDuration(quote, template);

    const startDate = options.startDate || new Date().toISOString().split('T')[0];
    const endDate = new Date(new Date(startDate).getTime() + estimatedDuration * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const phases = this.generateProjectPhases(template.phases, estimatedDuration, startDate);

    const milestones =
      options.customMilestones && options.customMilestones.length > 0
        ? options.customMilestones
        : this.generateProjectMilestones(template.defaultMilestones, startDate, quote.amount);

    const team = this.generateTeamAssignments(phases, options.teamAssignments);

    const documents = this.generateProjectDocuments(template.requiredDocuments);

    const risks = options.riskAssessment || this.generateRiskAssessment(quote, template);

    const convertedProject: ConvertedProject = {
      id: projectId,
      name: quote.project,
      customer: quote.customer,
      customerId: quote.customerId,
      status: 'planning',
      budget: quote.amount,
      estimatedDuration,
      startDate,
      endDate,
      phases,
      milestones,
      team,
      documents,
      risks,
      quoteReference: quote.id,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
    };

    return convertedProject;
  }

  /**
   * Estimate project duration based on quote amount and complexity
   */
  private estimateProjectDuration(quote: QuoteData, template: ProjectTemplate): number {
    // Base estimation: 4-16 weeks depending on project value
    const baseWeeks = Math.max(4, Math.ceil(quote.amount / 50000) * 2);
    
    // Apply template multiplier
    const adjustedWeeks = Math.ceil(baseWeeks * template.estimatedDurationMultiplier);
    
    // Convert to days (5 working days per week)
    return adjustedWeeks * 7;
  }

  private async convertQuoteToProjectViaApi(
    quote: QuoteData,
    templateId: string,
    options: {
      startDate?: string;
      teamAssignments?: { [phaseId: string]: string[] };
      customMilestones?: ProjectMilestone[];
      riskAssessment?: ProjectRisk[];
    } = {}
  ): Promise<ConvertedProject | null> {
    const payload: QuoteConversionRequest = {
      templateId,
      requestedStartDate: options.startDate,
      options: {
        teamAssignments: options.teamAssignments,
        customMilestones: options.customMilestones,
        riskAssessment: options.riskAssessment,
      },
    };

    try {
      const job = await startQuoteConversion(quote.id, payload);
      const finalJob = await this.waitForConversionJob(job.jobId);

      if (!finalJob || finalJob.status !== 'completed' || !finalJob.projectId) {
        return null;
      }

      const projectSummary = await getProjectById(finalJob.projectId);
      const localProjection = await this.convertQuoteToProjectLocally(quote, templateId, options);

      if (!projectSummary) {
        return localProjection;
      }

      return this.mergeProjectSummary(localProjection, projectSummary, quote.id);
    } catch (error) {
      console.warn('Quote conversion via API failed. Falling back to local conversion.', error);
      return null;
    }
  }

  private async waitForConversionJob(
    jobId: string,
    timeoutMs = 20000,
    intervalMs = 1000
  ): Promise<QuoteConversionJob | null> {
    const startedAt = Date.now();
    let latestJob: QuoteConversionJob | null = null;

    while (Date.now() - startedAt < timeoutMs) {
      latestJob = await getQuoteConversionJob(jobId);
      if (!latestJob || latestJob.status === 'completed' || latestJob.status === 'failed') {
        return latestJob;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    console.warn(`Quote conversion job ${jobId} did not complete within timeout.`);
    return latestJob;
  }

  private mergeProjectSummary(
    localProjection: ConvertedProject,
    summary: ProjectSummary,
    quoteId: string
  ): ConvertedProject {
    return {
      ...localProjection,
      id: summary.id || localProjection.id,
      name: summary.name || localProjection.name,
      customerId: summary.customerId || localProjection.customerId,
      status: (summary.status as ConvertedProject['status']) || localProjection.status,
      budget: typeof summary.budget === 'number' ? summary.budget : localProjection.budget,
      startDate: summary.startDate ?? localProjection.startDate,
      endDate: summary.endDate ?? localProjection.endDate,
      createdAt: summary.createdAt ?? localProjection.createdAt,
      quoteReference: quoteId,
    };
  }

  /**
   * Generate project phases with calculated dates and durations
   */
  private generateProjectPhases(
    templatePhases: ProjectPhase[], 
    totalDuration: number, 
    startDate: string
  ): ProjectPhase[] {
    const phases: ProjectPhase[] = [];
    let currentOffset = 0;

    for (const templatePhase of templatePhases.sort((a, b) => a.order - b.order)) {
      const phaseDuration = Math.ceil(totalDuration * (templatePhase.estimatedDurationPercent / 100));
      const phaseStartDate = new Date(new Date(startDate).getTime() + currentOffset * 24 * 60 * 60 * 1000);
      const phaseEndDate = new Date(phaseStartDate.getTime() + phaseDuration * 24 * 60 * 60 * 1000);

      phases.push({
        ...templatePhase,
        tasks: templatePhase.tasks.map(task => ({
          ...task,
          id: uuidv4()
        }))
      });

      currentOffset += phaseDuration;
    }

    return phases;
  }

  /**
   * Generate project milestones with calculated dates
   */
  private generateProjectMilestones(
    templateMilestones: ProjectMilestone[], 
    startDate: string, 
    totalBudget: number
  ): ProjectMilestone[] {
    return templateMilestones.map(milestone => ({
      ...milestone,
      id: uuidv4()
    }));
  }

  /**
   * Generate team assignments based on required skills
   */
  private generateTeamAssignments(
    phases: ProjectPhase[], 
    customAssignments?: { [phaseId: string]: string[] }
  ): ProjectTeamMember[] {
    const teamMembers: ProjectTeamMember[] = [];
    
    // Extract all unique skills from phases
    const allSkills = phases.flatMap(phase => 
      phase.tasks.flatMap(task => task.requiredSkills)
    );
    const uniqueSkills = [...new Set(allSkills)];

    // Generate team members for each skill
    uniqueSkills.forEach(skill => {
      const relatedPhases = phases.filter(phase => 
        phase.tasks.some(task => task.requiredSkills.includes(skill))
      );

      teamMembers.push({
        id: uuidv4(),
        name: `${skill} Spezialist`,
        role: skill,
        skills: [skill],
        hourlyRate: this.getDefaultHourlyRate(skill),
        allocation: 80, // Default 80% allocation
        phaseIds: relatedPhases.map(p => p.id)
      });
    });

    return teamMembers;
  }

  /**
   * Get default hourly rate for a skill
   */
  private getDefaultHourlyRate(skill: string): number {
    const rateMap: { [key: string]: number } = {
      'CAD': 65,
      'Tekla': 75,
      'Stahlbau': 55,
      'Statik': 85,
      'CNC-Programmierung': 60,
      'Brennschneiden': 50,
      'WIG-Schweißen': 65,
      'MAG-Schweißen': 60,
      'Oberflächenbehandlung': 45,
      'Strahlarbeiten': 50,
      'Lackierung': 45,
      'Korrosionsschutz': 55,
      'Logistik': 40,
      'Schwertransport': 65,
      'Montage': 55,
      'Kranführer': 70,
      'Vermessung': 60,
      'Fassadenbau': 58,
      'Fassadentechnik': 65,
      'CNC-Bearbeitung': 58,
      'Metallbearbeitung': 52,
      'Befestigungstechnik': 55,
      'Glaserarbeiten': 50,
      'Abdichtung': 48,
      'Fugentechnik': 50,
      'Fassadenreinigung': 35,
      'Qualitätskontrolle': 60
    };
    
    return rateMap[skill] || 50; // Default rate if skill not found
  }

  /**
   * Generate required project documents
   */
  private generateProjectDocuments(requiredDocuments: string[]): ProjectDocument[] {
    return requiredDocuments.map(docName => ({
      id: uuidv4(),
      name: docName,
      type: this.categorizeDocument(docName),
      status: 'required',
      category: 'project'
    }));
  }

  /**
   * Categorize document by name
   */
  private categorizeDocument(docName: string): ProjectDocument['type'] {
    const norm = docName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // strip diacritics

    if (norm.includes('vertrag') || norm.includes('antrag')) return 'contract';
    if (norm.includes('plan') || norm.includes('grundriss') || norm.includes('zeichn')) return 'plan';
    if (norm.includes('genehmigung') || norm.includes('nachweis')) return 'permit';
    if (norm.includes('berechnung') || norm.includes('konzept') || norm.includes('spezifikation')) return 'specification';
    if (norm.includes('protokoll') || norm.includes('bericht') || norm.includes('report')) return 'report';
    return 'other';
  }

  /**
   * Generate risk assessment based on quote and template
   */
  private generateRiskAssessment(quote: QuoteData, template: ProjectTemplate): ProjectRisk[] {
    const risks: ProjectRisk[] = [];

    // Standard Metallbau risks
    if (template.type !== 'renovation') {
      risks.push({
        id: uuidv4(),
        description: 'Stahlpreisschwankungen am Markt',
        category: 'material',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Frühzeitige Materialbeschaffung und Preisabsicherung',
        status: 'identified'
      });

      risks.push({
        id: uuidv4(),
        description: 'Verzögerung bei Oberflächenbehandlung durch Wetter',
        category: 'weather',
        probability: 'medium',
        impact: 'low',
        mitigation: 'Wettergeschützte Bereiche nutzen, flexible Terminplanung',
        status: 'identified'
      });
    }

    // High-value project risks
    if (quote.amount > 500000) {
      risks.push({
        id: uuidv4(),
        description: 'Komplexe Tragwerkskonstruktion erfordert zusätzliche Prüfungen',
        category: 'technical',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Statiker frühzeitig einbinden, TÜV-Termine vormerken',
        status: 'identified'
      });

      risks.push({
        id: uuidv4(),
        description: 'Spezialisierte Fachkräfte schwer verfügbar',
        category: 'resource',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Frühzeitige Personalplanung, externe Spezialisten vorqualifizieren',
        status: 'identified'
      });
    }

    // Very high-value project risks
    if (quote.amount > 1000000) {
      risks.push({
        id: uuidv4(),
        description: 'Behördliche Genehmigungsverfahren verzögern sich',
        category: 'regulatory',
        probability: 'high',
        impact: 'high',
        mitigation: 'Genehmigungsverfahren parallel starten, Behördenkontakte pflegen',
        status: 'identified'
      });
    }

    return risks;
  }

  /**
   * Get all available project templates
   */
  public getProjectTemplates(): ProjectTemplate[] {
    return this.projectTemplates;
  }

  /**
   * Get project templates by type
   */
  public getTemplatesByType(type: ProjectTemplate['type']): ProjectTemplate[] {
    return this.projectTemplates.filter(template => template.type === type);
  }

  /**
   * Add new project template
   */
  public addProjectTemplate(template: ProjectTemplate): void {
    this.projectTemplates.push(template);
  }

  /**
   * Generate folder structure for project
   */
  public generateProjectFolderStructure(project: ConvertedProject): string[] {
    const year = new Date().getFullYear();
    const baseFolder = `Projekte/${year}/${project.name}`;
    
    return [
      `${baseFolder}/01_Angebot`,
      `${baseFolder}/02_Konstruktion`,
      `${baseFolder}/03_Werkstattzeichnungen`,
      `${baseFolder}/04_Statik`,
      `${baseFolder}/05_Fertigung`,
      `${baseFolder}/06_Qualitätsprüfung`,
      `${baseFolder}/07_Oberflächenbehandlung`,
      `${baseFolder}/08_Transport`,
      `${baseFolder}/09_Montage`,
      `${baseFolder}/10_Abnahme`,
      `${baseFolder}/11_Rechnung`,
      `${baseFolder}/12_Garantie`
    ];
  }
}
