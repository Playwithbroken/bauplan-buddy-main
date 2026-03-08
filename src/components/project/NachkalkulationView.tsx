import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  Target,
  Award,
  Download,
  RefreshCw,
  PieChart
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';

import { 
  NachkalkulationService, 
  NachkalkulationData, 
  NachkalkulationReport
} from '@/services/nachkalkulationService';
import { Project } from '@/services/projectTemplateService';

interface NachkalkulationViewProps {
  projectId: string;
  project?: Project;
  onClose?: () => void;
}

export const NachkalkulationView: React.FC<NachkalkulationViewProps> = ({
  projectId,
  project,
  onClose
}) => {
  const { toast } = useToast();
  const [nachkalkulation, setNachkalkulation] = useState<NachkalkulationData | null>(null);
  const [report, setReport] = useState<NachkalkulationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const loadNachkalkulation = useCallback(async () => {
    try {
      setLoading(true);
      const existingNK = NachkalkulationService.getNachkalkulation(projectId);

      if (existingNK) {
        setNachkalkulation(existingNK);
        const reportData = NachkalkulationService.generateReport(projectId);
        setReport(reportData);
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Nachkalkulation konnte nicht geladen werden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    void loadNachkalkulation();
  }, [loadNachkalkulation]);

  const generateNachkalkulation = async () => {
    if (!project) {
      toast({
        title: 'Fehler',
        description: 'Projektdaten nicht verfügbar',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const nk = NachkalkulationService.generateNachkalkulation(
        projectId,
        project,
        'current-user'
      );
      
      setNachkalkulation(nk);
      const reportData = NachkalkulationService.generateReport(projectId);
      setReport(reportData);
      
      setShowGenerateDialog(false);
      toast({
        title: 'Erfolgreich',
        description: 'Nachkalkulation wurde erstellt',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Nachkalkulation konnte nicht erstellt werden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: 'Export gestartet',
      description: `Nachkalkulation wird als ${format.toUpperCase()} exportiert`,
      variant: 'default'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Laden...</span>
      </div>
    );
  }

  if (!nachkalkulation) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine Nachkalkulation vorhanden</h3>
        <p className="text-gray-600 mb-6">
          Erstellen Sie eine Nachkalkulation für dieses Projekt
        </p>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Nachkalkulation erstellen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nachkalkulation erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Möchten Sie eine Nachkalkulation für dieses Projekt erstellen? 
                Dies analysiert die tatsächlichen gegen die geplanten Kosten.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={generateNachkalkulation}>
                  Erstellen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Nachkalkulation</h1>
          <p className="text-gray-600">{nachkalkulation.projectName}</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant={nachkalkulation.status === 'final' ? 'default' : 'secondary'}>
              {nachkalkulation.status === 'final' ? 'Abgeschlossen' : 'In Bearbeitung'}
            </Badge>
            <span className="text-sm text-gray-500">
              Erstellt am {new Date(nachkalkulation.calculationDate).toLocaleDateString('de-DE')}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={loadNachkalkulation}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kostenabweichung</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(nachkalkulation.financial.costVariance)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {nachkalkulation.financial.costVariance > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              )}
              {formatPercentage(
                nachkalkulation.financial.plannedCosts > 0 
                  ? (nachkalkulation.financial.costVariance / nachkalkulation.financial.plannedCosts) * 100 
                  : 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gewinnmarge</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(nachkalkulation.financial.profitMargin.actual)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              Geplant: {formatPercentage(nachkalkulation.financial.profitMargin.planned)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zeitabweichung</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nachkalkulation.projectInfo.duration.variance} Tage
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {nachkalkulation.projectInfo.duration.variance > 0 ? 'Verzögerung' : 'Früher fertig'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kostenleistung</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nachkalkulation.performance.costPerformanceIndex.toFixed(2)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {nachkalkulation.performance.costPerformanceIndex >= 1 ? (
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
              )}
              CPI {nachkalkulation.performance.costPerformanceIndex >= 1 ? 'Gut' : 'Kritisch'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
          <TabsTrigger value="insights">Erkenntnisse</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Kostenvergleich
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report?.charts.costComparison.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Kostenverteilung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart data={report?.charts.categoryBreakdown.data}>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    {report?.charts.categoryBreakdown.data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={report.charts.categoryBreakdown.colors[index % report.charts.categoryBreakdown.colors.length]} 
                      />
                    ))}
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Finanzielle Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Umsatz</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Geplant:</span>
                      <span>{formatCurrency(nachkalkulation.financial.plannedRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tatsächlich:</span>
                      <span>{formatCurrency(nachkalkulation.financial.actualRevenue)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Abweichung:</span>
                      <span className={nachkalkulation.financial.revenueVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(nachkalkulation.financial.revenueVariance)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Kosten</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Geplant:</span>
                      <span>{formatCurrency(nachkalkulation.financial.plannedCosts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tatsächlich:</span>
                      <span>{formatCurrency(nachkalkulation.financial.actualCosts)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Abweichung:</span>
                      <span className={nachkalkulation.financial.costVariance <= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(nachkalkulation.financial.costVariance)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Gewinn</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Geplant:</span>
                      <span>{formatCurrency(nachkalkulation.financial.plannedProfit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tatsächlich:</span>
                      <span>{formatCurrency(nachkalkulation.financial.actualProfit)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Abweichung:</span>
                      <span className={nachkalkulation.financial.profitVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(nachkalkulation.financial.profitVariance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs would be implemented in separate components */}
        <TabsContent value="analysis">
          <div className="text-center py-12">
            <p>Detaillierte Analyse wird in separaten Komponenten implementiert</p>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="text-center py-12">
            <p>Erkenntnisse und Empfehlungen werden in separaten Komponenten implementiert</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
