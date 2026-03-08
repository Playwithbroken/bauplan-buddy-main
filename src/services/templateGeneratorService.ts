export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  phases: TemplatePhase[];
  estimatedDurationWeeks: number;
  estimatedCostRange: { min: number; max: number };
}

export interface TemplatePhase {
  name: string;
  tasks: string[];
  durationWeeks: number;
}

class TemplateGeneratorService {
  /**
   * Generate a project template based on user description
   */
  async generateTemplate(description: string, type: string): Promise<ProjectTemplate> {
    // Mock generation logic - in real app would call LLM
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

    const isRenovation = description.toLowerCase().includes('renovation') || type === 'renovation';
    
    if (isRenovation) {
      return {
        id: `tpl-${Date.now()}`,
        name: 'Smart Renovation Plan',
        description: `Customized renovation plan based on: "${description}"`,
        estimatedDurationWeeks: 8,
        estimatedCostRange: { min: 15000, max: 25000 },
        phases: [
          {
            name: 'Planning & Design',
            durationWeeks: 2,
            tasks: ['Site survey', 'Design concepts', 'Material selection', 'Permit application']
          },
          {
            name: 'Demolition & Prep',
            durationWeeks: 1,
            tasks: ['Clear area', 'Remove old fixtures', 'Waste disposal']
          },
          {
            name: 'Construction',
            durationWeeks: 4,
            tasks: ['Framing', 'Electrical rough-in', 'Plumbing rough-in', 'Drywall', 'Painting']
          },
          {
            name: 'Finishing',
            durationWeeks: 1,
            tasks: ['Flooring installation', 'Fixture installation', 'Final cleanup', 'Walkthrough']
          }
        ]
      };
    }

    // Default template
    return {
      id: `tpl-${Date.now()}`,
      name: 'General Construction Project',
      description: `Standard project plan based on: "${description}"`,
      estimatedDurationWeeks: 12,
      estimatedCostRange: { min: 50000, max: 80000 },
      phases: [
        {
          name: 'Initiation',
          durationWeeks: 2,
          tasks: ['Project charter', 'Stakeholder meeting']
        },
        {
          name: 'Execution',
          durationWeeks: 8,
          tasks: ['Foundation', 'Structure', 'Systems']
        },
        {
          name: 'Closure',
          durationWeeks: 2,
          tasks: ['Inspection', 'Handover']
        }
      ]
    };
  }
}

export const templateGeneratorService = new TemplateGeneratorService();
export default templateGeneratorService;
