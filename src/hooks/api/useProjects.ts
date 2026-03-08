import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, type CreateProjectInput, type UpdateProjectInput } from '@/services/api/projects.api';
import { toast } from '../use-toast';

export type ProjectListFilters = {
  status?: string;
  search?: string;
};

const getErrorMessage = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message?: unknown };
    if (typeof message === 'string') {
      return message;
    }
  }

  return undefined;
};

const showErrorToast = (error: unknown, fallbackMessage: string) => {
  const message = getErrorMessage(error) ?? fallbackMessage;
  toast({
    variant: 'destructive',
    title: 'Fehler',
    description: message,
  });
};

/**
 * Query Keys for projects
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: ProjectListFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: (id: string) => [...projectKeys.detail(id), 'stats'] as const,
};

/**
 * Get all projects
 */
export function useProjects(params?: ProjectListFilters) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectsApi.getAll(params),
  });
}

/**
 * Get project by ID
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.getById(id),
    enabled: Boolean(id),
  });
}

/**
 * Get project statistics
 */
export function useProjectStats(id: string) {
  return useQuery({
    queryKey: projectKeys.stats(id),
    queryFn: () => projectsApi.getStats(id),
    enabled: Boolean(id),
  });
}

/**
 * Create project mutation
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectInput) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast({
        title: 'Projekt erstellt',
        description: 'Das Projekt wurde erfolgreich erstellt.',
      });
    },
    onError: (error: unknown) => {
      showErrorToast(error, 'Projekt konnte nicht erstellt werden.');
    },
  });
}

/**
 * Update project mutation
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      projectsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      toast({
        title: 'Projekt aktualisiert',
        description: 'Die Änderungen wurden gespeichert.',
      });
    },
    onError: (error: unknown) => {
      showErrorToast(error, 'Projekt konnte nicht aktualisiert werden.');
    },
  });
}

/**
 * Delete project mutation
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast({
        title: 'Projekt gelöscht',
        description: 'Das Projekt wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: unknown) => {
      showErrorToast(error, 'Projekt konnte nicht gelöscht werden.');
    },
  });
}
