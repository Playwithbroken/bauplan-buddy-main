export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'steel_construction' | 'facade_systems' | 'railings_stairs' | 'bridge_construction' | 'industrial_structures' | 'custom';
  isDefault: boolean;
  estimatedDuration: number; // in days
  estimatedBudget: number;
  
  // Template configuration
  phases: ProjectPhase[];
  tasks: ProjectTaskTemplate[];
  milestones: ProjectMilestoneTemplate[];
  documents: ProjectDocumentTemplate[];
  roles: ProjectRoleTemplate[];
  
  // Settings
  settings: {
    allowCustomPhases: boolean;
    allowCustomTasks: boolean;
    requireApproval: boolean;
    autoCreateDocuments: boolean;
    sendNotifications: boolean;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: string;
  tags: string[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedDuration: number;
  dependencies: string[]; // Phase IDs that must be completed first
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress: number; // 0-100
  budget: number;
  actualCost: number;
  responsibleUserId?: string;
  color: string;
}

export interface ProjectTaskTemplate {
  id: string;
  name: string;
  description: string;
  phaseId: string;
  category: 'design' | 'fabrication' | 'surface_treatment' | 'assembly' | 'quality_control' | 'documentation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  estimatedCost: number;
  skills: string[];
  dependencies: string[];
  deliverables: string[];
  checklistItems: string[];
  autoAssign: boolean;
  roleId?: string;
}

export interface ProjectMilestoneTemplate {
  id: string;
  name: string;
  description: string;
  phaseId: string;
  type: 'approval' | 'delivery' | 'inspection' | 'payment' | 'completion';
  criticalPath: boolean;
  deliverables: string[];
  approvers: string[];
  criteria: string[];
}

export interface ProjectDocumentTemplate {
  id: string;
  name: string;
  type: 'contract' | 'plan' | 'specification' | 'report' | 'permit' | 'invoice';
  phaseId?: string;
  taskId?: string;
  template?: string; // File path or template content
  required: boolean;
  autoGenerate: boolean;
  approvalRequired: boolean;
}

export interface ProjectRoleTemplate {
  id: string;
  name: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  permissions: string[];
  hourlyRate?: number;
  isExternal: boolean;
}

export interface Project {
  id: string;
  templateId?: string;
  name: string;
  description: string;
  category: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Dates and Progress
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress: number;
  
  // Financial
  budget: number;
  actualCost: number;
  invoicedAmount: number;
  
  // Parties
  clientId: string;
  projectManagerId: string;
  teamMembers: string[];
  
  // Location
  location: {
    address: string;
    coordinates?: { lat: number; lng: number };
    siteContact?: string;
    accessInstructions?: string;
  };
  
  // Template-based data
  phases: ProjectPhase[];
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  documents: ProjectDocument[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  customFields: Record<string, unknown>;
}

export interface ProjectTask {
  id: string;
  templateId?: string;
  projectId: string;
  phaseId: string;
  name: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'blocked';
  
  // Time tracking
  estimatedHours: number;
  actualHours: number;
  startDate: string;
  endDate: string;
  
  // Assignment
  assignedTo: string[];
  responsibleUserId: string;
  
  // Dependencies
  dependencies: string[];
  dependents: string[];
  
  // Progress
  progress: number;
  completedChecklistItems: string[];
  
  // Financial
  estimatedCost: number;
  actualCost: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  templateId?: string;
  projectId: string;
  phaseId: string;
  name: string;
  description: string;
  type: string;
  status: 'pending' | 'achieved' | 'missed' | 'cancelled';
  dueDate: string;
  achievedDate?: string;
  criteria: string[];
  completedCriteria: string[];
  approvals: Array<{
    userId: string;
    approved: boolean;
    date: string;
    notes?: string;
  }>;
}

export interface ProjectDocument {
  id: string;
  templateId?: string;
  projectId: string;
  phaseId?: string;
  taskId?: string;
  name: string;
  type: string;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  version: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  uploadedBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export class ProjectTemplateService {
  private static readonly TEMPLATES_KEY = 'bauplan-buddy-project-templates';
  private static readonly PROJECTS_KEY = 'bauplan-buddy-projects';
  // v2 (integration tests) storage key
  static readonly NEW_TEMPLATES_KEY = 'project-templates';
  // Singleton instance for v2 API
  private static instance: ProjectTemplateService;
  // In-memory list for v2 templates to avoid relying on mocked localStorage reads in tests
  private v2Templates: V2Template[] = [];

  constructor() {
    // Initialize v2 templates from storage when available
    try {
      this.v2Templates = loadV2Templates();
    } catch {
      this.v2Templates = [];
    }
  }

  public static getInstance(): ProjectTemplateService {
    if (!ProjectTemplateService.instance) {
      ProjectTemplateService.instance = new ProjectTemplateService();
    }
    return ProjectTemplateService.instance;
  }

  /**
   * Get all project templates
   */
  static getAllTemplates(): ProjectTemplate[] {
    try {
      const data = localStorage.getItem(this.TEMPLATES_KEY);
      return data ? JSON.parse(data) : this.getDefaultTemplates();
    } catch {
      return this.getDefaultTemplates();
    }
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): ProjectTemplate | null {
    const templates = this.getAllTemplates();
    return templates.find(t => t.id === id) || null;
  }

  /**
   * Create new template
   */
  static createTemplate(templateData: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): ProjectTemplate {
    const template: ProjectTemplate = {
      ...templateData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const templates = this.getAllTemplates();
    templates.push(template);
    this.saveTemplates(templates);

    return template;
  }

  /**
   * Update existing template
   */
  static updateTemplate(id: string, updates: Partial<ProjectTemplate>): ProjectTemplate | null {
    const templates = this.getAllTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return null;

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveTemplates(templates);
    return templates[index];
  }

  /**
   * Delete template
   */
  static deleteTemplate(id: string): boolean {
    const templates = this.getAllTemplates();
    const filteredTemplates = templates.filter(t => t.id !== id);
    
    if (filteredTemplates.length === templates.length) return false;
    
    this.saveTemplates(filteredTemplates);
    return true;
  }

  // Instance (v2) API required by tests
  async createTemplate(input: Omit<V2Template, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<V2Template> {
    const userId = getCurrentUserId();
    if (!PermissionService.hasPermission(userId || '', 'templates.write', { userId: userId || '', timestamp: new Date().toISOString() })) {
      throw new Error('Insufficient permissions');
    }

    // Validate phases and milestones
    for (const phase of input.phases) {
      if (phase.estimatedDurationPercent < 0 || phase.estimatedDurationPercent > 100) {
        throw new Error('Phase duration percentage cannot exceed 100');
      }
    }
    const phaseIds = new Set(input.phases.map(p => p.id));
    for (const ms of input.defaultMilestones) {
      if (!phaseIds.has(ms.phaseId)) {
        throw new Error('Invalid phase reference in milestone');
      }
    }

    const now = new Date().toISOString();
    const template: V2Template = {
      id: `projtpl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name: input.name,
      type: input.type,
      description: input.description,
      estimatedDurationMultiplier: input.estimatedDurationMultiplier,
      phases: input.phases,
      defaultMilestones: input.defaultMilestones,
      requiredDocuments: input.requiredDocuments,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const list = this.v2Templates;
    list.push(template);
    try {
      saveV2Templates(list);
    } catch {
      throw new Error('Failed to save template');
    }
    return template;
  }

  async updateTemplate(id: string, updates: Partial<Omit<V2Template, 'id' | 'createdAt'>>): Promise<V2Template> {
    const userId = getCurrentUserId();
    if (!PermissionService.hasPermission(userId || '', 'templates.write', { userId: userId || '', timestamp: new Date().toISOString() })) {
      throw new Error('Insufficient permissions');
    }

    const list = this.v2Templates;
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Template not found');

    const updated: V2Template = {
      ...list[idx],
      ...updates,
      version: (list[idx].version || 1) + 1,
      updatedAt: new Date().toISOString(),
    } as V2Template;

    // Re-validate when phases/milestones change
    if (updates.phases || updates.defaultMilestones) {
      for (const phase of updated.phases) {
        if (phase.estimatedDurationPercent < 0 || phase.estimatedDurationPercent > 100) {
          throw new Error('Phase duration percentage cannot exceed 100');
        }
      }
      const phaseIds = new Set(updated.phases.map(p => p.id));
      for (const ms of updated.defaultMilestones) {
        if (!phaseIds.has(ms.phaseId)) {
          throw new Error('Invalid phase reference in milestone');
        }
      }
    }

    list[idx] = updated;
    try {
      saveV2Templates(list);
    } catch {
      throw new Error('Failed to save template');
    }
    return updated;
  }

  /**
   * Create project from template
   */
  static createProjectFromTemplate(
    templateId: string,
    projectData: {
      name: string;
      description: string;
      clientId: string;
      projectManagerId: string;
      startDate: string;
      budget: number;
      location: Project['location'];
    }
  ): Project | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    // Calculate end date based on estimated duration
    const endDate = new Date(projectData.startDate);
    endDate.setDate(endDate.getDate() + template.estimatedDuration);

    const project: Project = {
      id: this.generateId(),
      templateId,
      name: projectData.name,
      description: projectData.description,
      category: template.category,
      status: 'planning',
      priority: 'medium',
      
      startDate: projectData.startDate,
      endDate: endDate.toISOString().split('T')[0],
      progress: 0,
      
      budget: projectData.budget,
      actualCost: 0,
      invoicedAmount: 0,
      
      clientId: projectData.clientId,
      projectManagerId: projectData.projectManagerId,
      teamMembers: [],
      
      location: projectData.location,
      
      // Create phases from template
      phases: template.phases.map(phaseTemplate => ({
        ...phaseTemplate,
        id: this.generateId(),
        status: 'pending' as const,
        progress: 0,
        actualCost: 0,
      })),
      
      // Create tasks from template
      tasks: template.tasks.map(taskTemplate => ({
        id: this.generateId(),
        templateId: taskTemplate.id,
        projectId: project.id,
        phaseId: taskTemplate.phaseId,
        name: taskTemplate.name,
        description: taskTemplate.description,
        category: taskTemplate.category,
        priority: taskTemplate.priority,
        status: 'pending' as const,
        estimatedHours: taskTemplate.estimatedHours,
        actualHours: 0,
        startDate: projectData.startDate,
        endDate: projectData.startDate, // Will be calculated based on dependencies
        assignedTo: [],
        responsibleUserId: projectData.projectManagerId,
        dependencies: taskTemplate.dependencies,
        dependents: [],
        progress: 0,
        completedChecklistItems: [],
        estimatedCost: taskTemplate.estimatedCost,
        actualCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      
      // Create milestones from template
      milestones: template.milestones.map(milestoneTemplate => ({
        id: this.generateId(),
        templateId: milestoneTemplate.id,
        projectId: project.id,
        phaseId: milestoneTemplate.phaseId,
        name: milestoneTemplate.name,
        description: milestoneTemplate.description,
        type: milestoneTemplate.type,
        status: 'pending' as const,
        dueDate: projectData.startDate, // Will be calculated
        criteria: milestoneTemplate.criteria,
        completedCriteria: [],
        approvals: [],
      })),
      
      // Create document placeholders from template
      documents: template.documents.map(docTemplate => ({
        id: this.generateId(),
        templateId: docTemplate.id,
        projectId: project.id,
        phaseId: docTemplate.phaseId,
        taskId: docTemplate.taskId,
        name: docTemplate.name,
        type: docTemplate.type,
        status: 'draft' as const,
        version: '1.0',
        uploadedAt: new Date().toISOString(),
        uploadedBy: projectData.projectManagerId,
      })),
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: projectData.projectManagerId,
      tags: [],
      customFields: {},
    };

    // Save project
    const projects = this.getAllProjects();
    projects.push(project);
    this.saveProjects(projects);

    return project;
  }

  /**
   * Get all projects
   */
  static getAllProjects(): Project[] {
    try {
      const data = localStorage.getItem(this.PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get project by ID
   */
  static getProjectById(id: string): Project | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * Update project
   */
  static updateProject(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveProjects(projects);
    return projects[index];
  }

  /**
   * Update project progress
   */
  static updateProjectProgress(projectId: string): void {
    const project = this.getProjectById(projectId);
    if (!project) return;

    // Calculate progress based on completed tasks
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === 'completed').length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    this.updateProject(projectId, { progress });
  }

  /**
   * Get template categories
   */
  static getTemplateCategories(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'steel_construction',
        label: 'Stahlbau',
        description: 'Stahlhallen, Tragwerke und Stahlkonstruktionen'
      },
      {
        value: 'facade_systems',
        label: 'Fassadensysteme',
        description: 'Pfosten-Riegel-Fassaden und Curtain Wall Systeme'
      },
      {
        value: 'railings_stairs',
        label: 'Geländer & Treppen',
        description: 'Edelstahl-Geländer, Treppen und Balkone'
      },
      {
        value: 'bridge_construction',
        label: 'Brückenbau',
        description: 'Stahlbrücken und schwere Tragwerkskonstruktionen'
      },
      {
        value: 'industrial_structures',
        label: 'Industrieanlagen',
        description: 'Produktionshallen, Kranbahnen und Industriebauten'
      },
      {
        value: 'custom',
        label: 'Individuell',
        description: 'Benutzerdefinierte Metallbau-Projekttypen'
      }
    ];
  }

  // Private methods

  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static saveTemplates(templates: ProjectTemplate[]): void {
    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
  }

  private static saveProjects(projects: Project[]): void {
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
  }

  private static getDefaultTemplates(): ProjectTemplate[] {
    return [
      {
        id: 'template-steel-hall-construction',
        name: 'Stahlhalle Industriebau',
        description: 'Standard-Vorlage für Stahlhallen und Industriebauten',
        category: 'steel_construction',
        isDefault: true,
        estimatedDuration: 180,
        estimatedBudget: 450000,
        phases: [
          {
            id: 'phase-design',
            name: 'Konstruktion & Planung',
            description: 'CAD-Konstruktion, Statik und Genehmigungsplanung',
            order: 1,
            estimatedDuration: 30,
            dependencies: [],
            status: 'pending',
            progress: 0,
            budget: 45000,
            actualCost: 0,
            color: '#3b82f6'
          },
          {
            id: 'phase-fabrication',
            name: 'Fertigung',
            description: 'Stahlzuschnitt, Schweißarbeiten und Vorfertigung',
            order: 2,
            estimatedDuration: 90,
            dependencies: ['phase-design'],
            status: 'pending',
            progress: 0,
            budget: 200000,
            actualCost: 0,
            color: '#f59e0b'
          },
          {
            id: 'phase-surface-treatment',
            name: 'Oberflächenbehandlung',
            description: 'Sandstrahlen, Grundierung und Beschichtung',
            order: 3,
            estimatedDuration: 20,
            dependencies: ['phase-fabrication'],
            status: 'pending',
            progress: 0,
            budget: 45000,
            actualCost: 0,
            color: '#10b981'
          },
          {
            id: 'phase-assembly',
            name: 'Montage & Installation',
            description: 'Montage vor Ort und Inbetriebnahme',
            order: 4,
            estimatedDuration: 40,
            dependencies: ['phase-surface-treatment'],
            status: 'pending',
            progress: 0,
            budget: 160000,
            actualCost: 0,
            color: '#8b5cf6'
          }
        ],
        tasks: [
          {
            id: 'task-design',
            name: '3D-Konstruktion erstellen',
            description: 'CAD-Modellierung der Stahlkonstruktion mit Tekla oder AutoCAD',
            phaseId: 'phase-design',
            category: 'design',
            priority: 'high',
            estimatedHours: 120,
            estimatedCost: 12000,
            skills: ['CAD', 'Stahlbau', 'Tekla'],
            dependencies: [],
            deliverables: ['3D-Modell', 'Werkstattzeichnungen'],
            checklistItems: [
              'Aufmaß prüfen',
              '3D-Modell erstellen',
              'Statik abstimmen',
              'Werkstattzeichnungen ableiten'
            ],
            autoAssign: false
          },
          {
            id: 'task-cutting',
            name: 'CNC-Zuschnitt programmieren',
            description: 'NC-Programme für den Stahlzuschnitt erstellen',
            phaseId: 'phase-fabrication',
            category: 'construction',
            priority: 'high',
            estimatedHours: 40,
            estimatedCost: 4000,
            skills: ['CNC-Programmierung', 'Brennschneiden'],
            dependencies: ['task-design'],
            deliverables: ['NC-Programme', 'Zuschnittpläne'],
            checklistItems: [
              'Materialliste prüfen',
              'Verschnittoptimierung',
              'NC-Programm testen',
              'Qualitätskontrolle'
            ],
            autoAssign: false
          }
        ],
        milestones: [
          {
            id: 'milestone-design-approval',
            name: 'Konstruktion freigegeben',
            description: 'Statik geprüft und Konstruktion vom Kunden freigegeben',
            phaseId: 'phase-design',
            type: 'approval',
            criticalPath: true,
            deliverables: ['Statik', 'Werkstattzeichnungen'],
            approvers: ['Statiker', 'Kunde'],
            criteria: ['Statik geprüft', 'Konstruktion bestätigt']
          },
          {
            id: 'milestone-fabrication-complete',
            name: 'Fertigung abgeschlossen',
            description: 'Alle Stahlbauteile fertiggestellt und qualitätsgeprüft',
            phaseId: 'phase-fabrication',
            type: 'completion',
            criticalPath: true,
            deliverables: ['Fertige Bauteile', 'Prüfprotokoll'],
            approvers: ['Werkstattleiter', 'Qualitätskontrolle'],
            criteria: ['Alle Teile fertig', 'Qualität geprüft', 'Verpackung bereit']
          }
        ],
        documents: [
          {
            id: 'doc-construction-contract',
            name: 'Werkvertrag Stahlbau',
            type: 'contract',
            required: true,
            autoGenerate: false,
            approvalRequired: true
          },
          {
            id: 'doc-workshop-drawings',
            name: 'Werkstattzeichnungen',
            type: 'plan',
            phaseId: 'phase-design',
            required: true,
            autoGenerate: false,
            approvalRequired: true
          },
          {
            id: 'doc-welding-plan',
            name: 'Schweißplan',
            type: 'specification',
            phaseId: 'phase-fabrication',
            required: true,
            autoGenerate: false,
            approvalRequired: true
          }
        ],
        roles: [
          {
            id: 'role-project-manager',
            name: 'Projektleiter',
            description: 'Verantwortlich für die Gesamtkoordination des Stahlbauprojekts',
            responsibilities: ['Projektplanung', 'Koordination', 'Qualitätskontrolle', 'Kundenkommunikation'],
            skills: ['Projektmanagement', 'Stahlbau', 'Schweissen'],
            permissions: ['project.manage', 'tasks.assign', 'quality.control'],
            hourlyRate: 85,
            isExternal: false
          },
          {
            id: 'role-design-engineer',
            name: 'Konstrukteur',
            description: 'CAD-Konstruktion und technische Planung',
            responsibilities: ['3D-Modellierung', 'Werkstattzeichnungen', 'Statikabstimmung'],
            skills: ['CAD', 'Tekla', 'Stahlbau', 'Statik'],
            permissions: ['design.create', 'design.approve'],
            hourlyRate: 70,
            isExternal: false
          },
          {
            id: 'role-welder',
            name: 'Schweißer',
            description: 'Qualifizierte Schweißarbeiten nach DIN EN ISO',
            responsibilities: ['WIG/MAG-Schweißen', 'Qualitätskontrolle', 'Prüfung'],
            skills: ['WIG-Schweißen', 'MAG-Schweißen', 'Qualitätssicherung'],
            permissions: ['welding.execute', 'quality.check'],
            hourlyRate: 45,
            isExternal: false
          }
        ],
        settings: {
          allowCustomPhases: true,
          allowCustomTasks: true,
          requireApproval: true,
          autoCreateDocuments: true,
          sendNotifications: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        version: '1.0.0',
        tags: ['standard', 'stahlbau', 'industriebau', 'halle']
      },
      {
        id: 'template-railing-stairs',
        name: 'Geländer und Treppenkonstruktion',
        description: 'Standard-Vorlage für Edelstahl-Geländer und Treppen',
        category: 'railings_stairs',
        isDefault: true,
        estimatedDuration: 60,
        estimatedBudget: 85000,
        phases: [
          {
            id: 'phase-survey-design',
            name: 'Aufmaß & Konstruktion',
            description: 'Vermessung und CAD-Konstruktion',
            order: 1,
            estimatedDuration: 10,
            dependencies: [],
            status: 'pending',
            progress: 0,
            budget: 8500,
            actualCost: 0,
            color: '#3b82f6'
          },
          {
            id: 'phase-material-cutting',
            name: 'Materialzuschnitt',
            description: 'Edelstahl-Profile zuschneiden und vorbereiten',
            order: 2,
            estimatedDuration: 15,
            dependencies: ['phase-survey-design'],
            status: 'pending',
            progress: 0,
            budget: 17000,
            actualCost: 0,
            color: '#f59e0b'
          },
          {
            id: 'phase-welding',
            name: 'Schweißarbeiten',
            description: 'WIG-Schweißen und Zusammenbau',
            order: 3,
            estimatedDuration: 20,
            dependencies: ['phase-material-cutting'],
            status: 'pending',
            progress: 0,
            budget: 25500,
            actualCost: 0,
            color: '#10b981'
          },
          {
            id: 'phase-surface-finishing',
            name: 'Oberflächenveredelung',
            description: 'Polieren und Oberflächenbehandlung',
            order: 4,
            estimatedDuration: 10,
            dependencies: ['phase-welding'],
            status: 'pending',
            progress: 0,
            budget: 17000,
            actualCost: 0,
            color: '#8b5cf6'
          },
          {
            id: 'phase-installation',
            name: 'Montage vor Ort',
            description: 'Installation und Befestigung',
            order: 5,
            estimatedDuration: 5,
            dependencies: ['phase-surface-finishing'],
            status: 'pending',
            progress: 0,
            budget: 17000,
            actualCost: 0,
            color: '#ef4444'
          }
        ],
        tasks: [
          {
            id: 'task-cad-railing',
            name: 'CAD-Konstruktion Geländer',
            description: 'Detailkonstruktion der Geländersysteme',
            phaseId: 'phase-survey-design',
            category: 'design',
            priority: 'high',
            estimatedHours: 30,
            estimatedCost: 3000,
            skills: ['CAD', 'Edelstahlbau', 'Geländerbau'],
            dependencies: [],
            deliverables: ['Konstruktionszeichnungen', 'Stückliste'],
            checklistItems: [
              'Aufmaß prüfen',
              '3D-Modell erstellen',
              'Normkonformität prüfen',
              'Stückliste generieren'
            ],
            autoAssign: false
          },
          {
            id: 'task-tig-welding',
            name: 'WIG-Schweißarbeiten',
            description: 'Präzisions-Schweißarbeiten für Edelstahl',
            phaseId: 'phase-welding',
            category: 'fabrication',
            priority: 'critical',
            estimatedHours: 60,
            estimatedCost: 6000,
            skills: ['WIG-Schweißen', 'Edelstahlbearbeitung'],
            dependencies: ['task-cad-railing'],
            deliverables: ['Geschweißte Bauteile', 'Schweißnahtprüfung'],
            checklistItems: [
              'Materialprüfung',
              'Schweißparameter einstellen',
              'Qualitätskontrolle',
              'Nachbearbeitung'
            ],
            autoAssign: false
          }
        ],
        milestones: [
          {
            id: 'milestone-design-approval-railing',
            name: 'Konstruktion bestätigt',
            description: 'Geländerkonstruktion vom Kunden freigegeben',
            phaseId: 'phase-survey-design',
            type: 'approval',
            criticalPath: true,
            deliverables: ['Konstruktionszeichnungen', 'Kostenvoranschlag'],
            approvers: ['Kunde', 'Architekt'],
            criteria: ['Maßkonformität', 'Design bestätigt', 'Normkonformität']
          },
          {
            id: 'milestone-fabrication-complete-railing',
            name: 'Fertigung abgeschlossen',
            description: 'Alle Geländerteile fertiggestellt',
            phaseId: 'phase-surface-finishing',
            type: 'completion',
            criticalPath: true,
            deliverables: ['Fertige Geländer', 'Qualitätszeugnis'],
            approvers: ['Werkstattleiter', 'Qualitätskontrolle'],
            criteria: ['Alle Teile fertig', 'Oberflächenqualität OK', 'Maßgenauigkeit geprüft']
          }
        ],
        documents: [
          {
            id: 'doc-railing-contract',
            name: 'Werkvertrag Geländerbau',
            type: 'contract',
            required: true,
            autoGenerate: false,
            approvalRequired: true
          },
          {
            id: 'doc-railing-drawings',
            name: 'Geländerzeichnungen',
            type: 'plan',
            phaseId: 'phase-survey-design',
            required: true,
            autoGenerate: false,
            approvalRequired: true
          }
        ],
        roles: [
          {
            id: 'role-railing-designer',
            name: 'Geländerkonstrukteur',
            description: 'Spezialist für Geländer- und Treppenkonstruktionen',
            responsibilities: ['CAD-Konstruktion', 'Normprüfung', 'Detailplanung'],
            skills: ['CAD', 'Geländerbau', 'DIN EN 14122'],
            permissions: ['design.create', 'design.approve'],
            hourlyRate: 75,
            isExternal: false
          },
          {
            id: 'role-tig-welder',
            name: 'WIG-Schweißer',
            description: 'Spezialist für Edelstahl-WIG-Schweißarbeiten',
            responsibilities: ['WIG-Schweißen', 'Edelstahlbearbeitung', 'Qualitätskontrolle'],
            skills: ['WIG-Schweißen', 'Edelstahl', 'DIN EN 1090'],
            permissions: ['welding.execute', 'quality.check'],
            hourlyRate: 50,
            isExternal: false
          }
        ],
        settings: {
          allowCustomPhases: true,
          allowCustomTasks: true,
          requireApproval: true,
          autoCreateDocuments: true,
          sendNotifications: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        version: '1.0.0',
        tags: ['standard', 'geländerbau', 'edelstahl', 'treppen']
      }
    ];
  }
}

// V2 interfaces expected by integration tests
interface V2Phase {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedDurationPercent: number;
  dependsOn?: string[];
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    estimatedHours: number;
    requiredSkills: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
  }>;
}

interface V2Milestone {
  id: string;
  name: string;
  description: string;
  phaseId: string;
  dayOffset: number;
  isPaymentMilestone: boolean;
  paymentPercentage?: number;
  deliverables: string[];
}

interface V2Template {
  id: string;
  name: string;
  type: string;
  description: string;
  estimatedDurationMultiplier: number;
  phases: V2Phase[];
  defaultMilestones: V2Milestone[];
  requiredDocuments: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

import { PermissionService } from './permissionService';

function loadV2Templates(): V2Template[] {
  try {
    const raw = localStorage.getItem(ProjectTemplateService.NEW_TEMPLATES_KEY) as string | null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveV2Templates(list: V2Template[]): void {
  localStorage.setItem(ProjectTemplateService.NEW_TEMPLATES_KEY, JSON.stringify(list));
}

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem('bauplan-buddy-user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id ?? null;
  } catch {
    return null;
  }
}
