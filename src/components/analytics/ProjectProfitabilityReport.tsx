import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, Calendar, 
  Download, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedReportingService } from '@/services/enhancedReportingService';
import type { ProjectProfitabilityReport as ProjectProfitabilityReportType } from '@/services/enhancedReportingService';

interface ProjectProfitabilityReportProps {
  projectId?: string;
}

const ProjectProfitabilityReport: React.FC<ProjectProfitabilityReportProps> = ({ projectId }) => {
  const [reportingService] = useState(() => EnhancedReportingService.getInstance());
  const [reports, setReports] = useState<ProjectProfitabilityReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(projectId);
  const { toast } = useToast();

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportingService.generateProjectProfitabilityReport(selectedProject);
      setReports(data);
    } catch (error) {
      toast({
        title: "Fehler beim Laden",
        description: "Die Projektreportdaten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [reportingService, selectedProject, toast]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: "Export wird vorbereitet",
      description: `Der Bericht wird als ${format.toUpperCase()} exportiert.`
    });
    
    // In a real implementation, we would generate and download the file
    // For now, we'll just show a toast
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getStatusColor = (roi: number): 'default' | 'destructive' | 'secondary' => {
    if (roi >= 30) return 'default';
    if (roi >= 15) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (variance: number) => {
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-green-600" />;
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    return <Calendar className="h-4 w-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projektrentabilität</h2>
          <p className="text-muted-foreground">Analyse der Profitabilität und Rentabilität Ihrer Projekte</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject || "all"} onValueChange={(value) => setSelectedProject(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Projekt auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Projekte</SelectItem>
              <SelectItem value="PRJ-2024-001">Wohnhaus Familie Müller</SelectItem>
              <SelectItem value="PRJ-2024-002">Bürogebäude TechCorp</SelectItem>
              <SelectItem value="PRJ-2024-003">Dachsanierung Hamburg</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={loadReports} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reports.reduce((sum, report) => sum + report.totalRevenue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {reports.length} Projekte
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtkosten</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reports.reduce((sum, report) => sum + report.totalCosts, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Durchschnitt: {formatCurrency(reports.reduce((sum, report) => sum + report.totalCosts, 0) / (reports.length || 1))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtgewinn</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(reports.reduce((sum, report) => sum + report.profit, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Gewinnmarge: {((reports.reduce((sum, report) => sum + report.profit, 0) / reports.reduce((sum, report) => sum + report.totalRevenue, 0)) * 100 || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschnitts-ROI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(reports.reduce((sum, report) => sum + report.roi, 0) / (reports.length || 1)).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Beste: {Math.max(...reports.map(r => r.roi)).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projekt-Details</CardTitle>
          <CardDescription>Rentabilitätsanalyse nach Projekt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.projectId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{report.projectName}</h3>
                    <p className="text-sm text-muted-foreground">{report.projectId}</p>
                  </div>
                  <Badge variant={getStatusColor(report.roi)}>
                    ROI: {report.roi.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Umsatz</p>
                    <p className="font-semibold">{formatCurrency(report.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kosten</p>
                    <p className="font-semibold">{formatCurrency(report.totalCosts)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gewinn</p>
                    <p className="font-semibold text-green-600">{formatCurrency(report.profit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Marge</p>
                    <p className="font-semibold">{report.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span>Budget: {((report.budgetUsed / report.budgetTotal) * 100).toFixed(0)}% genutzt</span>
                    <span className="flex items-center gap-1">
                      {getTrendIcon(report.timelineVariance)}
                      {report.timelineVariance !== 0 ? `${Math.abs(report.timelineVariance)} Tage ${report.timelineVariance < 0 ? 'vorne' : 'hinten'}` : 'Planmäßig'}
                    </span>
                  </div>
                  <div className="text-sm">
                    Fertigstellung: {report.completionRate.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export-Optionen</CardTitle>
          <CardDescription>Exportieren Sie Ihre Projektrentabilitätsberichte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => exportReport('pdf')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF Export
            </Button>
            <Button onClick={() => exportReport('excel')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel Export
            </Button>
            <Button onClick={() => exportReport('csv')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectProfitabilityReport;

