import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, FolderOpen, Euro, Users, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'quote' | 'project' | 'invoice' | 'customer';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'success' | 'pending' | 'warning';
}

interface RecentActivityFeedProps {
  activities: Activity[];
  title?: string;
  description?: string;
}

const activityIcons = {
  quote: FileText,
  project: FolderOpen,
  invoice: Euro,
  customer: Users,
};

const statusIcons = {
  success: CheckCircle,
  pending: Clock,
  warning: Clock,
};

const statusColors = {
  success: 'text-green-600 bg-green-50',
  pending: 'text-orange-600 bg-orange-50',
  warning: 'text-red-600 bg-red-50',
};

export function RecentActivityFeed({ 
  activities,
  title = 'Letzte Aktivitäten',
  description = 'Übersicht der jüngsten Änderungen'
}: RecentActivityFeedProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `vor ${minutes} Min.`;
    if (hours < 24) return `vor ${hours} Std.`;
    return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type];
              const StatusIcon = activity.status ? statusIcons[activity.status] : null;
              
              return (
                <div 
                  key={activity.id} 
                  className={cn(
                    'flex gap-3 pb-4',
                    index !== activities.length - 1 && 'border-b border-border'
                  )}
                >
                  <div className="mt-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      {StatusIcon && activity.status && (
                        <div className={cn(
                          'rounded-full p-1',
                          statusColors[activity.status]
                        )}>
                          <StatusIcon className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
