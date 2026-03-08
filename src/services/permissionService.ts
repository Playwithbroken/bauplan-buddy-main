export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: 'system' | 'project' | 'financial' | 'document' | 'calendar' | 'user' | 'report';
  isSystemPermission: boolean;
  parentPermissionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  isDefault: boolean;
  inheritsFrom?: string[];
  restrictions?: RoleRestriction[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface RoleRestriction {
  type: 'time' | 'ip' | 'location' | 'resource' | 'data';
  condition: string;
  value: unknown;
  description: string;
}

export interface UserPermissionOverride {
  userId: string;
  grantedPermissions: string[];
  revokedPermissions: string[];
  expiresAt?: string;
  reason: string;
  grantedBy: string;
  grantedAt: string;
}

export interface PermissionContext {
  userId: string;
  projectId?: string;
  customerId?: string;
  documentId?: string;
  resourceOwnerId?: string;
  ipAddress?: string;
  timestamp: string;
}

export class PermissionService {
  private static readonly PERMISSIONS_KEY = 'bauplan-buddy-permissions';
  private static readonly ROLES_KEY = 'bauplan-buddy-roles';
  private static readonly USER_OVERRIDES_KEY = 'bauplan-buddy-user-overrides';

  /**
   * Initialize default permissions and roles
   */
  static initialize(): void {
    if (!this.getStoredPermissions().length) {
      this.createDefaultPermissions();
    }
    if (!this.getStoredRoles().length) {
      this.createDefaultRoles();
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(
    userId: string,
    permissionId: string,
    context: Partial<PermissionContext> = {}
  ): boolean {
    try {
      const user = this.getCurrentUser();
      if (!user || user.id !== userId) return false;

      // Get user's effective permissions
      const effectivePermissions = this.getUserEffectivePermissions(userId);
      
      // Check if permission exists in effective permissions
      if (!effectivePermissions.includes(permissionId) && !effectivePermissions.includes('*')) {
        return false;
      }

      // Check role restrictions
      return this.checkRoleRestrictions(userId, permissionId, context);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Check multiple permissions (AND logic)
   */
  static hasAllPermissions(
    userId: string,
    permissionIds: string[],
    context: Partial<PermissionContext> = {}
  ): boolean {
    return permissionIds.every(permissionId => 
      this.hasPermission(userId, permissionId, context)
    );
  }

  /**
   * Check multiple permissions (OR logic)
   */
  static hasAnyPermission(
    userId: string,
    permissionIds: string[],
    context: Partial<PermissionContext> = {}
  ): boolean {
    return permissionIds.some(permissionId => 
      this.hasPermission(userId, permissionId, context)
    );
  }

  /**
   * Get user's effective permissions (role + overrides)
   */
  static getUserEffectivePermissions(userId: string): string[] {
    const user = this.getCurrentUser();
    if (!user || user.id !== userId) return [];

    // Start with role permissions
    const rolePermissions = user.permissions || [];
    
    // Apply user-specific overrides
    const overrides = this.getUserPermissionOverrides(userId);
    const now = new Date().toISOString();
    
    let effectivePermissions = [...rolePermissions];

    overrides.forEach(override => {
      // Check if override is still valid
      if (override.expiresAt && override.expiresAt < now) {
        return;
      }

      // Add granted permissions
      override.grantedPermissions.forEach(permission => {
        if (!effectivePermissions.includes(permission)) {
          effectivePermissions.push(permission);
        }
      });

      // Remove revoked permissions
      override.revokedPermissions.forEach(permission => {
        effectivePermissions = effectivePermissions.filter(p => p !== permission);
      });
    });

    return effectivePermissions;
  }

  /**
   * Grant permission to user temporarily
   */
  static grantUserPermission(
    userId: string,
    permissionId: string,
    expiresAt?: string,
    reason: string = 'Manual grant',
    grantedBy: string = 'system'
  ): void {
    const overrides = this.getUserPermissionOverrides(userId);
    
    // Find existing override or create new one
    let override = overrides.find(o => o.userId === userId);
    if (!override) {
      override = {
        userId,
        grantedPermissions: [],
        revokedPermissions: [],
        reason,
        grantedBy,
        grantedAt: new Date().toISOString(),
        expiresAt
      };
      overrides.push(override);
    }

    // Add permission if not already granted
    if (!override.grantedPermissions.includes(permissionId)) {
      override.grantedPermissions.push(permissionId);
    }

    // Remove from revoked if present
    override.revokedPermissions = override.revokedPermissions.filter(p => p !== permissionId);

    this.saveUserOverrides(overrides);
  }

  /**
   * Revoke permission from user
   */
  static revokeUserPermission(
    userId: string,
    permissionId: string,
    reason: string = 'Manual revoke',
    revokedBy: string = 'system'
  ): void {
    const overrides = this.getUserPermissionOverrides(userId);
    
    let override = overrides.find(o => o.userId === userId);
    if (!override) {
      override = {
        userId,
        grantedPermissions: [],
        revokedPermissions: [],
        reason,
        grantedBy: revokedBy,
        grantedAt: new Date().toISOString()
      };
      overrides.push(override);
    }

    // Add to revoked permissions
    if (!override.revokedPermissions.includes(permissionId)) {
      override.revokedPermissions.push(permissionId);
    }

    // Remove from granted if present
    override.grantedPermissions = override.grantedPermissions.filter(p => p !== permissionId);

    this.saveUserOverrides(overrides);
  }

  /**
   * Create new role
   */
  static createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Role {
    const role: Role = {
      id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...roleData
    };

    const roles = this.getStoredRoles();
    roles.push(role);
    this.saveRoles(roles);

    return role;
  }

  /**
   * Update existing role
   */
  static updateRole(roleId: string, updates: Partial<Role>): Role | null {
    const roles = this.getStoredRoles();
    const roleIndex = roles.findIndex(r => r.id === roleId);
    
    if (roleIndex === -1) return null;

    const updatedRole = {
      ...roles[roleIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    roles[roleIndex] = updatedRole;
    this.saveRoles(roles);

    return updatedRole;
  }

  /**
   * Delete role
   */
  static deleteRole(roleId: string): boolean {
    const roles = this.getStoredRoles();
    const role = roles.find(r => r.id === roleId);
    
    if (!role || role.isSystemRole) {
      return false; // Cannot delete system roles
    }

    const filteredRoles = roles.filter(r => r.id !== roleId);
    this.saveRoles(filteredRoles);
    
    return true;
  }

  /**
   * Get all permissions
   */
  static getAllPermissions(): Permission[] {
    return this.getStoredPermissions();
  }

  /**
   * Get permissions by category
   */
  static getPermissionsByCategory(category: Permission['category']): Permission[] {
    return this.getStoredPermissions().filter(p => p.category === category);
  }

  /**
   * Get all roles
   */
  static getAllRoles(): Role[] {
    return this.getStoredRoles();
  }

  /**
   * Get role by ID
   */
  static getRoleById(roleId: string): Role | null {
    return this.getStoredRoles().find(r => r.id === roleId) || null;
  }

  /**
   * Check resource ownership
   */
  static isResourceOwner(userId: string, resourceType: string, resourceId: string): boolean {
    // This would typically check against a database
    // For now, implement basic ownership logic
    switch (resourceType) {
      case 'project':
        return this.isProjectManager(userId, resourceId);
      case 'document':
        return this.isDocumentOwner(userId, resourceId);
      default:
        return false;
    }
  }

  /**
   * Generate permission report for user
   */
  static generateUserPermissionReport(userId: string): {
    user: CurrentUser | null;
    effectivePermissions: string[];
    rolePermissions: string[];
    grantedOverrides: string[];
    revokedOverrides: string[];
    restrictions: RoleRestriction[];
  } {
    const user = this.getCurrentUser();
    const effectivePermissions = this.getUserEffectivePermissions(userId);
    const overrides = this.getUserPermissionOverrides(userId);
    
    const userOverride = overrides.find(o => o.userId === userId);
    
    return {
      user,
      effectivePermissions,
      rolePermissions: user?.permissions || [],
      grantedOverrides: userOverride?.grantedPermissions || [],
      revokedOverrides: userOverride?.revokedPermissions || [],
      restrictions: [] // Would get from user's role
    };
  }

  // Private helper methods

  private static checkRoleRestrictions(
    userId: string,
    permissionId: string,
    context: Partial<PermissionContext>
  ): boolean {
    // Implementation would check time-based, IP-based, and other restrictions
    // For now, return true (no restrictions)
    return true;
  }

  private static isProjectManager(userId: string, projectId: string): boolean {
    // Would check if user is assigned as project manager
    return false;
  }

  private static isDocumentOwner(userId: string, documentId: string): boolean {
    // Would check if user uploaded/owns the document
    return false;
  }

  private static getCurrentUser(): CurrentUser | null {
    try {
      const userData = localStorage.getItem('bauplan-buddy-user');
      return userData ? (JSON.parse(userData) as CurrentUser) : null;
    } catch {
      return null;
    }
  }

  private static getUserPermissionOverrides(userId: string): UserPermissionOverride[] {
    try {
      const data = localStorage.getItem(this.USER_OVERRIDES_KEY);
      const allOverrides = data ? JSON.parse(data) : [];
      return allOverrides.filter((override: UserPermissionOverride) => override.userId === userId);
    } catch {
      return [];
    }
  }

  private static saveUserOverrides(overrides: UserPermissionOverride[]): void {
    try {
      localStorage.setItem(this.USER_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch (error) {
      console.error('Failed to save user overrides:', error);
    }
  }

  private static getStoredPermissions(): Permission[] {
    try {
      const data = localStorage.getItem(this.PERMISSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static getStoredRoles(): Role[] {
    try {
      const data = localStorage.getItem(this.ROLES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static savePermissions(permissions: Permission[]): void {
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));
  }

  private static saveRoles(roles: Role[]): void {
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
  }

  private static createDefaultPermissions(): void {
    const permissions: Permission[] = [
      // System permissions
      { id: '*', name: 'All Permissions', description: 'Complete system access', resource: '*', action: '*', category: 'system', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Project permissions
      { id: 'projects.read', name: 'View Projects', description: 'View project information', resource: 'project', action: 'read', category: 'project', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'projects.write', name: 'Manage Projects', description: 'Create and edit projects', resource: 'project', action: 'write', category: 'project', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'projects.delete', name: 'Delete Projects', description: 'Delete projects', resource: 'project', action: 'delete', category: 'project', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Financial permissions
      { id: 'invoices.read', name: 'View Invoices', description: 'View invoice information', resource: 'invoice', action: 'read', category: 'financial', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'invoices.write', name: 'Manage Invoices', description: 'Create and edit invoices', resource: 'invoice', action: 'write', category: 'financial', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'invoices.approve', name: 'Approve Invoices', description: 'Approve invoice payments', resource: 'invoice', action: 'approve', category: 'financial', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Calendar permissions
      { id: 'calendar.read', name: 'View Calendar', description: 'View calendar and appointments', resource: 'calendar', action: 'read', category: 'calendar', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'calendar.write', name: 'Manage Calendar', description: 'Create and edit appointments', resource: 'calendar', action: 'write', category: 'calendar', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Customer permissions
      { id: 'customers.read', name: 'View Customers', description: 'View customer information', resource: 'customer', action: 'read', category: 'user', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'customers.write', name: 'Manage Customers', description: 'Create and edit customers', resource: 'customer', action: 'write', category: 'user', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Document permissions
      { id: 'documents.read', name: 'View Documents', description: 'View documents', resource: 'document', action: 'read', category: 'document', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'documents.write', name: 'Manage Documents', description: 'Upload and edit documents', resource: 'document', action: 'write', category: 'document', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'documents.delete', name: 'Delete Documents', description: 'Delete documents', resource: 'document', action: 'delete', category: 'document', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Report permissions
      { id: 'reports.read', name: 'View Reports', description: 'View system reports', resource: 'report', action: 'read', category: 'report', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'reports.export', name: 'Export Reports', description: 'Export report data', resource: 'report', action: 'export', category: 'report', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // User management permissions
      { id: 'users.read', name: 'View Users', description: 'View user accounts', resource: 'user', action: 'read', category: 'user', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'users.write', name: 'Manage Users', description: 'Create and edit user accounts', resource: 'user', action: 'write', category: 'user', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'users.permissions', name: 'Manage Permissions', description: 'Grant and revoke user permissions', resource: 'user', action: 'permissions', category: 'system', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Team permissions
      { id: 'teams.read', name: 'View Team', description: 'View team members and skills', resource: 'team', action: 'read', category: 'user', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'teams.write', name: 'Manage Team', description: 'Edit team member details', resource: 'team', action: 'write', category: 'user', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'teams.salaries', name: 'View Salaries', description: 'View sensitive salary info', resource: 'team', action: 'salaries', category: 'financial', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      
      // Equipment permissions
      { id: 'equipment.read', name: 'View Equipment', description: 'View equipment inventory', resource: 'equipment', action: 'read', category: 'report', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'equipment.write', name: 'Manage Equipment', description: 'Add or edit equipment', resource: 'equipment', action: 'write', category: 'report', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'equipment.maintenance', name: 'Manage Maintenance', description: 'Schedule and track maintenance', resource: 'equipment', action: 'maintenance', category: 'report', isSystemPermission: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];

    this.savePermissions(permissions);
  }

  private static createDefaultRoles(): void {
    const roles: Role[] = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: ['*'],
        isSystemRole: true,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: 'manager',
        name: 'Project Manager',
        description: 'Manage projects, calendar, and view financial data',
        permissions: [
          'projects.read', 'projects.write',
          'calendar.read', 'calendar.write',
          'invoices.read',
          'customers.read', 'customers.write',
          'documents.read', 'documents.write',
          'reports.read'
        ],
        isSystemRole: true,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: 'worker',
        name: 'Construction Worker',
        description: 'Access to projects and calendar, limited document access',
        permissions: [
          'projects.read',
          'calendar.read', 'calendar.write',
          'documents.read'
        ],
        isSystemRole: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: 'client',
        name: 'Client',
        description: 'Limited access to own projects and documents',
        permissions: [
          'projects.read',
          'documents.read'
        ],
        isSystemRole: true,
        isDefault: false,
        restrictions: [
          {
            type: 'resource',
            condition: 'own_projects_only',
            value: true,
            description: 'Can only access own projects'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];

    this.saveRoles(roles);
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  PermissionService.initialize();
}

export default PermissionService;
export const permissionService = PermissionService;

interface CurrentUser {
  id: string;
  permissions?: string[];
  roles?: string[];
}
