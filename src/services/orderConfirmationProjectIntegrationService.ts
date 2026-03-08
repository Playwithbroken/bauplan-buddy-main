/**
 * Order Confirmation to Project Integration Service
 * 
 * Handles the workflow between confirmed order confirmations and project creation
 */

interface OrderConfirmation {
  id: string;
  number: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  project: {
    name: string;
    address: string;
    description?: string;
  };
  positions: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    category: string;
  }>;
  amount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'cancelled';
  confirmedAt?: string;
  validUntil: string;
  createdAt: string;
}

interface ProjectData {
  id: string;
  number: string;
  name: string;
  description: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  address: string;
  budget: number;
  estimatedDuration: number;
  startDate: string;
  endDate: string;
  status: 'planning' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  phases: ProjectPhase[];
  workPackages: WorkPackage[];
  materials: MaterialRequirement[];
  team: TeamMember[];
  createdAt: string;
  createdFrom: {
    type: 'order_confirmation';
    id: string;
    number: string;
  };
}

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  dependsOn?: string[]; // IDs of phases this depends on
  workPackages: string[]; // IDs of work packages in this phase
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  progress: number; // 0-100
}

interface WorkPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedHours: number;
  estimatedCost: number;
  phaseId: string;
  assignedTo?: string;
  status: 'planned' | 'in_progress' | 'completed';
  progress: number; // 0-100
  materials: string[]; // IDs of required materials
}

interface MaterialRequirement {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  deliveryDate?: string;
  status: 'required' | 'ordered' | 'delivered' | 'installed';
  workPackageId: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  skills: string[];
  availability: number; // percentage
}

interface ProjectCreationOptions {
  startDate?: string;
  estimatedDuration?: number;
  includeBuffer?: boolean;
  bufferPercentage?: number;
  autoAssignTeam?: boolean;
  createMilestones?: boolean;
  notifyTeam?: boolean;
}

export class OrderConfirmationProjectIntegrationService {
  private static instance: OrderConfirmationProjectIntegrationService;
  
  // In a real application, these would be stored in a database
  private projects: ProjectData[] = [];
  private projectIdCounter = 1;

  // Predefined project templates based on categories
  private readonly phaseTemplates = {
    steel_construction: [
      { name: 'Konstruktion & Planung', duration: 14, description: 'CAD-Konstruktion, Statik und Genehmigungsplanung' },
      { name: 'Materialbestellung', duration: 7, description: 'Stahlbestellung und Lieferplanung' },
      { name: 'Fertigung', duration: 30, description: 'Zuschnitt, Schweißarbeiten und Vorfertigung' },
      { name: 'Oberflächenbehandlung', duration: 10, description: 'Sandstrahlen, Grundierung und Beschichtung' },
      { name: 'Montage vor Ort', duration: 21, description: 'Transport und Montage der Stahlkonstruktion' },
      { name: 'Abnahme und Übergabe', duration: 5, description: 'Finale Abnahme und Projektübergabe' }
    ],
    facade_systems: [
      { name: 'Aufmaß und Planung', duration: 10, description: 'Fassadenvermessung und Detailplanung' },
      { name: 'Materialbestellung', duration: 7, description: 'Pfosten-Riegel-System und Verglasung bestellen' },
      { name: 'Vorfertigung', duration: 14, description: 'Werkstattfertigung der Fassadenelemente' },
      { name: 'Montage Unterkonstruktion', duration: 10, description: 'Befestigung und Ausrichtung der Tragkonstruktion' },
      { name: 'Glasmontage', duration: 14, description: 'Verglasung und Abdichtung' },
      { name: 'Abschlussarbeiten', duration: 5, description: 'Reinigung und finale Kontrolle' }
    ],
    railings_stairs: [
      { name: 'Aufmaß und Konstruktion', duration: 7, description: 'Vermessung und CAD-Konstruktion' },
      { name: 'Materialzuschnitt', duration: 5, description: 'Edelstahl-Profile zuschneiden' },
      { name: 'Schweißarbeiten', duration: 10, description: 'WIG-Schweißen und Zusammenbau' },
      { name: 'Oberflächenbehandlung', duration: 7, description: 'Polieren und Oberflächenveredelung' },
      { name: 'Montage vor Ort', duration: 8, description: 'Installation und Befestigung' },
      { name: 'Abnahme', duration: 2, description: 'Qualitätskontrolle und Übergabe' }
    ]
  };

