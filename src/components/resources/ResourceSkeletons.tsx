import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Resource Management Loading Skeletons
 * 
 * Professional loading states for the Resource Management module
 * Matches exact layouts of actual components for seamless UX
 */

// Stats Card Skeleton - For KPI metrics
export function ResourceStatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

// Equipment Card Skeleton - Individual equipment item
export function ResourceEquipmentCardSkeleton() {
  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Equipment Icon */}
          <Skeleton className="w-12 h-12 rounded-lg" />
          
          <div className="flex-1 space-y-3">
            {/* Name and Status Badge */}
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            
            {/* Type and Category */}
            <Skeleton className="h-4 w-48" />
            
            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>
            
            {/* Assignment Info */}
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

// Equipment List Skeleton - Multiple equipment cards
export function ResourceEquipmentListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <ResourceEquipmentCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Utilization Chart Skeleton - For analytics charts
export function ResourceUtilizationChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart area */}
          <div className="h-80 flex items-end justify-between gap-2">
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton 
                key={i} 
                className="flex-1" 
                style={{ height: `${Math.random() * 60 + 40}%` }}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Category Breakdown Skeleton - For pie/donut charts
export function ResourceCategoryBreakdownSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Pie Chart */}
          <Skeleton className="w-48 h-48 rounded-full" />
          
          {/* Legend List */}
          <div className="flex-1 space-y-3 w-full">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Maintenance Timeline Skeleton
export function ResourceMaintenanceTimelineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-52 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="w-2 h-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Status Distribution Skeleton - For status overview
export function ResourceStatusDistributionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-44 mb-2" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Resource Table Skeleton - For tabular data
export function ResourceTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted p-4 border-b">
        <div className="grid grid-cols-6 gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="p-4">
            <div className="grid grid-cols-6 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Filter Panel Skeleton
export function ResourceFilterPanelSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Filters */}
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Full Dashboard Skeleton
export function ResourceDashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ResourceStatsCardSkeleton />
        <ResourceStatsCardSkeleton />
        <ResourceStatsCardSkeleton />
        <ResourceStatsCardSkeleton />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <ResourceFilterPanelSkeleton />
      </div>

      {/* Content */}
      <ResourceEquipmentListSkeleton count={3} />
    </div>
  );
}

// Analytics Dashboard Skeleton
export function ResourceAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ResourceStatsCardSkeleton />
        <ResourceStatsCardSkeleton />
        <ResourceStatsCardSkeleton />
        <ResourceStatsCardSkeleton />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceUtilizationChartSkeleton />
        <ResourceCategoryBreakdownSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceStatusDistributionSkeleton />
        <ResourceMaintenanceTimelineSkeleton />
      </div>
    </div>
  );
}

// Equipment Availability Calendar Skeleton
export function ResourceAvailabilityCalendarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        {/* Calendar Header */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <Skeleton className="h-4 w-full" />
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>

        {/* Calendar Rows */}
        {Array.from({ length: 4 }, (_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-8 gap-2 mb-2">
            <Skeleton className="h-12 w-full" />
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
