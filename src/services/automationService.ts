import { ProjectInsight } from './aiInsightsService';

export type ActionType = 'email' | 'task' | 'notification' | 'update' | 'create';

export interface AutomationAction {
  id: string;
  type: ActionType;
  label: string;
  description: string;
  icon?: string;
  handler: () => Promise<void>;
  isDestructive?: boolean;
}

export interface AutomationSuggestion {
  id: string;
  insightId: string;
  title: string;
  actions: AutomationAction[];
  autoExecute?: boolean; // If confidence is high enough
}

class AutomationService {
  /**
   * Generate automation suggestions based on insights
   */
  generateSuggestions(insights: ProjectInsight[]): AutomationSuggestion[] {
    return insights.map(insight => this.mapInsightToAutomation(insight)).filter(Boolean) as AutomationSuggestion[];
  }

  private mapInsightToAutomation(insight: ProjectInsight): AutomationSuggestion | null {
    switch (insight.type) {
      case 'risk':
        if (insight.id.includes('budget')) {
          return {
            id: `auto-${insight.id}`,
            insightId: insight.id,
            title: 'Budget Control Actions',
            actions: [
              {
                id: 'notify-stakeholders',
                type: 'email',
                label: 'Notify Stakeholders',
                description: 'Send budget alert email to project owners',
                handler: async () => console.log('Sending budget alert...'),
              },
              {
                id: 'create-review-task',
                type: 'task',
                label: 'Schedule Budget Review',
                description: 'Create a task for "Budget Review Meeting"',
                handler: async () => console.log('Creating review task...'),
              }
            ]
          };
        }
        if (insight.id.includes('deadline')) {
          return {
            id: `auto-${insight.id}`,
            insightId: insight.id,
            title: 'Schedule Recovery Actions',
            actions: [
              {
                id: 'contact-team',
                type: 'notification',
                label: 'Alert Team',
                description: 'Send urgent notification to project team',
                handler: async () => console.log('Alerting team...'),
              },
              {
                id: 'reschedule-tasks',
                type: 'update',
                label: 'Optimize Schedule',
                description: 'Auto-adjust non-critical tasks',
                handler: async () => console.log('Optimizing schedule...'),
              }
            ]
          };
        }
        break;

      case 'opportunity':
        if (insight.id.includes('resource')) {
          return {
            id: `auto-${insight.id}`,
            insightId: insight.id,
            title: 'Resource Optimization',
            actions: [
              {
                id: 'share-resources',
                type: 'update',
                label: 'Enable Resource Sharing',
                description: 'Link inventory pools between projects',
                handler: async () => console.log('Linking resources...'),
              }
            ]
          };
        }
        break;
        
      case 'recommendation':
        if (insight.id.includes('weather')) {
           return {
            id: `auto-${insight.id}`,
            insightId: insight.id,
            title: 'Weather Adaptation',
            actions: [
              {
                id: 'reschedule-outdoor',
                type: 'update',
                label: 'Reschedule Outdoor Work',
                description: 'Move outdoor tasks to sunny days',
                handler: async () => console.log('Rescheduling outdoor tasks...'),
              }
            ]
          };
        }
        break;
    }
    return null;
  }

  /**
   * Execute an automation action
   */
  async executeAction(action: AutomationAction): Promise<boolean> {
    try {
      console.log(`Executing action: ${action.label}`);
      await action.handler();
      return true;
    } catch (error) {
      console.error('Automation execution failed:', error);
      return false;
    }
  }
}

export const automationService = new AutomationService();
export default automationService;
