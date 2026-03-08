import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, MultiWindowDialog, DialogDescription } from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import {
  Bell,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  Info,
  Check,
  CheckCheck,
  Trash2,
  X,
  Archive,
  RefreshCw
} from 'lucide-react';
import { NotificationService, Notification } from '@/services/notificationService';
import { format, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface NotificationsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'unread' | 'read' | 'starred' | 'archived';
type NotificationType = 'all' | 'reminder' | 'upcoming' | 'overdue' | 'system';
type SortOrder = 'newest' | 'oldest' | 'priority';

interface NotificationFilters {
  type: FilterType;
  notificationType: NotificationType;
  priority: string;
  dateRange: string;
  searchQuery: string;
  sortOrder: SortOrder;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({
    type: 'all',
    notificationType: 'all',
    priority: 'all',
    dateRange: 'all',
    searchQuery: '',
    sortOrder: 'newest'
  });

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const allNotifications = await NotificationService.getAllNotifications();
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter and sort notifications
  useEffect(() => {
    let filtered = [...notifications];

    // Apply type filter
    if (filters.type !== 'all') {
      switch (filters.type) {
        case 'unread':
          filtered = filtered.filter(n => !n.read);
          break;
        case 'read':
          filtered = filtered.filter(n => n.read);
          break;
        case 'starred':
          filtered = filtered.filter(n => n.starred);
          break;
        case 'archived':
          filtered = filtered.filter(n => n.archived);
          break;
      }
    }

    // Apply notification type filter
    if (filters.notificationType !== 'all') {
      filtered = filtered.filter(n => n.type === filters.notificationType);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(n => isToday(new Date(n.timestamp)));
          break;
        case 'yesterday':
          filtered = filtered.filter(n => isYesterday(new Date(n.timestamp)));
          break;
        case 'thisWeek': {
          const weekStart = startOfWeek(now, { locale: de });
          const weekEnd = endOfWeek(now, { locale: de });
          filtered = filtered.filter(n => {
            const date = new Date(n.timestamp);
            return date >= weekStart && date <= weekEnd;
          });
          break;
        }
        case 'thisMonth': {
          const monthStart = startOfMonth(now);
          const monthEnd = endOfMonth(now);
          filtered = filtered.filter(n => {
            const date = new Date(n.timestamp);
            return date >= monthStart && date <= monthEnd;
          });
          break;
        }
      }
    }

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (filters.sortOrder) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case 'priority': {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => {
          const aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          return bValue - aValue;
        });
        break;
      }
    }

    setFilteredNotifications(filtered);
  }, [notifications, filters]);

  // Load notifications on mount
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [loadNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [loadNotifications]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [loadNotifications]);

  const toggleNotificationSelection = useCallback((notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  }, []);

  const selectAllNotifications = useCallback(() => {
    setSelectedNotifications(
      selectedNotifications.length === filteredNotifications.length
        ? []
        : filteredNotifications.map(n => n.id)
    );
  }, [selectedNotifications.length, filteredNotifications]);

  const handleBulkAction = useCallback(async (action: 'markRead' | 'archive' | 'delete') => {
    try {
      for (const id of selectedNotifications) {
        switch (action) {
          case 'markRead':
            await NotificationService.markAsRead(id);
            break;
          case 'archive':
            await NotificationService.archiveNotification(id);
            break;
          case 'delete':
            await NotificationService.deleteNotification(id);
            break;
        }
      }
      setSelectedNotifications([]);
      loadNotifications();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  }, [selectedNotifications, loadNotifications]);

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'reminder':
        return <Clock className="h-4 w-4 text-blue-500" />;
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
      case 'critical':
        return 'border-red-500';
      case 'high':
        return 'border-orange-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  };

  const formatNotificationDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Heute ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Gestern ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd.MM.yyyy HH:mm', { locale: de });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <MultiWindowDialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogFrame
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Benachrichtigungen</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadNotifications}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        }
        width="fit-content"
        minWidth={900}
        maxWidth={1600}
        resizable={true}
      >
        <DialogDescription>
          Verwalten Sie alle Ihre Benachrichtigungen an einem Ort
        </DialogDescription>

        <div className="flex flex-col h-full">
          {/* Filters */}
          <div className="px-6 py-4 border-b space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Benachrichtigungen durchsuchen..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={filters.type}
                onValueChange={(value: FilterType) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="unread">Ungelesen</SelectItem>
                  <SelectItem value="read">Gelesen</SelectItem>
                  <SelectItem value="starred">Markiert</SelectItem>
                  <SelectItem value="archived">Archiviert</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.notificationType}
                onValueChange={(value: NotificationType) => setFilters(prev => ({ ...prev, notificationType: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="reminder">Erinnerungen</SelectItem>
                  <SelectItem value="upcoming">Bevorstehend</SelectItem>
                  <SelectItem value="overdue">Überfällig</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.sortOrder}
                onValueChange={(value: SortOrder) => setFilters(prev => ({ ...prev, sortOrder: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sortierung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Neueste</SelectItem>
                  <SelectItem value="oldest">Älteste</SelectItem>
                  <SelectItem value="priority">Priorität</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedNotifications.length} Benachrichtigung(en) ausgewählt
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('markRead')}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Als gelesen markieren
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('archive')}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archivieren
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Löschen
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Benachrichtigungen werden geladen...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg font-medium mb-2">Keine Benachrichtigungen gefunden</p>
                  <p className="text-gray-400 text-sm">
                    {filters.searchQuery || filters.type !== 'all' 
                      ? 'Versuchen Sie, Ihre Filter zu ändern oder den Suchbegriff anzupassen.'
                      : 'Sie haben keine Benachrichtigungen.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Select All Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                        onChange={selectAllNotifications}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">
                        {filteredNotifications.length} Benachrichtigung(en)
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                      >
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Alle als gelesen markieren
                      </Button>
                    )}
                  </div>

                  {/* Notification Items */}
                  {filteredNotifications.map((notification) => (
                    <Card key={notification.id} className={`transition-all ${
                      selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-500' : ''
                    }`}>
                      <CardContent className={`p-0 border-l-4 ${getPriorityColor(notification.priority)}`}>
                        <div className="p-4">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.includes(notification.id)}
                              onChange={() => toggleNotificationSelection(notification.id)}
                              className="mt-1 rounded border-gray-300"
                            />
                            {getNotificationIcon(notification.type, notification.priority)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className={`text-sm font-medium mb-1 ${
                                    !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                                  }`}>
                                    {notification.title}
                                    {!notification.read && (
                                      <span className="ml-2 inline-block h-2 w-2 bg-blue-500 rounded-full" />
                                    )}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {formatNotificationDate(notification.timestamp)}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="text-xs">
                                        {notification.priority}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {notification.type}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-4">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export default NotificationsView;