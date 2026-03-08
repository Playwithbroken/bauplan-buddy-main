import { apiClient, configService } from '../databaseService';
import type { User, UserRole } from '@/hooks/useAuth';

// API response types
interface UserApiResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  last_login?: string;
  email_verified: boolean;
  phone?: string;
  address?: string;
  company?: string;
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

interface ApiListResponse<T> {
  data: T[];
}

interface ApiSingleResponse<T> {
  data: T;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
  password: string;
  phone?: string;
  address?: string;
  company?: string;
}

export interface UpdateUserRequest {
  id: string;
  email?: string;
  name?: string;
  role?: UserRole;
  phone?: string;
  address?: string;
  company?: string;
  avatar?: string;
}

export interface UserFilter {
  role?: UserRole;
  company?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface UserStats {
  total: number;
  byRole: Record<UserRole, number>;
  active: number;
  emailVerified: number;
  lastLoginStats: {
    last24h: number;
    last7days: number;
    last30days: number;
  };
}

export interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class UserApiService {
  private useApi: boolean;

  constructor() {
    this.useApi = configService.shouldUseApi();
  }

  async getUsers(filter?: UserFilter): Promise<User[]> {
    if (this.useApi) {
      return this.getUsersFromApi(filter);
    } else {
      return this.getUsersFromLocalStorage(filter);
    }
  }

  async getUser(id: string): Promise<User | null> {
    if (this.useApi) {
      return this.getUserFromApi(id);
    } else {
      return this.getUserFromLocalStorage(id);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (this.useApi) {
      return this.getUserByEmailFromApi(email);
    } else {
      return this.getUserByEmailFromLocalStorage(email);
    }
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    if (this.useApi) {
      return this.createUserInApi(userData);
    } else {
      return this.createUserInLocalStorage(userData);
    }
  }

  async updateUser(userData: UpdateUserRequest): Promise<User> {
    if (this.useApi) {
      return this.updateUserInApi(userData);
    } else {
      return this.updateUserInLocalStorage(userData);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    if (this.useApi) {
      return this.deleteUserFromApi(id);
    } else {
      return this.deleteUserFromLocalStorage(id);
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<boolean> {
    if (this.useApi) {
      return this.changePasswordInApi(request);
    } else {
      return this.changePasswordInLocalStorage(request);
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.getUsers({ role });
  }

  async getActiveUsers(): Promise<User[]> {
    return this.getUsers({ isActive: true });
  }

  async getUserStats(): Promise<UserStats> {
    if (this.useApi) {
      return this.getUserStatsFromApi();
    } else {
      return this.getUserStatsFromLocalStorage();
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    const allUsers = await this.getUsers();
    
    const searchTerm = query.toLowerCase();
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.role.toLowerCase().includes(searchTerm)
    );
  }

  async updateLastLogin(userId: string): Promise<void> {
    if (this.useApi) {
      await this.updateLastLoginInApi(userId);
    } else {
      this.updateLastLoginInLocalStorage(userId);
    }
  }

  // API Implementation Methods
  private async getUsersFromApi(filter?: UserFilter): Promise<User[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter) {
        if (filter.role) queryParams.append('role', filter.role);
        if (filter.company) queryParams.append('company', filter.company);
        if (filter.isActive !== undefined) queryParams.append('is_active', filter.isActive.toString());
        if (filter.emailVerified !== undefined) queryParams.append('email_verified', filter.emailVerified.toString());
      }

      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<ApiListResponse<UserApiResponse>>(url);
      
      return response.data.map(this.mapApiResponseToUser);
    } catch (error) {
      console.error('Failed to fetch users from API:', error);
      throw new Error('Failed to fetch users');
    }
  }

  private async getUserFromApi(id: string): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiSingleResponse<UserApiResponse>>(`/users/${id}`);
      return this.mapApiResponseToUser(response.data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error('Failed to fetch user from API:', error);
      throw new Error('Failed to fetch user');
    }
  }

  private async getUserByEmailFromApi(email: string): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiSingleResponse<UserApiResponse>>(`/users/email/${encodeURIComponent(email)}`);
      return this.mapApiResponseToUser(response.data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error('Failed to fetch user by email from API:', error);
      throw new Error('Failed to fetch user by email');
    }
  }

  private async createUserInApi(userData: CreateUserRequest): Promise<User> {
    try {
      const payload = this.mapCreateRequestToApiPayload(userData);
      const response = await apiClient.post<ApiSingleResponse<UserApiResponse>>('/users', payload);
      return this.mapApiResponseToUser(response.data);
    } catch (error) {
      console.error('Failed to create user in API:', error);
      throw new Error('Failed to create user');
    }
  }

  private async updateUserInApi(userData: UpdateUserRequest): Promise<User> {
    try {
      const { id, ...updateData } = userData;
      const payload = this.mapUpdateRequestToApiPayload(updateData);
      const response = await apiClient.put<ApiSingleResponse<UserApiResponse>>(`/users/${id}`, payload);
      return this.mapApiResponseToUser(response.data);
    } catch (error) {
      console.error('Failed to update user in API:', error);
      throw new Error('Failed to update user');
    }
  }

  private async deleteUserFromApi(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/users/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete user from API:', error);
      throw new Error('Failed to delete user');
    }
  }

  private async changePasswordInApi(request: ChangePasswordRequest): Promise<boolean> {
    try {
      await apiClient.post(`/users/${request.userId}/change-password`, {
        current_password: request.currentPassword,
        new_password: request.newPassword
      });
      return true;
    } catch (error) {
      console.error('Failed to change password in API:', error);
      throw new Error('Failed to change password');
    }
  }

  private async getUserStatsFromApi(): Promise<UserStats> {
    try {
      const response = await apiClient.get<{ data: UserStats }>('/users/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user stats from API:', error);
      // Fallback to calculating from all users
      const users = await this.getUsersFromApi();
      return this.calculateUserStats(users);
    }
  }

  private async updateLastLoginInApi(userId: string): Promise<void> {
    try {
      await apiClient.post(`/users/${userId}/last-login`);
    } catch (error) {
      console.error('Failed to update last login in API:', error);
    }
  }

  // LocalStorage Implementation Methods (fallback)
  private getUsersFromLocalStorage(filter?: UserFilter): User[] {
    try {
      const users = this.getAllUsersFromLocalStorage();
      
      if (!filter) return users;

      return users.filter(user => {
        if (filter.role && user.role !== filter.role) return false;
        if (filter.emailVerified !== undefined && !user.emailVerified === filter.emailVerified) return false;
        // Note: localStorage doesn't have company field in current User interface
        
        return true;
      });
    } catch (error) {
      console.error('Failed to get users from localStorage:', error);
      return [];
    }
  }

  private getUserFromLocalStorage(id: string): User | null {
    const users = this.getAllUsersFromLocalStorage();
    return users.find(user => user.id === id) || null;
  }

  private getUserByEmailFromLocalStorage(email: string): User | null {
    const users = this.getAllUsersFromLocalStorage();
    return users.find(user => user.email === email) || null;
  }

  private createUserInLocalStorage(userData: CreateUserRequest): User {
    const users = this.getAllUsersFromLocalStorage();
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      permissions: this.getPermissionsForRole(userData.role),
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    this.saveUsersToLocalStorage(users);
    
    return newUser;
  }

  private updateUserInLocalStorage(userData: UpdateUserRequest): User {
    const users = this.getAllUsersFromLocalStorage();
    const index = users.findIndex(user => user.id === userData.id);
    
    if (index === -1) {
      throw new Error('User not found');
    }

    const updatedUser: User = {
      ...users[index],
      ...userData,
      permissions: userData.role ? this.getPermissionsForRole(userData.role) : users[index].permissions,
      updatedAt: new Date()
    };

    users[index] = updatedUser;
    this.saveUsersToLocalStorage(users);
    
    return updatedUser;
  }

  private deleteUserFromLocalStorage(id: string): boolean {
    const users = this.getAllUsersFromLocalStorage();
    const filteredUsers = users.filter(user => user.id !== id);
    
    if (filteredUsers.length === users.length) {
      return false; // User not found
    }

    this.saveUsersToLocalStorage(filteredUsers);
    return true;
  }

  private changePasswordInLocalStorage(request: ChangePasswordRequest): boolean {
    // In localStorage implementation, we don't actually store passwords
    // This would be handled by the authentication service
    console.log('Password change request for localStorage user:', request.userId);
    return true;
  }

  private getUserStatsFromLocalStorage(): UserStats {
    const users = this.getAllUsersFromLocalStorage();
    return this.calculateUserStats(users);
  }

  private updateLastLoginInLocalStorage(userId: string): void {
    const users = this.getAllUsersFromLocalStorage();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date();
      users[userIndex].updatedAt = new Date();
      this.saveUsersToLocalStorage(users);
    }
  }

