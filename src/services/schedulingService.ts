/**
 * Intelligent Scheduling Service
 * AI-powered scheduling suggestions for construction projects
 */

export interface ScheduleTask {
  id: string;
  name: string;
  duration: number; // hours
  priority: 'low' | 'normal' | 'high' | 'critical';
  dependencies?: string[]; // task IDs
  resources?: string[]; // resource IDs
  skills?: string[]; // required skills
  preferredTime?: 'morning' | 'afternoon' | 'anytime';
  weatherSensitive?: boolean;
  deadline?: Date;
  projectId: string;
}

export interface ScheduleResource {
  id: string;
  name: string;
  type: 'person' | 'equipment' | 'subcontractor';
  skills: string[];
  availability: {
    monday: { start: string; end: string };
    tuesday: { start: string; end: string };
    wednesday: { start: string; end: string };
    thursday: { start: string; end: string };
    friday: { start: string; end: string };
    saturday?: { start: string; end: string };
  };
  costPerHour?: number;
  efficiency?: number; // 0.5 - 1.5, 1 = standard
}

export interface ScheduleSlot {
  taskId: string;
  resourceId: string;
  startTime: Date;
  endTime: Date;
  confidence: number; // 0-100
}

export interface ScheduleSuggestion {
  id: string;
  slots: ScheduleSlot[];
  totalDuration: number;
  estimatedCost: number;
  efficiencyScore: number;
  conflicts: ScheduleConflict[];
  warnings: string[];
  optimizationNotes: string[];
}

export interface ScheduleConflict {
  type: 'resource' | 'dependency' | 'deadline' | 'availability';
  taskId: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface ScheduleConstraints {
  startDate: Date;
  endDate?: Date;
  workingHours: { start: string; end: string };
  excludeDates?: Date[];
  prioritizeDeadlines?: boolean;
  minimizeResourceSwitching?: boolean;
  balanceWorkload?: boolean;
}

// Default working hours
const DEFAULT_CONSTRAINTS: ScheduleConstraints = {
  startDate: new Date(),
  workingHours: { start: '07:00', end: '17:00' },
  prioritizeDeadlines: true,
  minimizeResourceSwitching: true,
  balanceWorkload: true,
};

// Parse time string to minutes since midnight
const parseTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Get available hours for a day
const getAvailableHours = (workStart: string, workEnd: string): number => {
  const start = parseTime(workStart);
  const end = parseTime(workEnd);
  return (end - start) / 60;
};

class SchedulingService {
  private tasks: Map<string, ScheduleTask> = new Map();
  private resources: Map<string, ScheduleResource> = new Map();

  /**
   * Add tasks to schedule
   */
  setTasks(tasks: ScheduleTask[]): void {
    this.tasks.clear();
    tasks.forEach((t) => this.tasks.set(t.id, t));
  }

  /**
   * Add resources to schedule
   */
  setResources(resources: ScheduleResource[]): void {
    this.resources.clear();
    resources.forEach((r) => this.resources.set(r.id, r));
  }

  /**
   * Generate optimized schedule suggestions
   */
  async generateSchedule(
    constraints: Partial<ScheduleConstraints> = {}
  ): Promise<ScheduleSuggestion[]> {
    const fullConstraints = { ...DEFAULT_CONSTRAINTS, ...constraints };
    const suggestions: ScheduleSuggestion[] = [];

    // Sort tasks by priority and dependencies
    const sortedTasks = this.topologicalSort();

    // Generate multiple scheduling strategies
    const strategies = [
      { name: 'earliest', weight: 0.4 },
      { name: 'balanced', weight: 0.35 },
      { name: 'costOptimized', weight: 0.25 },
    ];

    for (const strategy of strategies) {
      const suggestion = this.createSchedule(sortedTasks, fullConstraints, strategy.name);
      suggestion.efficiencyScore *= strategy.weight;
      suggestions.push(suggestion);
    }

    // Sort by efficiency score
    return suggestions.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  }

  /**
   * Get next available slot for a task
   */
  findNextSlot(
    taskId: string,
    afterDate?: Date,
    preferredResource?: string
  ): ScheduleSlot | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const startDate = afterDate || new Date();
    const availableResources = this.findAvailableResources(task);

    if (availableResources.length === 0) {
      return null;
    }

    // Prefer specified resource if available
    const resource = preferredResource
      ? availableResources.find((r) => r.id === preferredResource) || availableResources[0]
      : availableResources[0];

    // Find next available time slot
    const slot = this.findResourceSlot(task, resource, startDate);
    return slot;
  }

