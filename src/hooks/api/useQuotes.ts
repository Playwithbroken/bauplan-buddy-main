import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi, type CreateQuoteInput, type UpdateQuoteInput } from '@/services/api/quotes.api';
import { toast } from '../use-toast';

export type QuoteListFilters = {
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
 * Query Keys for quotes
 */
export const quoteKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteKeys.all, 'list'] as const,
  list: (filters?: QuoteListFilters) => [...quoteKeys.lists(), filters] as const,
  details: () => [...quoteKeys.all, 'detail'] as const,
  detail: (id: string) => [...quoteKeys.details(), id] as const,
};

/**
 * Get all quotes
 */
export function useQuotes(params?: QuoteListFilters) {
  return useQuery({
    queryKey: quoteKeys.list(params),
    queryFn: () => quotesApi.getAll(params),
  });
}

/**
 * Get quote by ID
 */
export function useQuote(id: string) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: () => quotesApi.getById(id),
    enabled: Boolean(id),
  });
}

/**
 * Create quote mutation
 */
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuoteInput) => quotesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      toast({
        title: 'Angebot erstellt',
        description: 'Das Angebot wurde erfolgreich erstellt.',
      });
    },
    onError: (error: unknown) => {
      showErrorToast(error, 'Angebot konnte nicht erstellt werden.');
    },
  });
}

/**
 * Update quote mutation
 */
export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuoteInput }) =>
      quotesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(variables.id) });
      toast({
        title: 'Angebot aktualisiert',
        description: 'Die Änderungen wurden gespeichert.',
      });
    },
    onError: (error: unknown) => {
      showErrorToast(error, 'Angebot konnte nicht aktualisiert werden.');
    },
  });
}

/**
 * Delete quote mutation
 */
export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      toast({
        title: 'Angebot gelöscht',
        description: 'Das Angebot wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: unknown) => {
      showErrorToast(error, 'Angebot konnte nicht gelöscht werden.');
    },
  });
}

/**
 * Convert quote to project
 */
export function useConvertQuoteToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quotesApi.convertToProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Projekt erstellt',
        description: 'Das Angebot wurde erfolgreich in ein Projekt umgewandelt.',
      });
    },
    onError: (error: unknown) => {
      showErrorToast(error, 'Das Angebot konnte nicht in ein Projekt umgewandelt werden.');
    },
  });
}

/**
 * Send quote to customer
 */
export function useSendQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      quotesApi.send(id, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      toast({
        title: 'Angebot versendet',
        description: 'Das Angebot wurde per E-Mail verschickt.',
      });
    },
    onError: (error: unknown) => {
      showErrorToast(error, 'Das Angebot konnte nicht versendet werden.');
    },
  });
}
