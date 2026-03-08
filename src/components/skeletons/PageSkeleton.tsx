/**
 * Universal Page Skeleton Loader
 * 
 * Use this component for ANY page that needs loading state
 * Pass different skeleton types based on page content
 */

import { DashboardFullSkeleton } from './DashboardSkeletons';
import { QuotesPageSkeleton } from './QuotesSkeletons';
import { ProjectsPageSkeleton } from './ProjectsSkeletons';
import { InvoicesPageSkeleton } from './InvoicesSkeletons';
import { CalendarPageSkeleton } from './CalendarSkeletons';
import { CustomersPageSkeleton } from './CustomersSkeletons';
import { AnalyticsPageSkeleton } from './AnalyticsSkeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export type PageSkeletonType = 
  | 'dashboard'
  | 'quotes'
  | 'projects'
  | 'invoices'
  | 'calendar'
  | 'customers'
  | 'analytics'
  | 'table'
  | 'grid'
  | 'list'
  | 'form';

interface PageSkeletonProps {
  type?: PageSkeletonType;
}

/**
 * Generic Table Skeleton
 */
export function TablePageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Generic Grid Skeleton
 */
export function GridPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-9" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Generic List Skeleton
 */
export function ListPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="space-y-3">
        {[...Array(12)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Generic Form Skeleton
 */
export function FormPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48 mb-8" />
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Main PageSkeleton Component
 * Auto-selects the right skeleton based on type
 */
export function PageSkeleton({ type = 'table' }: PageSkeletonProps) {
  switch (type) {
    case 'dashboard':
      return <DashboardFullSkeleton />;
    case 'quotes':
      return <QuotesPageSkeleton />;
    case 'projects':
      return <ProjectsPageSkeleton />;
    case 'invoices':
      return <InvoicesPageSkeleton />;
    case 'calendar':
      return <CalendarPageSkeleton />;
    case 'customers':
      return <CustomersPageSkeleton />;
    case 'analytics':
      return <AnalyticsPageSkeleton />;
    case 'table':
      return <TablePageSkeleton />;
    case 'grid':
      return <GridPageSkeleton />;
    case 'list':
      return <ListPageSkeleton />;
    case 'form':
      return <FormPageSkeleton />;
    default:
      return <TablePageSkeleton />;
  }
}

// Export all individual skeletons
export {
  DashboardFullSkeleton,
  QuotesPageSkeleton,
  ProjectsPageSkeleton,
  InvoicesPageSkeleton,
  CalendarPageSkeleton,
  CustomersPageSkeleton,
  AnalyticsPageSkeleton,
};
