import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  MultiWindowDialog,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { DialogFrame } from '../ui/dialog-frame';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Euro,
  Building,
  Users,
  Truck,
  Wrench,
  Plus,
  Target,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export interface CostItem {
  id: string;
  categoryId: string;
  name: string;
  plannedCost: number;
  actualCost: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  supplier?: string;
  date: string;
  projectId: string;
  projectName: string;
  invoiceId?: string;
  status: 'planned' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface ProjectCostSummary {
  projectId: string;
  projectName: string;
  totalPlanned: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
  profitMargin: number;
  revenue: number;
  completionRate: number;
  riskScore: number;
  forecastedCost: number;
  costPerformanceIndex: number;
}

export const CostAnalysisManager: React.FC = () => {
  const { toast } = useToast();
  
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewType, setViewType] = useState<'overview' | 'detailed' | 'trends' | 'variance' | 'projects'>('overview');
  const [showAddCostDialog, setShowAddCostDialog] = useState(false);
  
  // Form state for cost recording
  const [newCostData, setNewCostData] = useState({
    name: '',
    categoryId: '',
    plannedCost: '',
    actualCost: '',
    quantity: '',
    unit: '',
    supplier: '',
    projectId: 'proj-001'
  });

  // Cost categories for construction projects
  const costCategories = useMemo(() => ([
    { id: 'materials', name: 'Materialien', color: '#3b82f6', icon: <Building className="h-4 w-4" /> },
    { id: 'labor', name: 'Arbeitskosten', color: '#10b981', icon: <Users className="h-4 w-4" /> },
    { id: 'equipment', name: 'Gerte & Maschinen', color: '#f59e0b', icon: <Wrench className="h-4 w-4" /> },
    { id: 'transport', name: 'Transport & Logistik', color: '#ef4444', icon: <Truck className="h-4 w-4" /> },
    { id: 'subcontractors', name: 'Subunternehmer', color: '#8b5cf6', icon: <Building className="h-4 w-4" /> },
    { id: 'overhead', name: 'Gemeinkosten', color: '#6b7280', icon: <Calculator className="h-4 w-4" /> }
  ]), []);

  // Mock cost data with more detailed information
  const [costItems] = useState<CostItem[]>([
    {
      id: 'cost-001',
      categoryId: 'materials',
      name: 'Beton C25/30',
      plannedCost: 15000,
      actualCost: 16200,
      quantity: 120,
      unit: 'm',
      unitPrice: 135,
      supplier: 'Beton AG',
      date: '2024-02-01',
      projectId: 'proj-001',
      projectName: 'Wohnhaus Mnchen',
      status: 'completed',
      priority: 'high'
    },
    {
      id: 'cost-002',
      categoryId: 'labor',
      name: 'Maurerarbeiten',
      plannedCost: 25000,
      actualCost: 24500,
      quantity: 500,
      unit: 'Std',
      unitPrice: 49,
      date: '2024-02-05',
      projectId: 'proj-001',
      projectName: 'Wohnhaus Mnchen',
      status: 'completed',
      priority: 'high'
    },
    {
      id: 'cost-003',
      categoryId: 'equipment',
      name: 'Kran-Miete',
      plannedCost: 8000,
      actualCost: 8500,
      quantity: 20,
      unit: 'Tage',
      unitPrice: 425,
      supplier: 'Kran Service GmbH',
      date: '2024-02-10',
      projectId: 'proj-001',
      projectName: 'Wohnhaus Mnchen',
      status: 'completed',
      priority: 'medium'
    },
    {
      id: 'cost-004',
      categoryId: 'materials',
      name: 'Stahl Bewehrung',
      plannedCost: 12000,
      actualCost: 11800,
      quantity: 15,
      unit: 't',
      unitPrice: 786,
      supplier: 'Stahl Nord',
      date: '2024-01-25',
      projectId: 'proj-002',
      projectName: 'Brogebude Berlin',
      status: 'completed',
      priority: 'high'
    },
    {
      id: 'cost-005',
      categoryId: 'subcontractors',
      name: 'Elektroinstallation',
      plannedCost: 35000,
      actualCost: 37500,
      quantity: 1,
      unit: 'Pauschal',
      unitPrice: 37500,
      supplier: 'Elektro Meyer',
      date: '2024-02-15',
      projectId: 'proj-002',
      projectName: 'Brogebude Berlin',
      status: 'in-progress',
      priority: 'high'
    },
    {
      id: 'cost-006',
      categoryId: 'labor',
      name: 'Trockenbauarbeiten',
      plannedCost: 18000,
      actualCost: 0,
      quantity: 200,
      unit: 'Std',
      unitPrice: 90,
      date: '2024-03-01',
      projectId: 'proj-002',
      projectName: 'Brogebude Berlin',
      status: 'planned',
      priority: 'medium'
    }
  ]);

  const projectRevenue = { 
    'proj-001': 180000, 
    'proj-002': 350000,
    'proj-003': 95000
  };

  // Calculate summary metrics with advanced analytics
  const summaryMetrics = useMemo(() => {
    const totalPlanned = costItems.reduce((sum, item) => sum + item.plannedCost, 0);
    const totalActual = costItems.reduce((sum, item) => sum + item.actualCost, 0);
    const variance = totalActual - totalPlanned;
    const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;
    
    // Calculate forecasted costs (simple linear projection)
    const completedItems = costItems.filter(item => item.status === 'completed');
    const plannedItems = costItems.filter(item => item.status === 'planned');
    const inProgressItems = costItems.filter(item => item.status === 'in-progress');
    
    const completedCostRatio = completedItems.length > 0 
      ? completedItems.reduce((sum, item) => sum + item.actualCost, 0) / completedItems.reduce((sum, item) => sum + item.plannedCost, 0)
      : 1;
      
    const forecastedCost = totalPlanned * completedCostRatio + 
                          inProgressItems.reduce((sum, item) => sum + item.plannedCost, 0) + 
                          plannedItems.reduce((sum, item) => sum + item.plannedCost, 0);
    
    // Cost Performance Index (CPI)
    const cpi = totalActual > 0 ? totalPlanned / totalActual : 1;
    
    // Risk score based on variance and upcoming costs
    const riskScore = Math.min(100, Math.max(0, 
      Math.abs(variancePercent) * 2 + 
      (plannedItems.length * 5) + 
      (inProgressItems.filter(item => item.actualCost > item.plannedCost * 1.1).length * 10)
    ));

    const categoryBreakdown = costCategories.map(category => {
      const categoryItems = costItems.filter(item => item.categoryId === category.id);
      const planned = categoryItems.reduce((sum, item) => sum + item.plannedCost, 0);
      const actual = categoryItems.reduce((sum, item) => sum + item.actualCost, 0);
      
      // Calculate trend for this category
      const recentItems = categoryItems.filter(item => {
        const itemDate = new Date(item.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return itemDate >= thirtyDaysAgo;
      });
      
      const trend = recentItems.length > 1 
        ? (recentItems[recentItems.length - 1].actualCost - recentItems[0].actualCost) / recentItems.length
        : 0;
      
      return {
        name: category.name,
        planned,
        actual,
        variance: actual - planned,
        trend,
        color: category.color
      };
    }).filter(cat => cat.planned > 0 || cat.actual > 0);

    return { 
      totalPlanned, 
      totalActual, 
      variance, 
      variancePercent, 
      categoryBreakdown,
      forecastedCost,
      cpi,
      riskScore
    };
  }, [costItems, costCategories]);

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getVarianceBadge = (variance: number, percent: number) => {
    if (Math.abs(percent) < 5) {
      return <Badge variant="outline">Im Budget</Badge>;
    } else if (variance > 0) {
      return <Badge variant="destructive">über Budget</Badge>;
    } else {
      return <Badge variant="default">unter Budget</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kostenanalyse</h1>
          <p className="text-muted-foreground">
            Detaillierte Analyse der Projekt- und Kategoriekosten
          </p>
        </div>
        <Button onClick={() => setShowAddCostDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Kosten erfassen
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Projekt</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Projekte</SelectItem>
                  <SelectItem value="proj-001">Wohnhaus Mnchen</SelectItem>
                  <SelectItem value="proj-002">Brogebude Berlin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Ansicht</Label>
              <Select value={viewType} onValueChange={(value: 'overview' | 'detailed' | 'trends' | 'variance' | 'projects') => setViewType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Übersicht</SelectItem>
                  <SelectItem value="detailed">Detailliert</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                  <SelectItem value="variance">Abweichungen</SelectItem>
                  <SelectItem value="projects">Projekte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Geplante Kosten</p>
                <p className="text-2xl font-bold">{summaryMetrics.totalPlanned.toLocaleString('de-DE')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Euro className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tatschliche Kosten</p>
                <p className="text-2xl font-bold">{summaryMetrics.totalActual.toLocaleString('de-DE')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {summaryMetrics.variance > 0 ? (
                <TrendingUp className="h-8 w-8 text-red-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-600" />
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Abweichung</p>
                <p className={`text-2xl font-bold ${getVarianceColor(summaryMetrics.variance)}`}>
                  {Math.abs(summaryMetrics.variance).toLocaleString('de-DE')}
                </p>
                <p className={`text-xs ${getVarianceColor(summaryMetrics.variance)}`}>
                  {summaryMetrics.variancePercent > 0 ? '+' : ''}{summaryMetrics.variancePercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kostenpositionen</p>
                <p className="text-2xl font-bold">{costItems.length}</p>
                <p className="text-xs text-muted-foreground">6 Kategorien</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prognose</p>
                <p className="text-2xl font-bold">{summaryMetrics.forecastedCost.toLocaleString('de-DE')}</p>
                <p className="text-xs text-muted-foreground">Geschtzte Gesamtkosten</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risiko</p>
                <p className="text-2xl font-bold">{summaryMetrics.riskScore.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">von 100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content based on view type */}
      {viewType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Kostenverteilung nach Kategorien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={summaryMetrics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, actual, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="actual"
                  >
                    {summaryMetrics.categoryBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke={entry.color}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString('de-DE')}`, 'Kosten']} 
                    labelFormatter={(value) => `Kategorie: ${value}`}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    formatter={(value, entry, index) => {
                      const category = summaryMetrics.categoryBreakdown.find(cat => cat.name === value);
                      return (
                        <span className="text-sm font-medium" style={{ color: category?.color || '#000' }}>
                          {value}
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Planned vs Actual Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Geplant vs. Tatschlich
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaryMetrics.categoryBreakdown} barGap={0} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `EUR ${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString('de-DE')}`, '']} 
                    labelFormatter={(value) => `Kategorie: ${value}`}
                  />
                  <Legend />
                  <Bar dataKey="planned" fill="#94a3b8" name="Geplant" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#3b82f6" name="Tatschlich" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {viewType === 'detailed' && (
        <Card>
          <CardHeader>
            <CardTitle>Detaillierte Kostenliste</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead className="text-right">Geplant</TableHead>
                  <TableHead className="text-right">Tatschlich</TableHead>
                  <TableHead className="text-right">Abweichung</TableHead>
                  <TableHead>Lieferant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costItems.map((item) => {
                  const variance = item.actualCost - item.plannedCost;
                  const variancePercent = item.plannedCost > 0 ? (variance / item.plannedCost) * 100 : 0;
                  
                  // Determine color based on variance
                  let varianceColor = '';
                  if (variancePercent > 5) {
                    varianceColor = 'text-red-600'; // Over budget
                  } else if (variancePercent < -5) {
                    varianceColor = 'text-green-600'; // Under budget
                  } else {
                    varianceColor = 'text-gray-600'; // Near budget
                  }
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} - EUR {Number(item.unitPrice).toLocaleString('de-DE')}
                        </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {costCategories.find(cat => cat.id === item.categoryId)?.icon}
                          <span className="text-sm">
                            {costCategories.find(cat => cat.id === item.categoryId)?.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.projectName}</TableCell>
                      <TableCell className="text-right">
                        {item.plannedCost.toLocaleString('de-DE')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.actualCost.toLocaleString('de-DE')}
                      </TableCell>
                      <TableCell className={`text-right ${varianceColor}`}>
                        <div>
                          {variance > 0 ? '+' : ''}{variance.toLocaleString('de-DE')}
                          <br />
                          <span className="text-xs">
                            ({variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.supplier || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {viewType === 'trends' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Kostenentwicklung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={summaryMetrics.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `EUR ${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString('de-DE')}`, '']} 
                    labelFormatter={(value) => `Kategorie: ${value}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3} 
                    name="Tatschliche Kosten" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="planned" 
                    stroke="#94a3b8" 
                    fill="#94a3b8" 
                    fillOpacity={0.3} 
                    name="Geplante Kosten" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Prognose</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Prognostizierte Gesamtkosten:</span>
                    <span className="font-bold">{summaryMetrics.forecastedCost.toLocaleString('de-DE')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cost Performance Index (CPI):</span>
                    <span className={`font-bold ${summaryMetrics.cpi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {summaryMetrics.cpi.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Risikobewertung</span>
                      <span className="text-sm font-medium">{summaryMetrics.riskScore.toFixed(0)}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${summaryMetrics.riskScore > 70 ? 'bg-red-600' : summaryMetrics.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${summaryMetrics.riskScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategorientrends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summaryMetrics.categoryBreakdown.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{category.actual.toLocaleString('de-DE')}</span>
                        {category.trend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : category.trend < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-gray-500">=</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {viewType === 'variance' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Abweichungsanalyse
              </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Geplante Kosten</p>
                        <p className="text-lg font-bold">{summaryMetrics.totalPlanned.toLocaleString('de-DE')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-green-100">
                        <Euro className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tatschliche Kosten</p>
                        <p className="text-lg font-bold">{summaryMetrics.totalActual.toLocaleString('de-DE')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${summaryMetrics.variance >= 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                        {summaryMetrics.variance >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Abweichung</p>
                        <p className={`text-lg font-bold ${summaryMetrics.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {summaryMetrics.variance >= 0 ? '+' : ''}{Math.abs(summaryMetrics.variance).toLocaleString('de-DE')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Kategorien nach Abweichung</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">Geplant</TableHead>
                      <TableHead className="text-right">Tatschlich</TableHead>
                      <TableHead className="text-right">Abweichung</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryMetrics.categoryBreakdown
                      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
                      .map((category) => {
                        const variancePercent = category.planned > 0 ? (category.variance / category.planned) * 100 : 0;
                        // Determine color based on variance
                        let varianceColor = '';
                        if (variancePercent > 5) {
                          varianceColor = 'text-red-600'; // Over budget
                        } else if (variancePercent < -5) {
                          varianceColor = 'text-green-600'; // Under budget
                        } else {
                          varianceColor = 'text-gray-600'; // Near budget
                        }
                        
                        return (
                          <TableRow key={category.name}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                                <span>{category.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{category.planned.toLocaleString('de-DE')}</TableCell>
                            <TableCell className="text-right">{category.actual.toLocaleString('de-DE')}</TableCell>
                            <TableCell className={`text-right font-medium ${varianceColor}`}>
                              {category.variance > 0 ? '+' : ''}{category.variance.toLocaleString('de-DE')}
                            </TableCell>
                            <TableCell className={`text-right ${varianceColor}`}>
                              {variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewType === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(projectRevenue).map(([projectId, revenue]) => {
              const projectItems = costItems.filter(item => item.projectId === projectId);
              const projectName = projectItems[0]?.projectName || 'Unbekanntes Projekt';
              const totalPlanned = projectItems.reduce((sum, item) => sum + item.plannedCost, 0);
              const totalActual = projectItems.reduce((sum, item) => sum + item.actualCost, 0);
              const variance = totalActual - totalPlanned;
              const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;
              const profit = revenue - totalActual;
              const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
              
              return (
                <Card key={projectId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{projectName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Umsatz</p>
                          <p className="text-lg font-bold">{revenue.toLocaleString('de-DE')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Kosten</p>
                          <p className="text-lg font-bold">{totalActual.toLocaleString('de-DE')}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Gewinn</p>
                          <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit.toLocaleString('de-DE')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Marge</p>
                          <p className={`text-lg font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profitMargin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Budgetabweichung</span>
                          <span className={`text-sm font-medium ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {variance >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${Math.abs(variancePercent) > 10 ? 'bg-red-500' : Math.abs(variancePercent) > 5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, Math.abs(variancePercent) * 2)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Projektvergleich
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={Object.entries(projectRevenue).map(([projectId, revenue]) => {
                    const projectItems = costItems.filter(item => item.projectId === projectId);
                    const projectName = projectItems[0]?.projectName || 'Unbekanntes Projekt';
                    const totalActual = projectItems.reduce((sum, item) => sum + item.actualCost, 0);
                    const profit = revenue - totalActual;
                    return {
                      name: projectName,
                      revenue,
                      costs: totalActual,
                      profit
                    };
                  })}
                  barGap={0}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `EUR ${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: number, name) => {
                      const labels: Record<string, string> = {
                        revenue: 'Umsatz',
                        costs: 'Kosten',
                        profit: 'Gewinn'
                      };
                      const labelKey = typeof name === 'string' ? name : String(name);
                      const label = labels[labelKey] ?? labelKey;
                      return [`EUR ${value.toLocaleString('de-DE')}`, label];
                    }}
                    labelFormatter={(value) => `Projekt: ${value}`}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Umsatz" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costs" fill="#ef4444" name="Kosten" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#3b82f6" name="Gewinn" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Cost Dialog */}
      <MultiWindowDialog open={showAddCostDialog} onOpenChange={setShowAddCostDialog} modal={false}>
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Kosten erfassen
            </span>
          }
          width="fit-content"
          minWidth={640}
          maxWidth={1024}
          resizable={true}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => {
                setShowAddCostDialog(false);
                setNewCostData({
                  name: '',
                  categoryId: '',
                  plannedCost: '',
                  actualCost: '',
                  quantity: '',
                  unit: '',
                  supplier: '',
                  projectId: 'proj-001'
                });
              }}>
                Abbrechen
              </Button>
              <Button 
                onClick={() => {
                  if (!newCostData.name || !newCostData.categoryId) {
                    toast({ 
                      title: "Fehler", 
                      description: "Bitte füllen Sie mindestens Bezeichnung und Kategorie aus.",
                      variant: "destructive"
                    });
                    return;
                  }
                  setShowAddCostDialog(false);
                  setNewCostData({
                    name: '',
                    categoryId: '',
                    plannedCost: '',
                    actualCost: '',
                    quantity: '',
                    unit: '',
                    supplier: '',
                    projectId: 'proj-001'
                  });
                  toast({ 
                    title: "Kosten erfasst", 
                    description: `Die Kostenposition "${newCostData.name}" wurde hinzugefügt.` 
                  });
                }}
                disabled={!newCostData.name || !newCostData.categoryId}
              >
                Erfassen
              </Button>
            </div>
          }
        >
          <DialogDescription>
            Neue Kostenposition hinzufügen
          </DialogDescription>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bezeichnung</Label>
              <Input 
                placeholder="z.B. Beton C25/30" 
                value={newCostData.name}
                onChange={(e) => setNewCostData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Kategorie *</Label>
              <Select 
                value={newCostData.categoryId} 
                onValueChange={(value) => setNewCostData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {costCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        {category.icon}
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Projekt</Label>
              <Select 
                value={newCostData.projectId} 
                onValueChange={(value) => setNewCostData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proj-001">Wohnhaus München</SelectItem>
                  <SelectItem value="proj-002">Bürogebäude Berlin</SelectItem>
                  <SelectItem value="proj-003">Dachsanierung Hamburg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Geplante Kosten</Label>
                <Input 
                  type="number" 
                  placeholder="15000" 
                  value={newCostData.plannedCost}
                  onChange={(e) => setNewCostData(prev => ({ ...prev, plannedCost: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tatsächliche Kosten</Label>
                <Input 
                  type="number" 
                  placeholder="16200" 
                  value={newCostData.actualCost}
                  onChange={(e) => setNewCostData(prev => ({ ...prev, actualCost: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Menge</Label>
                <Input 
                  type="number" 
                  placeholder="120" 
                  value={newCostData.quantity}
                  onChange={(e) => setNewCostData(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Einheit</Label>
                <Select 
                  value={newCostData.unit} 
                  onValueChange={(value) => setNewCostData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Einheit wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m³">m³</SelectItem>
                    <SelectItem value="m²">m²</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="t">t</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="Std">Std</SelectItem>
                    <SelectItem value="Tage">Tage</SelectItem>
                    <SelectItem value="Stk">Stk</SelectItem>
                    <SelectItem value="Pauschal">Pauschal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Lieferant/Dienstleister</Label>
              <Input 
                placeholder="z.B. Beton AG" 
                value={newCostData.supplier}
                onChange={(e) => setNewCostData(prev => ({ ...prev, supplier: e.target.value }))}
              />
            </div>
          </div>
        </DialogFrame>
      </MultiWindowDialog>
    </div>
  );
};

export default CostAnalysisManager;
