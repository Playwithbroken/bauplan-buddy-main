/**
 * Real-time Activity Feed
 * Shows live updates across the system
 */

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WebSocketEventType } from '@/services/websocketService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FileText,
  FolderOpen,
  DollarSign,
  Calendar,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'project' | 'quote' | 'invoice' | 'appointment' | 'document';
  action: 'created' | 'updated' | 'deleted' | 'completed';
  title: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { subscribe } = useWebSocket({
    userId: 'current-user',
    tenantId: 'current-tenant',
    autoConnect: false,
  });

  useEffect(() => {
    // Subscribe to all activity events
    const events: WebSocketEventType[] = [
      'project_updated',
      'quote_created',
      'invoice_paid',
      'appointment_created',
      'appointment_updated',
      'document_updated',
    ];

    const unsubscribers = events.map(event =>
      subscribe(event, message => {
        const activity: Activity = {
          id: Date.now().toString(),
          type: event.split('_')[0] as Activity['type'],
          action: event.split('_')[1] as Activity['action'],
          title: message.data.title || 'Aktivität',
          description: message.data.description || '',
          userId: message.data.userId || 'system',
          userName: message.data.userName || 'System',
          timestamp: new Date(message.timestamp),
        };

        setActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe]);

  const getIcon = (type: Activity['type'], action: Activity['action']) => {
    if (action === 'created') return <Plus className="h-4 w-4" />;
    if (action === 'updated') return <Edit className="h-4 w-4" />;
    if (action === 'deleted') return <Trash2 className="h-4 w-4" />;
    if (action === 'completed') return <CheckCircle className="h-4 w-4" />;

    switch (type) {
      case 'project':
        return <FolderOpen className="h-4 w-4" />;
      case 'quote':
        return <FileText className="h-4 w-4" />;
      case 'invoice':
        return <DollarSign className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: Activity['action']) => {
    switch (action) {
      case 'created':
        return 'text-green-600 bg-green-50';
      case 'updated':
        return 'text-blue-600 bg-blue-50';
      case 'deleted':
        return 'text-red-600 bg-red-50';
      case 'completed':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionText = (action: Activity['action']) => {
    switch (action) {
      case 'created':
        return 'Erstellt';
      case 'updated':
        return 'Aktualisiert';
      case 'deleted':
        return 'Gelöscht';
      case 'completed':
        return 'Abgeschlossen';
      default:
        return action;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live-Aktivitäten</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {activities.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Noch keine Aktivitäten
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map(activity => (
                <div
                  key={activity.id}
                  className="flex gap-3 pb-3 border-b last:border-0"
                >
                  <div
                    className={`mt-1 p-2 rounded-full ${getActionColor(
                      activity.action
                    )}`}
                  >
                    {getIcon(activity.type, activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getActionText(activity.action)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {activity.userName
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {activity.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                          locale: de,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
