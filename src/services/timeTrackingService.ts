import { v4 as uuidv4 } from 'uuid';

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  activity: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  description?: string;
  isManual: boolean;
}

class TimeTrackingService {
  private entries: TimeEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const saved = localStorage.getItem('bauplan_time_entries');
    if (saved) {
      this.entries = JSON.parse(saved).map((e: any) => ({
        ...e,
        startTime: new Date(e.startTime),
        endTime: e.endTime ? new Date(e.endTime) : undefined
      }));
    }
  }

  private saveToStorage() {
    localStorage.setItem('bauplan_time_entries', JSON.stringify(this.entries));
  }

  clockIn(userId: string, projectId: string, activity: string): TimeEntry {
    const entry: TimeEntry = {
      id: uuidv4(),
      userId,
      projectId,
      activity,
      startTime: new Date(),
      isManual: false
    };
    this.entries.push(entry);
    this.saveToStorage();
    return entry;
  }

  clockOut(userId: string): TimeEntry | null {
    const activeEntry = this.entries.find(e => e.userId === userId && !e.endTime);
    if (!activeEntry) return null;

    activeEntry.endTime = new Date();
    activeEntry.duration = Math.round((activeEntry.endTime.getTime() - activeEntry.startTime.getTime()) / 60000);
    this.saveToStorage();
    return activeEntry;
  }

  getEntries(userId: string): TimeEntry[] {
    return this.entries.filter(e => e.userId === userId).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
  }

  getActiveEntry(userId: string): TimeEntry | null {
    return this.entries.find(e => e.userId === userId && !e.endTime) || null;
  }
}

export const timeTrackingService = new TimeTrackingService();