  public static getInstance(): OrderConfirmationProjectIntegrationService {
    if (!OrderConfirmationProjectIntegrationService.instance) {
      OrderConfirmationProjectIntegrationService.instance = new OrderConfirmationProjectIntegrationService();
    }
    return OrderConfirmationProjectIntegrationService.instance;
  }

  /**
   * Create project from confirmed order confirmation
   */
  public async createProjectFromOrderConfirmation(
    orderConfirmation: OrderConfirmation,
    options: ProjectCreationOptions = {}
  ): Promise<ProjectData> {
    
    // Validate that order confirmation is confirmed
    if (orderConfirmation.status !== 'confirmed') {
      throw new Error('Order confirmation must be confirmed before creating a project');
    }

    // Generate project number
    const projectNumber = `PRJ-${new Date().getFullYear()}-${String(this.projectIdCounter++).padStart(6, '0')}`;

    // Determine project category from positions
    const projectCategory = this.determineProjectCategory(orderConfirmation.positions);
    
    // Calculate project timeline
    const timeline = this.calculateProjectTimeline(orderConfirmation, options);
    
    // Create project phases
    const phases = this.createProjectPhases(projectCategory, timeline.startDate, options);
    
    // Create work packages from order confirmation positions
    const workPackages = this.createWorkPackagesFromPositions(orderConfirmation.positions, phases);
    
    // Extract material requirements
    const materials = this.extractMaterialRequirements(orderConfirmation.positions, workPackages);
    
    // Auto-assign team if requested
    const team = options.autoAssignTeam ? this.autoAssignTeam(projectCategory, workPackages) : [];

    const project: ProjectData = {
      id: projectNumber,
      number: projectNumber,
      name: orderConfirmation.project.name,
      description: orderConfirmation.project.description || `Project created from order confirmation ${orderConfirmation.number}`,
      customer: orderConfirmation.customer,
      address: orderConfirmation.project.address,
      budget: orderConfirmation.amount,
      estimatedDuration: timeline.duration,
      startDate: timeline.startDate,
      endDate: timeline.endDate,
      status: 'planning',
      phases,
      workPackages,
      materials,
      team,
      createdAt: new Date().toISOString(),
      createdFrom: {
        type: 'order_confirmation',
        id: orderConfirmation.id,
        number: orderConfirmation.number
      }
    };

    // Store project
    this.projects.push(project);

    // Send notifications if requested
    if (options.notifyTeam && team.length > 0) {
      await this.notifyTeamMembers(project, team);
    }

    return project;
  }

  /**
   * Get projects created from order confirmations
   */
  public getProjectsFromOrderConfirmations(): ProjectData[] {
    return this.projects.filter(p => p.createdFrom.type === 'order_confirmation');
  }

  /**
   * Get project by order confirmation ID
   */
  public getProjectByOrderConfirmationId(orderConfirmationId: string): ProjectData | null {
    return this.projects.find(p => 
      p.createdFrom.type === 'order_confirmation' && 
      p.createdFrom.id === orderConfirmationId
    ) || null;
  }

  /**
   * Update project status based on order confirmation changes
   */
  public updateProjectFromOrderConfirmation(
    orderConfirmationId: string,
    newStatus: string
  ): ProjectData | null {
    const project = this.getProjectByOrderConfirmationId(orderConfirmationId);
    if (!project) return null;

    // Update project status based on order confirmation status
    switch (newStatus) {
      case 'cancelled':
        project.status = 'cancelled';
        break;
      case 'confirmed':
        if (project.status === 'planning') {
          project.status = 'approved';
        }
        break;
    }

    return project;
  }

