import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface UserPermissions {
  modules: Record<string, boolean>;
  financials: Record<string, boolean>;
  team: Record<string, boolean>;
  settings: Record<string, boolean>;
  actions: Record<string, boolean>;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: UserPermissions;
  isActive: boolean;
  phone: string;
  department: string;
  availability: 'available' | 'busy' | 'vacation' | 'sick';
  workingHours: { start: string; end: string };
  currentProject?: string;
  startDate?: string;
  location?: string;
  notes?: string;
  hourlyRate: number;
  skills: Array<{ name: string; level: string }>;
  lastLoginAt: string | null;
  createdAt: string;
}

class TeamService {
  private static instance: TeamService;

  static getInstance(): TeamService {
    if (!TeamService.instance) {
      TeamService.instance = new TeamService();
    }
    return TeamService.instance;
  }

  async listMembers(): Promise<TeamMember[]> {
    const client = supabase.getClient();
    const tenant = supabase.getCurrentTenant();
    if (!tenant) return [];

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
      return [];
    }

    return data.map(u => this.mapDbUserToMember(u));
  }

  async updateMember(id: string, updates: Partial<TeamMember>): Promise<boolean> {
    const client = supabase.getClient();
    const dbUpdates: any = {};

    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.availability !== undefined) dbUpdates.availability = updates.availability;
    if (updates.workingHours !== undefined) dbUpdates.working_hours = updates.workingHours;
    if (updates.currentProject !== undefined) dbUpdates.current_project = updates.currentProject;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.skills !== undefined) dbUpdates.skills = updates.skills;

    const { error } = await client
      .from('users')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating team member:', error);
      return false;
    }

    return true;
  }

  async deleteMember(id: string): Promise<boolean> {
    const client = supabase.getClient();
    const { error } = await client
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting team member:', error);
      return false;
    }

    return true;
  }

  async inviteMember(email: string, name: string, role: string): Promise<boolean> {
    const client = supabase.getClient();
    const tenant = supabase.getCurrentTenant();
    if (!tenant) return false;

    // In a real app, this would use supabase.auth.admin.inviteUserByEmail
    // For now, we'll just create the profile if the user doesn't exist, 
    // or assume the invitation flow is handled by a cloud function.
    
    // Check if user limit reached
    const members = await this.listMembers();
    if (members.length >= tenant.maxUsers) {
      throw new Error(`User-Limit erreicht (${tenant.maxUsers}). Bitte upgraden Sie Ihr Abo.`);
    }

    const { error } = await client.from('users').insert({
      tenant_id: tenant.id,
      email,
      full_name: name,
      role,
      is_active: true,
      permissions: this.getDefaultPermissions(role),
    });

    if (error) {
      console.error('Error inviting team member:', error);
      return false;
    }

    return true;
  }

  private mapDbUserToMember(u: any): TeamMember {
    return {
      id: u.id,
      email: u.email,
      name: u.full_name || '',
      role: u.role || 'user',
      permissions: u.permissions || this.getDefaultPermissions(u.role),
      isActive: u.is_active,
      phone: u.phone || '',
      department: u.department || '',
      availability: u.availability || 'available',
      workingHours: u.working_hours || { start: '08:00', end: '17:00' },
      currentProject: u.current_project,
      startDate: u.start_date,
      location: u.location,
      notes: u.notes,
      hourlyRate: u.hourly_rate || 0,
      skills: u.skills || [],
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
    };
  }

  private getDefaultPermissions(role: string): UserPermissions {
    const isFull = role === 'admin' || role === 'owner';
    return {
      modules: {
        quotes: true,
        projects: true,
        invoices: true,
        deliveryNotes: true,
        orderConfirmations: true,
        appointments: true,
      },
      financials: {
        viewRevenue: isFull,
        viewProfit: isFull,
        viewCosts: isFull,
        viewSalaries: isFull,
        editPrices: isFull,
        approveInvoices: isFull,
      },
      team: {
        viewTeam: true,
        inviteUsers: isFull,
        manageRoles: isFull,
        viewSalaries: isFull,
      },
      settings: {
        editCompany: isFull,
        editBranding: isFull,
        manageSubscription: isFull,
        viewBilling: isFull,
      },
      actions: {
        createQuotes: true,
        editQuotes: true,
        deleteQuotes: isFull,
        createProjects: true,
        editProjects: true,
        deleteProjects: isFull,
        exportData: isFull,
      },
    };
  }
}

export const teamService = TeamService.getInstance();
