import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, Clock, Users, AlertCircle, CheckCircle,
  Plus, Settings, RefreshCw, Trash2, ExternalLink,
  Chrome, Video, Mail, MapPin, CalendarDays,
  RefreshCw, Zap, Globe
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CalendarIntegrationService, {
  CalendarEvent,
  CalendarProvider,
  CalendarConflict
} from '@/services/calendarIntegrationService';

interface CalendarIntegrationProps {
  className?: string;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ className }) => {
  const { toast } = useToast();
  const [calendarService] = useState(() => CalendarIntegrationService);
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [conflicts, setConflicts] = useState<CalendarConflict[]>([]);
  const [stats, setStats] = useState({ totalEvents: 0, upcomingEvents: 0, conflictsCount: 0, providersCount: 0 });
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    eventType: 'meeting' as const,
    priority: 'normal' as const
  });

  const loadData = React.useCallback(() => {
    setProviders(calendarService.getProviders());
    setEvents(calendarService.getEvents());
    setConflicts(calendarService.getConflicts());
    setStats(calendarService.getCalendarStats());
  }, [calendarService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAuthenticateProvider = async (type: 'google' | 'outlook') => {
    try {
      const success = await calendarService.authenticateProvider(type);
      if (success) {
        toast({
          title: "Authentication Started",
          description: `Please complete the authentication in the popup window for ${type}.`,
        });
        
        // Reload data after a delay to show the new provider
        setTimeout(() => {
          loadData();
          toast({
            title: "Provider Added",
            description: `${type} calendar has been connected successfully.`,
          });
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: `Failed to authenticate with ${type}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleSyncProvider = async (providerId: string) => {
    setIsSyncing(true);
    try {
      const success = await calendarService.syncProvider(providerId);
      if (success) {
        loadData();
        toast({
          title: "Sync Complete",
          description: "Calendar data has been synchronized successfully.",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: "Failed to synchronize calendar data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "An error occurred during synchronization.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const event = calendarService.createEvent({
      title: newEvent.title,
      description: newEvent.description,
      startTime: new Date(newEvent.startTime),
      endTime: new Date(newEvent.endTime),
      location: newEvent.location,
      eventType: newEvent.eventType,
      priority: newEvent.priority,
      attendees: [{
        email: 'current@user.com',
        name: 'Current User',
        role: 'organizer',
        status: 'accepted'
      }],
      organizer: {
        email: 'current@user.com',
        name: 'Current User',
        role: 'organizer',
        status: 'accepted'
      }
    });

    loadData();
    setIsAddingEvent(false);
    setNewEvent({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      eventType: 'meeting',
      priority: 'normal'
    });

    toast({
      title: "Event Created",
      description: `"${event.title}" has been added to your calendar.`,
    });
  };

  const handleResolveConflict = (conflictId: string) => {
    const resolved = calendarService.resolveConflict(conflictId);
    if (resolved) {
      loadData();
      toast({
        title: "Conflict Resolved",
        description: "The calendar conflict has been marked as resolved.",
      });
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google':
        return <Chrome className="h-4 w-4" />;
      case 'outlook':
        return <Mail className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'appointment':
        return <Clock className="h-4 w-4" />;
      case 'deadline':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      low: 'secondary',
      normal: 'outline',
      high: 'default',
      urgent: 'destructive'
    };
    return variants[priority] || 'outline';
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar Integration</h2>
          <p className="text-muted-foreground">
            Connect external calendars and manage your schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add a new event to your calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Event location"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select
                      value={newEvent.eventType}
                      onValueChange={(value: typeof newEvent.eventType) =>
                        setNewEvent(prev => ({ ...prev, eventType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newEvent.priority}
                      onValueChange={(value: typeof newEvent.priority) =>
                        setNewEvent(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingEvent(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent}>
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Events</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Upcoming</span>
            </div>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Conflicts</span>
            </div>
            <div className="text-2xl font-bold">{stats.conflictsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Providers</span>
            </div>
            <div className="text-2xl font-bold">{stats.providersCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {/* Add New Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Connect Calendar Providers</CardTitle>
              <CardDescription>
                Connect your external calendar accounts to sync events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleAuthenticateProvider('google')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Chrome className="h-4 w-4" />
                  Connect Google Calendar
                </Button>
                <Button
                  onClick={() => handleAuthenticateProvider('outlook')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Connect Outlook Calendar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connected Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Providers</CardTitle>
              <CardDescription>
                Manage your connected calendar accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {providers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No calendar providers connected. Connect a provider to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getProviderIcon(provider.type)}
                        <div>
                          <h3 className="font-medium">{provider.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {provider.accountEmail}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last sync: {provider.lastSync.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={provider.authenticated ? 'default' : 'destructive'}
                        >
                          {provider.authenticated ? 'Connected' : 'Disconnected'}
                        </Badge>
                        <Button
                          onClick={() => handleSyncProvider(provider.id)}
                          variant="outline"
                          size="sm"
                          disabled={isSyncing}
                        >
                          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          onClick={() => setSelectedProvider(provider)}
                          variant="outline"
                          size="sm"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Events from all connected calendars
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No events found. Create an event or sync your calendars.
                </p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 10).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {getEventTypeIcon(event.eventType)}
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}</span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityBadge(event.priority)}>
                          {event.priority}
                        </Badge>
                        <Badge variant="outline">
                          {event.source}
                        </Badge>
                        <Badge
                          variant={event.syncStatus === 'synced' ? 'default' : 'secondary'}
                        >
                          {event.syncStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Conflicts</CardTitle>
              <CardDescription>
                Resolve scheduling conflicts and overlapping events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conflicts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No conflicts detected. Your calendar is well organized!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conflicts.map((conflict) => (
                    <div
                      key={conflict.id}
                      className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800 dark:text-yellow-200">
                            {conflict.type.toUpperCase()} CONFLICT
                          </span>
                        </div>
                        <Button
                          onClick={() => handleResolveConflict(conflict.id)}
                          variant="outline"
                          size="sm"
                        >
                          Mark Resolved
                        </Button>
                      </div>
                      <p className="text-sm">{conflict.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarIntegration;
