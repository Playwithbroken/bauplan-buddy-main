// Unified API Services Export
// This file provides a centralized access point for all API services

import { AppointmentApiService, appointmentApiService } from './appointmentApiService';
import { UserApiService, userApiService } from './userApiService';
import { DocumentApiService, documentApiService } from './documentApiService';
import { ProjectService } from '../projectService';
import { QuoteService } from '../quoteService';
import { InvoiceService } from '../invoiceService';

export { AppointmentApiService, appointmentApiService } from './appointmentApiService';
export { ProjectService } from '../projectService';
export { QuoteService } from '../quoteService';
export { InvoiceService } from '../invoiceService';
export { UserApiService, userApiService } from './userApiService';
export { DocumentApiService, documentApiService } from './documentApiService';

export { startQuoteConversion, getQuoteConversionJob, getProjectById } from './quoteWorkflowApi';
export type { QuoteConversionJob, QuoteConversionRequest, QuoteConversionStatus, ProjectSummary } from './quoteWorkflowApi';
export { createDeliveryNote, updateDeliveryNoteStatus, getProjectDeliveryNotes } from './deliveryWorkflowApi';
export type {
  DeliveryNoteStatus,
  DeliveryNoteItemInput,
  CreateDeliveryNoteRequest,
  DeliveryNoteItemRecord,
  DeliveryNoteRecord
} from './deliveryWorkflowApi';
export {
  createProjectInvoice,
  getProjectInvoices,
  getInvoiceSuggestions
} from './invoiceWorkflowApi';
export type {
  CreateInvoiceRequest,
  InvoiceRecord,
  InvoiceLineItemRequest,
  InvoiceLineItemRecord,
  InvoiceStatus,
  InvoiceSuggestions
} from './invoiceWorkflowApi';

// Re-export types for convenience
export type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentFilter
} from './appointmentApiService';

export type {
  Project,
  CreateProjectInput as CreateProjectRequest,
  UpdateProjectInput as UpdateProjectRequest,
} from './projects.api';

export type {
  CreateUserRequest,
  UpdateUserRequest,
  UserFilter,
  UserStats,
  ChangePasswordRequest
} from './userApiService';

export type {
  Document,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentFilter,
  DocumentStats,
  DocumentVersion
} from './documentApiService';

// Unified API client class that provides access to all services
export class ApiServiceProvider {
  public readonly appointments: AppointmentApiService;
  public readonly projects: typeof ProjectService;
  public readonly users: UserApiService;
  public readonly documents: DocumentApiService;

  constructor() {
    this.appointments = appointmentApiService;
    this.projects = ProjectService;
    this.users = userApiService;
    this.documents = documentApiService;
  }

  // Health check for all services
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: Date;
  }> {
    const results = {
      appointments: false,
      projects: false,
      users: false,
      documents: false
    };

    try {
      await this.appointments.getAppointments({ startDate: new Date(), endDate: new Date() });
      results.appointments = true;
    } catch (error) {
      console.warn('Appointments service health check failed:', error);
    }

    try {
      await this.projects.getAll();
      results.projects = true;
    } catch (error) {
      console.warn('Projects service health check failed:', error);
    }

    try {
      await this.users.getUsers();
      results.users = true;
    } catch (error) {
      console.warn('Users service health check failed:', error);
    }

    try {
      await this.documents.getDocuments();
      results.documents = true;
    } catch (error) {
      console.warn('Documents service health check failed:', error);
    }

    const healthyServices = Object.values(results).filter(Boolean).length;
    const totalServices = Object.keys(results).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services: results,
      timestamp: new Date()
    };
  }

  // Clear all local storage data (useful for testing/reset)
  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem('appointments');
      localStorage.removeItem('projects');
      localStorage.removeItem('users');
      localStorage.removeItem('documents');
      console.log('All local storage data cleared');
    } catch (error) {
      console.error('Failed to clear local storage data:', error);
      throw new Error('Failed to clear data');
    }
  }

  // Get combined statistics from all services
  async getCombinedStats(): Promise<{
    appointments: {
      total: number;
      upcoming: number;
      thisWeek: number;
    };
    projects: {
      total: number;
      active: number;
      completed: number;
    };
    users: {
      total: number;
      active: number;
      byRole: Record<string, number>;
    };
    documents: {
      total: number;
      pendingApproval: number;
      totalSize: number;
    };
  }> {
    try {
      const [allProjects, userStats, documentStats] = await Promise.all([
        this.projects.getAll(),
        this.users.getUserStats(),
        this.documents.getDocumentStats()
      ]);

      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const [allAppointments, upcomingAppointments, thisWeekAppointments] = await Promise.all([
        this.appointments.getAppointments(),
        this.appointments.getAppointments({ startDate: now }),
        this.appointments.getAppointments({ startDate: now, endDate: weekFromNow })
      ]);

      return {
        appointments: {
          total: allAppointments.length,
          upcoming: upcomingAppointments.length,
          thisWeek: thisWeekAppointments.length
        },
        projects: {
          total: allProjects.length,
          active: allProjects.filter(p => p.status === 'active').length,
          completed: allProjects.filter(p => p.status === 'completed').length
        },
        users: {
          total: userStats.total,
          active: userStats.active,
          byRole: userStats.byRole
        },
        documents: {
          total: documentStats.total,
          pendingApproval: documentStats.byStatus.pending || 0,
          totalSize: documentStats.totalSize
        }
      };
    } catch (error) {
      console.error('Failed to get combined stats:', error);
      throw new Error('Failed to get combined statistics');
    }
  }
}

// Export singleton instance
export const apiServiceProvider = new ApiServiceProvider();

// Default export for convenience
export default apiServiceProvider;