  /**
   * Determine project category from positions
   */
  private determineProjectCategory(positions: OrderConfirmation['positions']): string {
    const categories = positions.map(p => p.category);
    
    if (categories.includes('steel_construction') || categories.includes('structural')) {
      return 'steel_construction';
    } else if (categories.includes('facade') || categories.includes('glazing')) {
      return 'facade_systems';
    } else if (categories.includes('railings') || categories.includes('stairs')) {
      return 'railings_stairs';
    } else {
      return 'steel_construction'; // Default to steel construction for Metallbau
    }
  }

  /**
   * Calculate project timeline
   */
  private calculateProjectTimeline(
    orderConfirmation: OrderConfirmation,
    options: ProjectCreationOptions
  ): { startDate: string; endDate: string; duration: number } {
    
    const startDate = new Date(options.startDate || new Date());
    startDate.setDate(startDate.getDate() + 7); // Start 1 week from now by default
    
    // Base duration calculation
    let baseDuration = options.estimatedDuration || Math.max(30, Math.floor(orderConfirmation.amount / 5000));
    
    // Add buffer if requested
    if (options.includeBuffer) {
      const bufferPercentage = options.bufferPercentage || 20;
      baseDuration = Math.floor(baseDuration * (1 + bufferPercentage / 100));
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + baseDuration);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      duration: baseDuration
    };
  }

  /**
   * Create project phases
   */
  private createProjectPhases(
    category: string,
    startDate: string,
    options: ProjectCreationOptions
  ): ProjectPhase[] {
    
    const templates = this.phaseTemplates[category] || this.phaseTemplates.construction;
    const phases: ProjectPhase[] = [];
    let currentDate = new Date(startDate);
    
    templates.forEach((template, index) => {
      const phaseStartDate = new Date(currentDate);
      const phaseEndDate = new Date(currentDate);
      phaseEndDate.setDate(phaseEndDate.getDate() + template.duration);
      
      phases.push({
        id: `phase_${index + 1}`,
        name: template.name,
        description: template.description,
        startDate: phaseStartDate.toISOString().split('T')[0],
        endDate: phaseEndDate.toISOString().split('T')[0],
        duration: template.duration,
        dependsOn: index > 0 ? [`phase_${index}`] : undefined,
        workPackages: [],
        status: 'planned',
        progress: 0
      });
      
      currentDate = new Date(phaseEndDate);
      currentDate.setDate(currentDate.getDate() + 1); // 1 day gap between phases
    });
    
    return phases;
  }

  /**
   * Create work packages from order confirmation positions
   */
  private createWorkPackagesFromPositions(
    positions: OrderConfirmation['positions'],
    phases: ProjectPhase[]
  ): WorkPackage[] {
    
    const workPackages: WorkPackage[] = [];
    
    positions.forEach((position, index) => {
      // Assign to appropriate phase based on category
      const phaseId = this.assignPositionToPhase(position.category, phases);
      
      const workPackage: WorkPackage = {
        id: `wp_${index + 1}`,
        name: position.description,
        description: `Work package created from position: ${position.description}`,
        category: position.category,
        estimatedHours: Math.max(8, Math.floor(position.total / 50)), // Rough estimate
        estimatedCost: position.total,
        phaseId,
        status: 'planned',
        progress: 0,
        materials: []
      };
      
      workPackages.push(workPackage);
      
      // Add work package to phase
      const phase = phases.find(p => p.id === phaseId);
      if (phase) {
        phase.workPackages.push(workPackage.id);
      }
    });
    
    return workPackages;
  }

  /**
   * Assign position to appropriate phase
   */
  private assignPositionToPhase(category: string, phases: ProjectPhase[]): string {
    // Simple mapping of categories to phases
    const categoryPhaseMapping = {
      'construction': 'phase_3', // Rohbau
      'roofing': 'phase_4', // Dacharbeiten
      'electrical': 'phase_5', // Gebäudetechnik
      'plumbing': 'phase_5', // Gebäudetechnik
      'heating': 'phase_5', // Gebäudetechnik
      'interior': 'phase_6', // Innenausbau
      'flooring': 'phase_6', // Innenausbau
      'painting': 'phase_6' // Innenausbau
    };
    
    const assignedPhaseId = categoryPhaseMapping[category] || 'phase_3';
    
    // Check if phase exists, otherwise assign to first available phase
    const phase = phases.find(p => p.id === assignedPhaseId);
    return phase ? assignedPhaseId : phases[0]?.id || 'phase_1';
  }

  /**
   * Extract material requirements from positions
   */
  private extractMaterialRequirements(
    positions: OrderConfirmation['positions'],
    workPackages: WorkPackage[]
  ): MaterialRequirement[] {
    
    const materials: MaterialRequirement[] = [];
    
    positions.forEach((position, index) => {
      // Create material requirement based on position
      const workPackage = workPackages[index];
      if (!workPackage) return;
      
      const material: MaterialRequirement = {
        id: `mat_${index + 1}`,
        name: position.description,
        description: `Material for: ${position.description}`,
        quantity: position.quantity,
        unit: position.unit,
        unitCost: position.unitPrice,
        totalCost: position.total,
        status: 'required',
        workPackageId: workPackage.id
      };
      
      materials.push(material);
      workPackage.materials.push(material.id);
    });
    
    return materials;
  }

  /**
   * Auto-assign team members
   */
  private autoAssignTeam(category: string, workPackages: WorkPackage[]): TeamMember[] {
    // Mock team assignment based on project category
    const teamTemplates = {
      construction: [
        { name: 'Max Mustermann', role: 'Project Manager', skills: ['project_management', 'construction'] },
        { name: 'Hans Müller', role: 'Site Supervisor', skills: ['supervision', 'safety'] },
        { name: 'Fritz Schmidt', role: 'Electrician', skills: ['electrical', 'installation'] },
        { name: 'Klaus Weber', role: 'Plumber', skills: ['plumbing', 'heating'] }
      ],
      roofing: [
        { name: 'Stefan Dach', role: 'Roofing Specialist', skills: ['roofing', 'construction'] },
        { name: 'Michael Zimmermann', role: 'Carpenter', skills: ['carpentry', 'roofing'] }
      ],
      renovation: [
        { name: 'Anna Renovier', role: 'Renovation Specialist', skills: ['renovation', 'interior'] },
        { name: 'Peter Maler', role: 'Painter', skills: ['painting', 'decoration'] }
      ]
    };
    
    const template = teamTemplates[category] || teamTemplates.construction;
    
    return template.map((member, index) => ({
      id: `team_${index + 1}`,
      name: member.name,
      role: member.role,
      email: `${member.name.toLowerCase().replace(' ', '.')}@company.com`,
      phone: `+49 ${Math.random().toString().substr(2, 10)}`,
      skills: member.skills,
      availability: 100
    }));
  }

  /**
   * Notify team members about new project
   */
  private async notifyTeamMembers(project: ProjectData, team: TeamMember[]): Promise<void> {
    // In a real application, this would send actual notifications
    console.log(`Notifying ${team.length} team members about new project: ${project.name}`);
    
    // Simulate notification delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Get integration statistics
   */
  public getIntegrationStats(): {
    totalProjects: number;
    projectsFromOrderConfirmations: number;
    averageProjectValue: number;
    projectsByStatus: Record<string, number>;
    projectsByCategory: Record<string, number>;
  } {
    const projectsFromOC = this.getProjectsFromOrderConfirmations();
    
    const projectsByStatus: Record<string, number> = {};
    const projectsByCategory: Record<string, number> = {};
    
    projectsFromOC.forEach(project => {
      projectsByStatus[project.status] = (projectsByStatus[project.status] || 0) + 1;
      
      // Determine category from work packages
      const categories = project.workPackages.map(wp => wp.category);
      const mainCategory = categories[0] || 'other';
      projectsByCategory[mainCategory] = (projectsByCategory[mainCategory] || 0) + 1;
    });
    
    const averageProjectValue = projectsFromOC.length > 0
      ? projectsFromOC.reduce((sum, p) => sum + p.budget, 0) / projectsFromOC.length
      : 0;
    
    return {
      totalProjects: this.projects.length,
      projectsFromOrderConfirmations: projectsFromOC.length,
      averageProjectValue,
      projectsByStatus,
      projectsByCategory
    };
  }
}

export default OrderConfirmationProjectIntegrationService;