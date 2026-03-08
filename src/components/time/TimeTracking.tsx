import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Play, Pause, Square, Clock, Calendar, DollarSign,
  BarChart3, Plus, Settings, Search, Timer,
  Download, RefreshCw, Edit
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
import TimeTrackingService, {
  TimeEntry,
  TimeSession,
  TimeTrackingSettings
} from '@/services/timeTrackingService';

interface TimeTrackingProps {
  className?: string;
}

const TimeTracking: React.FC<TimeTrackingProps> = ({ className }) => {
  const { toast } = useToast();
  const [newEntry, setNewEntry] = useState({
    description: '',
    projectId: '',
    billable: true
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setEntries(timeService.getTimeEntries());
    const activeEntry = timeService.getActiveTimeEntry('current_user');
    setCurrentSession(activeEntry ? {
      id: activeEntry.id,
      userId: activeEntry.userId,
      projectId: activeEntry.projectId,
      startTime: activeEntry.startTime,
      lastActivity: activeEntry.updated,
      isActive: activeEntry.status === 'running',
      pausedTime: 0,
      breaks: [],
      autoSaveInterval: 300000
    } : null);
    setStats(timeService.getTimeTrackingStats());
  };

  const handleStartTimer = () => {
    if (!newEntry.description) {
      toast({
        title: "Description Required",
        description: "Please provide a description for this time entry.",
        variant: "destructive"
      });
      return;
    }

    const entry = timeService.startTimeEntry({
      userId: 'current_user',
      userName: 'Current User',
      userRole: 'developer',
      projectId: newEntry.projectId || 'default_project',
      projectName: 'Default Project',
      activityType: 'development',
      description: newEntry.description,
      billable: newEntry.billable,
      hourlyRate: 50
    });

    if (entry) {
      const session: TimeSession = {
        id: entry.id,
        userId: entry.userId,
        projectId: entry.projectId,
        startTime: entry.startTime,
        lastActivity: entry.startTime,
        isActive: true,
        pausedTime: 0,
        breaks: [],
        autoSaveInterval: 300000
      };
      setCurrentSession(session);
      toast({
        title: "Timer Started",
        description: "Time tracking has begun for this task.",
      });
    }
  };

  const handleStopTimer = () => {
    if (currentSession) {
      const entry = timeService.stopTimeEntry(currentSession.id);
      if (entry) {
        setCurrentSession(null);
        loadData();
        toast({
          title: "Timer Stopped",
          description: `Time entry saved: ${formatDuration(entry.duration)}`,
        });
      }
    }
  };

  const handleCreateManualEntry = () => {
    if (!newEntry.description) {
      toast({
        title: "Validation Error",
        description: "Please provide a description for the time entry.",
        variant: "destructive"
      });
      return;
    }

    const entry = timeService.startTimeEntry({
      userId: 'current_user',
      userName: 'Current User',
      userRole: 'developer',
      projectId: newEntry.projectId || 'default_project',
      projectName: newEntry.projectId || 'Default Project',
      activityType: 'development',
      description: newEntry.description,
      billable: newEntry.billable,
      hourlyRate: 50
    });

    loadData();
    setIsCreatingEntry(false);
    setNewEntry({ description: '', projectId: '', billable: true });

    toast({
      title: "Entry Created",
      description: `Manual time entry added: ${formatDuration(entry.duration)}`,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getCurrentSessionDuration = () => {
    if (!currentSession) return 0;
    const now = new Date();
    const startTime = new Date(currentSession.startTime);
    return Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
  };

  const filteredEntries = entries.filter(entry =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Time Tracking</h2>
          <p className="text-muted-foreground">
            Track time for projects and generate accurate billing records
          </p>
        </div>
        <Dialog open={isCreatingEntry} onOpenChange={setIsCreatingEntry}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Manual Time Entry</DialogTitle>
              <DialogDescription>
                Add a time entry for work already completed
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="manual-description">Description *</Label>
                <Input
                  id="manual-description"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What did you work on?"
                />
              </div>
              <div>
                <Label htmlFor="manual-project">Project</Label>
                <Select
                  value={newEntry.projectId}
                  onValueChange={(value) => setNewEntry(prev => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project1">Project Alpha</SelectItem>
                    <SelectItem value="project2">Project Beta</SelectItem>
                    <SelectItem value="project3">Project Gamma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="manual-billable">Billable</Label>
                <Switch
                  id="manual-billable"
                  checked={newEntry.billable}
                  onCheckedChange={(checked) => setNewEntry(prev => ({ ...prev, billable: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingEntry(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateManualEntry}>
                Create Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Timer */}
      {currentSession && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium">Active Timer</span>
                </div>
                <div className="text-2xl font-mono font-bold">
                  {formatDuration(getCurrentSessionDuration())}
                </div>
              </div>
              <Button onClick={handleStopTimer} variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {entries.find(e => e.id === currentSession.id)?.description || 'Working'}
              {entries.find(e => e.id === currentSession.id)?.projectId && ` • Project: ${entries.find(e => e.id === currentSession.id)?.projectId}`}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Start Timer */}
      {!currentSession && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="What are you working on?"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Select
                value={newEntry.projectId}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project1">Project Alpha</SelectItem>
                  <SelectItem value="project2">Project Beta</SelectItem>
                  <SelectItem value="project3">Project Gamma</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Label htmlFor="quick-billable" className="text-sm">Billable</Label>
                <Switch
                  id="quick-billable"
                  checked={newEntry.billable}
                  onCheckedChange={(checked) => setNewEntry(prev => ({ ...prev, billable: checked }))}
                />
              </div>
              <Button onClick={handleStartTimer}>
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <div className="text-2xl font-bold">{formatDuration(stats.totalHours * 60)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Time</span>
            </div>
            <div className="text-2xl font-bold">{formatDuration(stats.totalHours * 60)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Billable Time</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Total Entries</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button onClick={loadData} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Time Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Time Entries</CardTitle>
              <CardDescription>All recorded time entries</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No time entries found. Start tracking time to see entries here.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredEntries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{entry.description}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(entry.startTime).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {entry.projectId && <span>Project: {entry.projectId}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{formatDuration(entry.duration)}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.billable ? formatCurrency((entry.duration / 60) * 50) : 'Non-billable'}
                          </div>
                        </div>
                        <Badge variant={entry.billable ? 'default' : 'secondary'}>
                          {entry.billable ? 'Billable' : 'Non-billable'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-medium mb-2">Daily Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Time tracking summary for today
                </p>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-medium mb-2">Weekly Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Weekly time summary and analysis
                </p>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-medium mb-2">Monthly Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Monthly billing and revenue report
                </p>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeTracking;


