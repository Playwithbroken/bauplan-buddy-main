import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  category: 'vehicle' | 'tool' | 'machinery' | 'safety';
  status: 'available' | 'in-use' | 'maintenance' | 'broken';
  location: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  assignedTo?: string;
  currentProject?: string;
  projectId?: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceInterval?: number;
  insurancePolicy?: string;
  insuranceExpiry?: string;
  notes?: string;
  gpsLocation?: { lat: number; lng: number };
}

class ResourceService {
  private inventory: Equipment[] = [];

  constructor() {
    this.loadFromStorage();
    if (this.inventory.length === 0) {
      this.initDefaultInventory();
    }
    // Try to sync with Supabase in background
    this.refresh();
  }

  private loadFromStorage() {
    const saved = localStorage.getItem('bauplan_inventory_v2');
    if (saved) {
      try {
        this.inventory = JSON.parse(saved).map((e: any) => ({
          ...e,
          lastMaintenanceDate: e.lastMaintenanceDate ? new Date(e.lastMaintenanceDate) : undefined,
          nextMaintenanceDate: e.nextMaintenanceDate ? new Date(e.nextMaintenanceDate) : undefined,
          purchaseDate: e.purchaseDate ? new Date(e.purchaseDate) : undefined
        }));
      } catch (err) {
        console.error('Failed to parse inventory', err);
        this.inventory = [];
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem('bauplan_inventory_v2', JSON.stringify(this.inventory));
  }

  async refresh() {
    const tenant = supabase.getCurrentTenant();
    if (!tenant) return;

    try {
      const client = supabase.getClient();
      const { data, error } = await client
        .from('equipment')
        .select('*')
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      if (data && data.length > 0) {
        this.inventory = data.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          category: item.category as any,
          status: item.status as any,
          location: item.location,
          serialNumber: item.serial_number,
          purchaseDate: item.purchase_date ? new Date(item.purchase_date) : undefined,
          purchasePrice: item.purchase_price,
          currentValue: item.current_value,
          lastMaintenanceDate: item.last_maintenance_date ? new Date(item.last_maintenance_date) : undefined,
          nextMaintenanceDate: item.next_maintenance_date ? new Date(item.next_maintenance_date) : undefined,
          maintenanceInterval: item.maintenance_interval_days,
          projectId: item.project_id,
          gpsLocation: item.gps_location,
        }));
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('ResourceService: Could not sync with Supabase', e);
    }
  }

  private initDefaultInventory() {
    this.inventory = [
      {
        id: 'EQU-001',
        name: 'Baukran LIEBHERR 130 EC-B',
        type: 'Turmdrehkran',
        serialNumber: 'SN-77221',
        category: 'machinery',
        status: 'in-use',
        location: 'Baustelle München',
        projectId: 'PRJ-2024-001',
        nextMaintenanceDate: new Date('2024-07-15')
      },
      {
        id: 'EQU-002',
        name: 'Mercedes Sprinter',
        type: 'Lieferwagen',
        serialNumber: 'SN-44312',
        category: 'vehicle',
        status: 'available',
        location: 'Firmengelände',
        nextMaintenanceDate: new Date('2024-08-01')
      }
    ];
    this.saveToStorage();
  }

  listEquipment(): Equipment[] {
    return this.inventory;
  }

  getEquipment(id: string): Equipment | undefined {
    return this.inventory.find(e => e.id === id);
  }

  async addEquipment(data: Omit<Equipment, 'id'>): Promise<Equipment> {
    const tenant = supabase.getCurrentTenant();
    const id = `EQU-${Math.floor(Math.random() * 900) + 100}`;
    const newEq: Equipment = { ...data, id };

    if (tenant) {
      try {
        const { error } = await supabase.getClient()
          .from('equipment')
          .insert({
            id,
            tenant_id: tenant.id,
            name: data.name,
            type: data.type,
            category: data.category,
            status: data.status,
            location: data.location,
            serial_number: data.serialNumber,
            purchase_date: data.purchaseDate?.toISOString().split('T')[0],
            purchase_price: data.purchasePrice,
            current_value: data.currentValue,
            last_maintenance_date: data.lastMaintenanceDate?.toISOString().split('T')[0],
            next_maintenance_date: data.nextMaintenanceDate?.toISOString().split('T')[0],
            maintenance_interval_days: data.maintenanceInterval || 30,
            project_id: data.projectId,
            gps_location: data.gpsLocation
          });
        if (error) throw error;
      } catch (e) {
        console.error('Error adding equipment to Supabase:', e);
      }
    }

    this.inventory.push(newEq);
    this.saveToStorage();
    return newEq;
  }

  async updateEquipment(id: string, updates: Partial<Equipment>) {
    const index = this.inventory.findIndex(e => e.id === id);
    if (index !== -1) {
      this.inventory[index] = { ...this.inventory[index], ...updates };
      
      const tenant = supabase.getCurrentTenant();
      if (tenant) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.location !== undefined) dbUpdates.location = updates.location;
        if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber;
        if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
        if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue;
        if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
        if (updates.gpsLocation !== undefined) dbUpdates.gps_location = updates.gpsLocation;
        
        if (updates.purchaseDate instanceof Date) {
          dbUpdates.purchase_date = updates.purchaseDate.toISOString().split('T')[0];
        }
        if (updates.nextMaintenanceDate instanceof Date) {
          dbUpdates.next_maintenance_date = updates.nextMaintenanceDate.toISOString().split('T')[0];
        }
        if (updates.lastMaintenanceDate instanceof Date) {
          dbUpdates.last_maintenance_date = updates.lastMaintenanceDate.toISOString().split('T')[0];
        }

        await supabase.getClient()
          .from('equipment')
          .update(dbUpdates)
          .eq('id', id)
          .eq('tenant_id', tenant.id);
      }
      
      this.saveToStorage();
    }
  }

  async updateStatus(id: string, status: Equipment['status'], location?: string) {
    const eq = this.inventory.find(e => e.id === id);
    if (eq) {
      eq.status = status;
      if (location) eq.location = location;
      
      const tenant = supabase.getCurrentTenant();
      if (tenant) {
        await supabase.getClient()
          .from('equipment')
          .update({ status, location })
          .eq('id', id)
          .eq('tenant_id', tenant.id);
      }
      
      this.saveToStorage();
    }
  }

  async scheduleMaintenance(id: string, date: Date) {
    const eq = this.inventory.find(e => e.id === id);
    if (eq) {
      eq.nextMaintenanceDate = date;
      
      const tenant = supabase.getCurrentTenant();
      if (tenant) {
        await supabase.getClient()
          .from('equipment')
          .update({ next_maintenance_date: date.toISOString().split('T')[0] })
          .eq('id', id)
          .eq('tenant_id', tenant.id);
      }
      
      this.saveToStorage();
    }
  }

  getUpcomingMaintenance(days: number = 30): Equipment[] {
    const now = new Date();
    const limit = new Date();
    limit.setDate(now.getDate() + days);

    return this.inventory.filter(eq => {
      if (!eq.nextMaintenanceDate) return false;
      const maintenanceDate = new Date(eq.nextMaintenanceDate);
      return maintenanceDate <= limit && eq.status !== 'broken';
    });
  }
}

export const resourceService = new ResourceService();
