import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  BellRing, 
  Settings, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Info,
  Trash2
} from "lucide-react";
import { NotificationService, Notification } from "@/services/notificationService";
import NotificationSettingsDialog from "@/components/NotificationSettingsDialog";
import NotificationsView from "@/components/NotificationsView";

interface NotificationBellProps {
  className?: string;
}

const NotificationBell = ({ className = "" }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFullView, setShowFullView] = useState(false);

  useEffect(() => {
    // Load initial notifications
    loadNotifications();

    // Listen for new appointment reminders
    const handleReminder = (event: CustomEvent) => {
      loadNotifications();
    };

    window.addEventListener('appointment-reminder', handleReminder as EventListener);

    // Set up periodic refresh
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds

    return () => {
      window.removeEventListener('appointment-reminder', handleReminder as EventListener);
      clearInterval(interval);
    };
  }, []);

  const loadNotifications = () => {
    const allNotifications = NotificationService.getAllNotifications();
    setNotifications(allNotifications);
    setUnreadCount(NotificationService.getUnreadCount());
  };

  const handleMarkAsRead = (notificationId: string) => {
    NotificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    NotificationService.markAllAsRead();
    loadNotifications();
  };

  const handleDeleteNotification = (notificationId: string) => {
    NotificationService.deleteNotification(notificationId);
    loadNotifications();
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'reminder':
        return <Clock className={`h-4 w-4 ${priority === 'critical' ? 'text-red-500' : 'text-blue-500'}`} />;
      case 'upcoming':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800';
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMinutes = Math.round((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Jetzt';
    if (diffMinutes < 60) return `vor ${diffMinutes} Min`;
    if (diffMinutes < 1440) return `vor ${Math.round(diffMinutes / 60)} Std`;
    return `vor ${Math.round(diffMinutes / 1440)} Tagen`;
  };

  const recentNotifications = notifications.slice(0, 10);
  const hasUnread = unreadCount > 0;

  return (
    <>
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative ${className}`}
          aria-label={`Benachrichtigungen${hasUnread ? ` (${unreadCount} ungelesen)` : ''}`}
        >
          {hasUnread ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {hasUnread && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Benachrichtigungen</span>
                {hasUnread && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} neu
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {hasUnread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Alle lesen
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {recentNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Keine Benachrichtigungen</p>
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-1 p-3">
                  {recentNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div 
                        className={`relative border-l-4 p-3 rounded-r-lg transition-all cursor-pointer hover:shadow-sm ${
                          getPriorityColor(notification.priority)
                        } ${!notification.read ? 'ring-1 ring-blue-200 dark:ring-blue-800' : 'opacity-75'}`}
                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            {getNotificationIcon(notification.type, notification.priority)}
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-medium mb-1 ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                {notification.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {index < recentNotifications.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {notifications.length > 10 && (
              <div className="border-t p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm"
                  onClick={() => {
                    setIsOpen(false);
                    setShowFullView(true);
                  }}
                >
                  Alle Benachrichtigungen anzeigen ({notifications.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
    
    {/* Settings Dialog */}
    <NotificationSettingsDialog 
      isOpen={showSettings}
      onClose={() => setShowSettings(false)}
    />
    
    {/* Full Notifications View */}
    <NotificationsView 
      isOpen={showFullView}
      onClose={() => setShowFullView(false)}
    />
    </>
  );
};

export default NotificationBell;