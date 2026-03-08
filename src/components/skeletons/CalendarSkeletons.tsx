import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for Calendar Event
 */
export function CalendarEventSkeleton() {
  return (
    <div className="p-2 rounded border border-border">
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

/**
 * Skeleton for Calendar Day Cell
 */
export function CalendarDaySkeleton() {
  return (
    <div className="min-h-[120px] border border-border p-2 space-y-1">
      <Skeleton className="h-4 w-8 mb-2" />
      <CalendarEventSkeleton />
      <CalendarEventSkeleton />
    </div>
  );
}

/**
 * Full Calendar Page Skeleton
 */
export function CalendarPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <div className="grid grid-cols-7 gap-2">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <Skeleton key={day} className="h-6 w-full" />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <CalendarDaySkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events Sidebar */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