  /**
   * Check for scheduling conflicts
   */
  validateSchedule(slots: ScheduleSlot[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // Check for resource conflicts
    const resourceSlots = new Map<string, ScheduleSlot[]>();
    slots.forEach((slot) => {
      if (!resourceSlots.has(slot.resourceId)) {
        resourceSlots.set(slot.resourceId, []);
      }
      resourceSlots.get(slot.resourceId)!.push(slot);
    });

    resourceSlots.forEach((resourceSlotList, resourceId) => {
      // Sort by start time
      resourceSlotList.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      // Check for overlaps
      for (let i = 0; i < resourceSlotList.length - 1; i++) {
        const current = resourceSlotList[i];
        const next = resourceSlotList[i + 1];

        if (current.endTime > next.startTime) {
          conflicts.push({
            type: 'resource',
            taskId: next.taskId,
            description: `Ressource ${resourceId} ist bereits belegt`,
            severity: 'high',
            suggestion: 'Verschieben Sie eine der Aufgaben oder wählen Sie eine andere Ressource',
          });
        }
      }
    });

    // Check dependencies
    slots.forEach((slot) => {
      const task = this.tasks.get(slot.taskId);
      if (!task?.dependencies) return;

      task.dependencies.forEach((depId) => {
        const depSlot = slots.find((s) => s.taskId === depId);
        if (depSlot && depSlot.endTime > slot.startTime) {
          conflicts.push({
            type: 'dependency',
            taskId: slot.taskId,
            description: `Abhängigkeit "${this.tasks.get(depId)?.name}" ist noch nicht abgeschlossen`,
            severity: 'high',
            suggestion: 'Verschieben Sie den Start nach Abschluss der Abhängigkeit',
          });
        }
      });
    });

    // Check deadlines
    slots.forEach((slot) => {
      const task = this.tasks.get(slot.taskId);
      if (!task?.deadline) return;

      if (slot.endTime > task.deadline) {
        conflicts.push({
          type: 'deadline',
          taskId: slot.taskId,
          description: `Deadline wird um ${Math.ceil((slot.endTime.getTime() - task.deadline.getTime()) / (1000 * 60 * 60))} Stunden überschritten`,
          severity: 'high',
          suggestion: 'Erhöhen Sie die Ressourcen oder passen Sie die Priorität an',
        });
      }
    });

    return conflicts;
  }

  /**
   * Suggest optimal resource for a task
   */
  suggestResource(taskId: string): ScheduleResource | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const available = this.findAvailableResources(task);
    if (available.length === 0) return null;

    // Score resources based on skills match and efficiency
    const scored = available.map((resource) => {
      let score = 0;

      // Skill match
      if (task.skills) {
        const matchingSkills = task.skills.filter((s) => resource.skills.includes(s));
        score += (matchingSkills.length / task.skills.length) * 50;
      } else {
        score += 25;
      }

      // Efficiency bonus
      score += (resource.efficiency || 1) * 30;

      // Cost penalty (prefer cheaper resources for normal tasks)
      if (task.priority !== 'critical' && resource.costPerHour) {
        score -= Math.min(20, resource.costPerHour / 10);
      }

      return { resource, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.resource || null;
  }

  /**
   * Estimate completion date for remaining tasks
   */
  estimateCompletion(
    completedTaskIds: string[] = [],
    startFrom: Date = new Date()
  ): Date {
    const remainingTasks = Array.from(this.tasks.values()).filter(
      (t) => !completedTaskIds.includes(t.id)
    );

    if (remainingTasks.length === 0) {
      return startFrom;
    }

    // Calculate total remaining hours
    const totalHours = remainingTasks.reduce((sum, t) => sum + t.duration, 0);

    // Assume average available resources
    const avgResourcesAvailable = Math.max(1, Math.floor(this.resources.size * 0.7));
    const hoursPerDay = 8;
    const daysNeeded = Math.ceil(totalHours / (avgResourcesAvailable * hoursPerDay));

    // Account for weekends (rough estimate)
    const workDays = daysNeeded;
    const totalDays = Math.ceil(workDays * 1.4); // ~40% more for weekends

    const completionDate = new Date(startFrom);
    completionDate.setDate(completionDate.getDate() + totalDays);

    return completionDate;
  }

  // Private methods

  private topologicalSort(): ScheduleTask[] {
    const tasks = Array.from(this.tasks.values());
    const result: ScheduleTask[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (task: ScheduleTask): void => {
      if (temp.has(task.id)) {
        throw new Error(`Circular dependency detected: ${task.id}`);
      }
      if (visited.has(task.id)) return;

      temp.add(task.id);

      // Visit dependencies first
      if (task.dependencies) {
        task.dependencies.forEach((depId) => {
          const dep = this.tasks.get(depId);
          if (dep) visit(dep);
        });
      }

      temp.delete(task.id);
      visited.add(task.id);
      result.push(task);
    };

    // Sort by priority first
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const sorted = [...tasks].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    sorted.forEach((task) => {
      if (!visited.has(task.id)) {
        visit(task);
      }
    });

    return result;
  }

  private createSchedule(
    tasks: ScheduleTask[],
    constraints: ScheduleConstraints,
    strategy: string
  ): ScheduleSuggestion {
    const slots: ScheduleSlot[] = [];
    const conflicts: ScheduleConflict[] = [];
    const warnings: string[] = [];
    const resourceSchedule = new Map<string, Date>(); // next available time per resource

    let currentTime = new Date(constraints.startDate);
    let totalCost = 0;

    for (const task of tasks) {
      const availableResources = this.findAvailableResources(task);

      if (availableResources.length === 0) {
        warnings.push(`Keine passende Ressource für "${task.name}" gefunden`);
        continue;
      }

      // Select resource based on strategy
      let resource: ScheduleResource;
      switch (strategy) {
        case 'costOptimized':
          resource = availableResources.sort(
            (a, b) => (a.costPerHour || 0) - (b.costPerHour || 0)
          )[0];
          break;
        case 'balanced':
          // Pick resource with least scheduled work
          resource = availableResources.reduce((best, r) => {
            const bestTime = resourceSchedule.get(best.id)?.getTime() || 0;
            const rTime = resourceSchedule.get(r.id)?.getTime() || 0;
            return rTime < bestTime ? r : best;
          }, availableResources[0]);
          break;
        default: // earliest
          resource = availableResources[0];
      }

      // Find slot
      const lastResourceTime = resourceSchedule.get(resource.id) || currentTime;
      const slot = this.findResourceSlot(task, resource, lastResourceTime);

      if (slot) {
        slots.push(slot);
        resourceSchedule.set(resource.id, slot.endTime);
        totalCost += (resource.costPerHour || 0) * task.duration;
      }
    }

    // Validate and find conflicts
    conflicts.push(...this.validateSchedule(slots));

    // Calculate efficiency score
    const totalDuration = slots.reduce(
      (sum, s) => sum + (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60),
      0
    );

    const idealDuration = tasks.reduce((sum, t) => sum + t.duration, 0);
    const efficiencyScore = idealDuration > 0 ? (idealDuration / Math.max(totalDuration, 1)) * 100 : 0;

    return {
      id: `schedule-${Date.now()}-${strategy}`,
      slots,
      totalDuration,
      estimatedCost: totalCost,
      efficiencyScore: Math.min(100, efficiencyScore),
      conflicts,
      warnings,
      optimizationNotes: this.getOptimizationNotes(strategy, conflicts),
    };
  }

  private findAvailableResources(task: ScheduleTask): ScheduleResource[] {
    const resources = Array.from(this.resources.values());

    if (!task.skills || task.skills.length === 0) {
      return resources;
    }

    return resources.filter((r) =>
      task.skills!.some((skill) => r.skills.includes(skill))
    );
  }

  private findResourceSlot(
    task: ScheduleTask,
    resource: ScheduleResource,
    afterTime: Date
  ): ScheduleSlot | null {
    const startTime = new Date(afterTime);
    const efficiency = resource.efficiency || 1;
    const actualDuration = task.duration / efficiency;

    // Simplified: assume task can start immediately
    const endTime = new Date(startTime.getTime() + actualDuration * 60 * 60 * 1000);

    return {
      taskId: task.id,
      resourceId: resource.id,
      startTime,
      endTime,
      confidence: 85 + Math.random() * 15, // 85-100%
    };
  }

  private getOptimizationNotes(strategy: string, conflicts: ScheduleConflict[]): string[] {
    const notes: string[] = [];

    switch (strategy) {
      case 'earliest':
        notes.push('Optimiert für schnellstmögliche Fertigstellung');
        break;
      case 'balanced':
        notes.push('Gleichmäßige Arbeitsverteilung auf alle Ressourcen');
        break;
      case 'costOptimized':
        notes.push('Minimierung der Personalkosten');
        break;
    }

    if (conflicts.length === 0) {
      notes.push('Keine Konflikte erkannt');
    } else {
      notes.push(`${conflicts.length} Konflikte müssen behoben werden`);
    }

    return notes;
  }
}

// Export singleton
export const schedulingService = new SchedulingService();
export default schedulingService;
