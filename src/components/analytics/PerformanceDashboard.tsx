import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Activity, Zap, Clock, AlertCircle, CheckCircle, 
  TrendingUp, TrendingDown, Monitor, Gauge, 
  BarChart3, PieChart, Download, RefreshCw,
  Cpu, HardDrive, Network, Globe, Users, FileText
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import PerformanceMonitoringService, {
  PerformanceMetric,
  PerformanceReport,
  CoreWebVitals,
  UserSession
} from '@/services/performanceMonitoringService';

interface PerformanceDashboardProps {
  className?: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ className }) => {
  const { toast } = useToast();
  const [performanceService] = useState(() => PerformanceMonitoringService);
  const [activeTab, setActiveTab] = useState('overview');
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [performanceScore, setPerformanceScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadPerformanceData();
    
    // Set up periodic refresh
    const interval = setInterval(loadPerformanceData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [loadPerformanceData]);

  const loadPerformanceData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      
      const newReport = performanceService.generatePerformanceReport();
      const allMetrics = performanceService.getMetrics();
      const session = performanceService.getCurrentSession();
      const score = performanceService.getPerformanceScore();
      
      setReport(newReport);
      setMetrics(allMetrics.slice(-100)); // Keep last 100 metrics for charts
      setCurrentSession(session);
      setPerformanceScore(score);
      setLastRefresh(new Date());
    } catch (error) {
      toast({
        title: "Performance Data Error",
        description: "Failed to load performance data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [performanceService, toast]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, text: 'Excellent' };
    if (score >= 70) return { variant: 'secondary' as const, text: 'Good' };
    if (score >= 50) return { variant: 'outline' as const, text: 'Needs Improvement' };
    return { variant: 'destructive' as const, text: 'Poor' };
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const exportReport = () => {
    if (!report) return;
    
    const reportData = JSON.stringify(report, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Performance report has been downloaded.",
    });
  };

  if (isLoading && !report) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading performance data...</span>
        </div>
      </div>
    );
  }

  const coreWebVitalsData = report ? [
    { name: 'LCP', value: report.metrics.coreWebVitals.lcp, threshold: 2500, unit: 'ms' },
    { name: 'FID', value: report.metrics.coreWebVitals.fid, threshold: 100, unit: 'ms' },
    { name: 'CLS', value: report.metrics.coreWebVitals.cls, threshold: 0.1, unit: 'score' },
    { name: 'FCP', value: report.metrics.coreWebVitals.fcp, threshold: 1800, unit: 'ms' },
    { name: 'TTFB', value: report.metrics.coreWebVitals.ttfb, threshold: 200, unit: 'ms' }
  ] : [];

  const recentMetricsChart = metrics
    .filter(m => ['load_complete', 'first_contentful_paint', 'largest_contentful_paint'].includes(m.name))
    .slice(-20)
    .map((metric, index) => ({
      time: metric.timestamp.toLocaleTimeString(),
      [metric.name]: metric.value,
      index
    }));

  const errorData = currentSession ? [
    { name: 'JavaScript', value: currentSession.errors.filter(e => e.type === 'javascript').length },
    { name: 'Network', value: currentSession.errors.filter(e => e.type === 'network').length },
    { name: 'Resource', value: currentSession.errors.filter(e => e.type === 'resource').length },
    { name: 'Security', value: currentSession.errors.filter(e => e.type === 'security').length }
  ] : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time application performance monitoring and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            onClick={loadPerformanceData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportReport}
            variant="outline"
            size="sm"
            disabled={!report}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="loading">Loading Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors & Issues</TabsTrigger>
          <TabsTrigger value="session">User Session</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl font-bold">
                  <span className={getScoreColor(performanceScore)}>
                    {performanceScore.toFixed(0)}
                  </span>
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
                <Badge {...getScoreBadge(performanceScore)}>
                  {getScoreBadge(performanceScore).text}
                </Badge>
              </div>
              <Progress value={performanceScore} className="mb-4" />
              <p className="text-sm text-muted-foreground">
                Overall performance score based on Core Web Vitals and error rates
              </p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Avg Load Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {report ? formatDuration(report.metrics.loadingPerformance.averageLoadTime) : 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Interactions</span>
                </div>
                <div className="text-2xl font-bold">
                  {report ? report.metrics.interactionMetrics.totalInteractions : 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Errors</span>
                </div>
                <div className="text-2xl font-bold">
                  {report ? report.metrics.errorRates.totalErrors : 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Memory className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <div className="text-2xl font-bold">
                  {report ? formatBytes(report.metrics.memoryUsage.averageUsage) : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Loading performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentMetricsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatDuration(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="load_complete" 
                    stroke="#8884d8" 
                    name="Load Complete"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="first_contentful_paint" 
                    stroke="#82ca9d" 
                    name="First Contentful Paint"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="largest_contentful_paint" 
                    stroke="#ffc658" 
                    name="Largest Contentful Paint"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Core Web Vitals
              </CardTitle>
              <CardDescription>
                Key performance metrics that measure user experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {coreWebVitalsData.map((vital) => {
                  const isGood = vital.value <= vital.threshold;
                  return (
                    <div key={vital.name} className="text-center">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {vital.name}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                        {vital.unit === 'score' ? vital.value.toFixed(3) : vital.value.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {vital.unit}
                      </div>
                      <div className="mt-2">
                        {isGood ? (
                          <Badge variant="default" className="text-xs">Good</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Needs Improvement</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {report && report.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Recommendations</CardTitle>
                <CardDescription>
                  Actionable suggestions to improve performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge variant={
                          rec.priority === 'critical' ? 'destructive' :
                          rec.priority === 'high' ? 'secondary' :
                          'outline'
                        }>
                          {rec.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {rec.description}
                      </p>
                      <div className="text-sm">
                        <div className="mb-2">
                          <strong>Impact:</strong> {rec.impact}
                        </div>
                        <div className="mb-2">
                          <strong>Effort:</strong> {rec.effort}
                        </div>
                        <div>
                          <strong>Action Items:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {rec.actionItems.map((item, index) => (
                              <li key={index} className="text-muted-foreground">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="loading" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Loading Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Load Time:</span>
                    <span className="font-medium">
                      {report ? formatDuration(report.metrics.loadingPerformance.averageLoadTime) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Median Load Time:</span>
                    <span className="font-medium">
                      {report ? formatDuration(report.metrics.loadingPerformance.medianLoadTime) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">95th Percentile:</span>
                    <span className="font-medium">
                      {report ? formatDuration(report.metrics.loadingPerformance.p95LoadTime) : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Load Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report?.metrics.loadingPerformance.resourceLoadTimes.map((resource) => (
                    <div key={resource.type} className="flex justify-between">
                      <span className="text-sm capitalize">{resource.type}:</span>
                      <span className="font-medium">{formatDuration(resource.average)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={errorData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {errorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Errors:</span>
                    <span className="font-medium text-red-600">
                      {report ? report.metrics.errorRates.totalErrors : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Rate:</span>
                    <span className="font-medium">
                      {report ? (report.metrics.errorRates.errorRate * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                  <Separator />
                  {report?.metrics.errorRates.topErrors.slice(0, 3).map((error, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium truncate">{error.message}</div>
                      <div className="text-muted-foreground">
                        Count: {error.count} | Last seen: {error.lastSeen.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Session
              </CardTitle>
              <CardDescription>
                Session ID: {currentSession?.sessionId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentSession && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-3">Session Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Start Time:</span>
                        <span>{currentSession.startTime.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Page Views:</span>
                        <span>{currentSession.pageViews.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interactions:</span>
                        <span>{currentSession.interactions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Errors:</span>
                        <span>{currentSession.errors.length}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Device Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span>{currentSession.deviceInfo.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Device Type:</span>
                        <span className="capitalize">{currentSession.deviceInfo.deviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolution:</span>
                        <span>{currentSession.deviceInfo.screenResolution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Language:</span>
                        <span>{currentSession.deviceInfo.language}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;
