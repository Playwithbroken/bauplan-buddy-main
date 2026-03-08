import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AppointmentService, StoredAppointment } from '../services/appointmentService';
import { AppointmentAPI, AppointmentFilters } from '../services/appointmentAPI';
import { AppointmentFormData } from '../components/AppointmentDialog';
import { offlineSync, SyncStatus } from '../services/offlineSyncService';
import { ConflictDetectionService } from '../services/conflictDetectionService';
import { getEnvVar } from '@/utils/env';

const USE_API_CONFLICTS = (getEnvVar('VITE_USE_API', 'false')) === 'true';

export const appointmentQueryKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentQueryKeys.all, 'list'] as const,
  list: (filters?: AppointmentFilters) => [...appointmentQueryKeys.lists(), filters] as const,
  details: () => [...appointmentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentQueryKeys.details(), id] as const,
  byProject: (projectId: string) => [...appointmentQueryKeys.all, 'project', projectId] as const,
};

/**
 * Hook for fetching all appointments with optional filtering
 */
export function useAppointments(filters?: AppointmentFilters) {
  const queryClient = useQueryClient();
  const filtersKey = filters ? JSON.stringify(filters) : 'all';

  useEffect(() => {
    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
    };

    window.addEventListener('syncCompleted', handleSync);
    return () => window.removeEventListener('syncCompleted', handleSync);
  }, [queryClient]);

  return useQuery({
    queryKey: appointmentQueryKeys.list(filters),
    queryFn: () => AppointmentService.getAllAppointments(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for creating appointments
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentData: AppointmentFormData) => 
      AppointmentService.saveAppointment(appointmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
    },
  });
}

/**
 * Hook for updating appointments
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppointmentFormData> }) => 
      AppointmentService.updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
    },
  });
}

/**
 * Hook for deleting appointments
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => AppointmentService.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
    },
  });
}

/**
 * Hook for conflict checking
 */
export function useConflictCheck() {
  return useMutation({
    mutationFn: async (conflictData: {
      date: string;
      startTime: string;
      endTime: string;
      teamMembers: string[];
      equipment: string[];
      excludeAppointmentId?: string;
    }) => {
      if (!USE_API_CONFLICTS || !navigator.onLine) {
        const appointments = await AppointmentService.getAllAppointments();
        return ConflictDetectionService.detectConflicts(conflictData, appointments as any, {
          excludeAppointmentId: conflictData.excludeAppointmentId,
          bufferMinutes: 15,
          checkTeamMembers: true,
          checkEquipment: true,
        });
      }

      try {
        return await AppointmentAPI.checkConflicts(conflictData);
      } catch (error) {
        console.warn('API conflict check failed, using local detection:', error);
        const appointments = await AppointmentService.getAllAppointments();
        return ConflictDetectionService.detectConflicts(conflictData, appointments as any, {
          excludeAppointmentId: conflictData.excludeAppointmentId,
          bufferMinutes: 15,
          checkTeamMembers: true,
          checkEquipment: true,
        });
      }
    },
  });
}

/**
 * Hook for sync status and manual sync
 */
export function useAppointmentSync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const updateStatus = async () => {
      const currentStatus = await offlineSync.getStatus();
      setStatus(currentStatus);
    };

    updateStatus();
    
    const handleSync = () => {
      updateStatus();
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
    };

    window.addEventListener('syncCompleted', handleSync);
    window.addEventListener('syncStarted', updateStatus);
    window.addEventListener('syncConflict', updateStatus);
    
    const interval = setInterval(updateStatus, 10000);

    return () => {
      window.removeEventListener('syncCompleted', handleSync);
      window.removeEventListener('syncStarted', updateStatus);
      window.removeEventListener('syncConflict', handleSync);
      clearInterval(interval);
    };
  }, [queryClient]);

  const syncMutation = useMutation({
    mutationFn: () => offlineSync.syncNow(),
  });

  return {
    syncStatus: status,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending || status?.isSyncing,
    syncError: syncMutation.error,
  };
}

/**
 * Hook for offline capability management
 */
export function useOfflineAppointments() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}

/**
 * Advanced sync hook for detailed status and control
 */
export function useAdvancedSync() {
  const queryClient = useQueryClient();

  const syncStatusQuery = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => offlineSync.getStatus(),
    refetchInterval: 5000,
  });

  const conflictQuery = useQuery({
    queryKey: ['sync-conflicts'],
    queryFn: async () => {
      const conflicts = await offlineSync.getStatus().then(s => s.pendingActions); // This is not quite right, should be from db
      // Actually let's use the db directly if we can, but offlineSync already has getStatus
      // Let's use getStatus and maybe enhance it if needed.
      // For now, let's assume we want all conflicts from db.
      const { db } = await import('../services/localDatabaseService');
      return db.conflicts.toArray();
    },
    refetchInterval: 5000,
  });

  const syncMutation = useMutation({
    mutationFn: () => offlineSync.syncNow(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
  });

  const currentStatus = syncStatusQuery.data || {
    isOnline: navigator.onLine,
    isSyncing: false,
    queueLength: 0,
    lastSync: null,
    pendingConflicts: 0,
    pendingActions: []
  };

  const mappedConflicts = (conflictQuery.data || []).map(c => ({
    type: 'update_conflict' as const, // Default for now
    timestamp: new Date(c.timestamp).toISOString(),
    appointmentId: c.id,
    conflictFields: Object.keys(c.localVersion || {}),
    resolution: c.resolved ? { strategy: 'manual' as const } : undefined
  }));

  return {
    backgroundSync: () => syncMutation.mutate(),
    isBackgroundSyncing: syncMutation.isPending,
    performFullSync: () => syncMutation.mutate(),
    isFullSyncing: syncMutation.isPending,
    conflictLog: mappedConflicts,
    syncStatus: {
      pendingChanges: currentStatus.queueLength,
      lastSyncTime: currentStatus.lastSync || undefined,
      errors: [],
      syncInProgress: currentStatus.isSyncing
    },
    needsSync: currentStatus.queueLength > 0
  };
}
