import Dexie, { Table } from 'dexie';

export interface Project {
  id: string;
  name: string;
  location?: string;
  status: 'active' | 'completed' | 'on-hold' | 'planning' | 'cancelled' | 'archived';
  progress?: number;
  budget?: number;
  spent?: number;
  invoicedAmount?: number;
  builtAmount?: number;
  team?: number;
  phase?: string;
  startDate?: string;
  endDate?: string;
  customer?: string;
  customerId?: string;
  description?: string;
  address?: string;
  teamMembers?: any[];
  milestones?: any[];
  tasks?: any[];
  risks?: any[];
  updatedAt: string;
  [key: string]: any;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  projectId: string;
  type: string;
  updatedAt: string;
  [key: string]: any;
}

export interface SyncItem {
  id?: number;
  moduleId: string; // The ID of the item being synced
  module: string; // 'projects', 'invoices', etc.
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export interface Draft {
  key: string;
  data: any;
  updatedAt: number;
}

export interface SyncConflict {
  id: string;
  module: string;
  localVersion: any;
  serverVersion: any;
  timestamp: number;
  resolved: boolean;
}

export interface AuditLog {
  id?: number;
  action: string;
  module: string;
  moduleId: string;
  userId: string;
  timestamp: string;
  details: any;
}

export class LocalDatabase extends Dexie {
  projects!: Table<Project>;
  appointments!: Table<Appointment>;
  quotes!: Table<any>;
  invoices!: Table<any>;
  deliveryNotes!: Table<any>;
  orderConfirmations!: Table<any>;
  syncQueue!: Table<SyncItem>;
  drafts!: Table<Draft>;
  conflicts!: Table<SyncConflict>;
  auditLog!: Table<AuditLog>;

  constructor() {
    super('BauplanBuddyDB');
    this.version(3).stores({
      projects: 'id, name, status, updatedAt',
      appointments: 'id, title, date, projectId, updatedAt',
      quotes: 'id, date, status',
      invoices: 'id, date, status',
      deliveryNotes: 'id, date',
      orderConfirmations: 'id, date',
      syncQueue: '++id, moduleId, module, action, timestamp',
      drafts: 'key, updatedAt',
      conflicts: 'id, module, resolved, timestamp',
      auditLog: '++id, module, moduleId, action, timestamp'
    });
  }
}

export const db = new LocalDatabase();