  // Helper Methods
  private getAllUsersFromLocalStorage(): User[] {
    try {
      const stored = localStorage.getItem('users');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading users from localStorage:', error);
      return [];
    }
  }

  private saveUsersToLocalStorage(users: User[]): void {
    try {
      localStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users to localStorage:', error);
      throw new Error('Failed to save users');
    }
  }

  private getPermissionsForRole(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      admin: ['read', 'write', 'delete', 'admin', 'manage_users', 'manage_projects', 'manage_system'],
      manager: ['read', 'write', 'manage_projects', 'view_reports', 'manage_team'],
      user: ['read', 'write', 'create_appointments', 'view_projects'],
      client: ['read', 'view_own_projects', 'view_appointments']
    };

    return permissions[role] || permissions.user;
  }

  private calculateUserStats(users: User[]): UserStats {
    const stats: UserStats = {
      total: users.length,
      byRole: {
        admin: 0,
        manager: 0,
        user: 0,
        client: 0
      },
      active: 0,
      emailVerified: 0,
      lastLoginStats: {
        last24h: 0,
        last7days: 0,
        last30days: 0
      }
    };

    const now = new Date();
    const day24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    users.forEach(user => {
      // Count by role
      stats.byRole[user.role]++;
      
      // Count email verified (assuming all are active in localStorage)
      stats.active++;
      if (user.emailVerified) {
        stats.emailVerified++;
      }
      
      // Count last login stats
      if (user.lastLogin) {
        const lastLogin = new Date(user.lastLogin);
        if (lastLogin > day24Ago) stats.lastLoginStats.last24h++;
        if (lastLogin > days7Ago) stats.lastLoginStats.last7days++;
        if (lastLogin > days30Ago) stats.lastLoginStats.last30days++;
      }
    });

    return stats;
  }

  // Mapping Methods
  private mapApiResponseToUser(apiData: UserApiResponse): User {
    return {
      id: apiData.id,
      email: apiData.email,
      name: apiData.name,
      role: apiData.role,
      avatar: apiData.avatar_url,
      permissions: apiData.permissions || this.getPermissionsForRole(apiData.role),
      lastLogin: apiData.last_login ? new Date(apiData.last_login) : undefined,
      emailVerified: apiData.email_verified || false,
      createdAt: new Date(apiData.created_at),
      updatedAt: new Date(apiData.updated_at)
    };
  }

  private mapCreateRequestToApiPayload(data: CreateUserRequest): Record<string, unknown> {
    return {
      email: data.email,
      name: data.name,
      role: data.role,
      password: data.password,
      phone: data.phone,
      address: data.address,
      company: data.company
    };
  }

  private mapUpdateRequestToApiPayload(data: Omit<UpdateUserRequest, 'id'>): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    
    if (data.email !== undefined) payload.email = data.email;
    if (data.name !== undefined) payload.name = data.name;
    if (data.role !== undefined) payload.role = data.role;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.address !== undefined) payload.address = data.address;
    if (data.company !== undefined) payload.company = data.company;
    if (data.avatar !== undefined) payload.avatar_url = data.avatar;
    
    return payload;
  }
}

// Export singleton instance
export const userApiService = new UserApiService();