import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { logger } from "./logger";

/**
 * Enterprise-grade React Query configuration
 * Optimized for construction management workflows with:
 * - Smart caching for frequently accessed data
 * - Automatic retry with exponential backoff
 * - Global error handling
 * - Offline support awareness
 */

// Retry configuration with exponential backoff
const retryDelay = (attemptIndex: number) => 
  Math.min(1000 * 2 ** attemptIndex, 30000);

// Create the query client with enterprise configuration
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      logger.error("Query failed", {
        queryKey: query.queryKey,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Don't show toast for background refetches
      if (query.state.data !== undefined) {
        // Data was previously loaded, this is a background refresh failure
        logger.warn("Background refresh failed, using cached data", {
          queryKey: query.queryKey,
        });
      }
    },
    onSuccess: (data, query) => {
      logger.debug("Query succeeded", {
        queryKey: query.queryKey,
        dataSize: JSON.stringify(data).length,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      logger.error("Mutation failed", {
        mutationKey: mutation.options.mutationKey,
        error: error instanceof Error ? error.message : String(error),
      });
    },
    onSuccess: (data, variables, context, mutation) => {
      logger.info("Mutation succeeded", {
        mutationKey: mutation.options.mutationKey,
      });
    },
  }),
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      
      // Retry failed requests 3 times
      retry: 3,
      retryDelay,
      
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect for offline support
      refetchOnReconnect: true,
      
      // Network mode for offline-first
      networkMode: "offlineFirst",
      
      // Structural sharing for performance
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
      
      // Network mode for offline support
      networkMode: "offlineFirst",
    },
  },
});

// Query key factories for consistent cache management
export const queryKeys = {
  // Projects
  projects: {
    all: ["projects"] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.projects.all, "list", filters] as const,
    detail: (id: string) => 
      [...queryKeys.projects.all, "detail", id] as const,
  },
  
  // Quotes
  quotes: {
    all: ["quotes"] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.quotes.all, "list", filters] as const,
    detail: (id: string) => 
      [...queryKeys.quotes.all, "detail", id] as const,
  },
  
  // Invoices
  invoices: {
    all: ["invoices"] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.invoices.all, "list", filters] as const,
    detail: (id: string) => 
      [...queryKeys.invoices.all, "detail", id] as const,
  },
  
  // Customers
  customers: {
    all: ["customers"] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.customers.all, "list", filters] as const,
    detail: (id: string) => 
      [...queryKeys.customers.all, "detail", id] as const,
  },
  
  // Suppliers
  suppliers: {
    all: ["suppliers"] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.suppliers.all, "list", filters] as const,
    detail: (id: string) => 
      [...queryKeys.suppliers.all, "detail", id] as const,
  },
  
  // Procurement
  procurement: {
    all: ["procurement"] as const,
    inventory: (filters?: Record<string, unknown>) => 
      [...queryKeys.procurement.all, "inventory", filters] as const,
    purchaseOrders: (filters?: Record<string, unknown>) => 
      [...queryKeys.procurement.all, "purchaseOrders", filters] as const,
    budgets: (projectId?: string) => 
      [...queryKeys.procurement.all, "budgets", projectId] as const,
  },
  
  // Teams
  teams: {
    all: ["teams"] as const,
    members: (teamId?: string) => 
      [...queryKeys.teams.all, "members", teamId] as const,
    skills: () => 
      [...queryKeys.teams.all, "skills"] as const,
  },
  
  // Calendar
  calendar: {
    all: ["calendar"] as const,
    appointments: (range: { start: Date; end: Date }) => 
      [...queryKeys.calendar.all, "appointments", range] as const,
  },
  
  // User
  user: {
    current: ["user", "current"] as const,
    preferences: ["user", "preferences"] as const,
    notifications: ["user", "notifications"] as const,
  },
} as const;

// Invalidation helpers
export const invalidateQueries = {
  projects: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
  quotes: () => queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all }),
  invoices: () => queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }),
  customers: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
  suppliers: () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
  procurement: () => queryClient.invalidateQueries({ queryKey: queryKeys.procurement.all }),
  teams: () => queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
  calendar: () => queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all }),
  all: () => queryClient.invalidateQueries(),
};

export default queryClient;
