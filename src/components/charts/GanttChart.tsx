import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface GanttTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  assignee?: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold' | 'delayed';
  dependencies?: string[];
  color?: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
  title?: string;
  description?: string;
  showLegend?: boolean;
}

export function GanttChart({ 
  tasks, 
  title = 'Gantt Chart',
  description = 'Projekt-Zeitplanung und Meilensteine',
  showLegend = true 
}: GanttChartProps) {
  const { timelineData, minDate, maxDate, totalDays } = useMemo(() => {
    if (!tasks.length) {
      return { timelineData: [], minDate: new Date(), maxDate: new Date(), totalDays: 0 };
    }

    const dates = tasks.flatMap(task => [
      new Date(task.startDate),
      new Date(task.endDate)
    ]);

    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    const days = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));

    const data = tasks.map(task => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const offset = Math.ceil((start.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...task,
        duration,
        offset,
        offsetPercent: (offset / days) * 100,
        widthPercent: (duration / days) * 100
      };
    });

    return { timelineData: data, minDate: min, maxDate: max, totalDays: days };
  }, [tasks]);

  const getStatusColor = (status: GanttTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'planning': return 'bg-purple-500';
      case 'on-hold': return 'bg-yellow-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: GanttTask['status']) => {
    const variants: Record<GanttTask['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'completed': 'default',
      'active': 'default',
      'planning': 'secondary',
      'on-hold': 'outline',
      'delayed': 'destructive'
    };
    return variants[status] || 'secondary';
  };

  const getStatusText = (status: GanttTask['status']) => {
    const texts = {
      'completed': 'Abgeschlossen',
      'active': 'Aktiv',
      'planning': 'Planung',
      'on-hold': 'Pausiert',
      'delayed': 'Verzögert'
    };
    return texts[status];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const generateMonthMarkers = () => {
    const markers: Array<{ label: string; position: number }> = [];
    const current = new Date(minDate);
    current.setDate(1); // Start of month

    while (current <= maxDate) {
      const offset = Math.ceil((current.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      const position = (offset / totalDays) * 100;

      markers.push({
        label: new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit' }).format(current),
        position
      });

      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  };

  if (!tasks.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Aufgaben verfügbar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthMarkers = generateMonthMarkers();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {formatDate(minDate)} - {formatDate(maxDate)}
            </span>
            <Button variant="outline" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Legend */}
        {showLegend && (
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Abgeschlossen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Aktiv</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-muted-foreground">Planung</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-muted-foreground">Pausiert</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">Verzögert</span>
            </div>
          </div>
        )}

        {/* Timeline Header */}
        <div className="relative">
          <div className="flex items-center h-8 border-b border-border">
            <div className="w-48 flex-shrink-0" />
            <div className="flex-1 relative">
              {monthMarkers.map((marker, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 h-full"
                  style={{ left: `${marker.position}%` }}
                >
                  <div className="border-l border-border h-full" />
                  <span className="text-xs text-muted-foreground ml-1">{marker.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt Bars */}
        <div className="space-y-3">
          {timelineData.map((task) => (
            <div key={task.id} className="group">
              <div className="flex items-center gap-4">
                {/* Task Info */}
                <div className="w-48 flex-shrink-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{task.name}</span>
                    <Badge variant={getStatusBadge(task.status)} className="text-xs">
                      {task.progress}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.assignee && (
                      <>
                        <Users className="h-3 w-3" />
                        <span className="truncate">{task.assignee}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Timeline Bar */}
                <div className="flex-1 relative h-10">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {monthMarkers.map((marker, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 h-full border-l border-dashed border-border/30"
                        style={{ left: `${marker.position}%` }}
                      />
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md transition-all group-hover:shadow-lg"
                    style={{
                      left: `${task.offsetPercent}%`,
                      width: `${task.widthPercent}%`
                    }}
                  >
                    {/* Background */}
                    <div className={`h-full rounded-md opacity-20 ${getStatusColor(task.status)}`} />
                    
                    {/* Progress Fill */}
                    <div
                      className={`absolute top-0 left-0 h-full rounded-md ${getStatusColor(task.status)} transition-all`}
                      style={{ width: `${task.progress}%` }}
                    />

                    {/* Label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow-md px-2 truncate">
                        {task.duration} {task.duration === 1 ? 'Tag' : 'Tage'}
                      </span>
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute top-full left-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-popover text-popover-foreground p-3 rounded-md shadow-lg border border-border text-xs space-y-1 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(new Date(task.startDate))} - {formatDate(new Date(task.endDate))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{task.duration} Tage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-3 w-3" />
                        <span>{task.progress}% abgeschlossen</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold">{tasks.length}</div>
            <div className="text-xs text-muted-foreground">Aufgaben</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div>
            <div className="text-xs text-muted-foreground">Abgeschlossen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'active').length}</div>
            <div className="text-xs text-muted-foreground">Aktiv</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalDays}</div>
            <div className="text-xs text-muted-foreground">Tage</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
