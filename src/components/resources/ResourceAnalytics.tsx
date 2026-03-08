import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Activity,
  Clock, AlertTriangle, CheckCircle2, Package,
  type LucideIcon
} from "lucide-react";

interface EquipmentData {
  id: string;
  name: string;
  category: string;
  status: string;
  value: number;
  utilizationRate?: number;
  condition: string;
}

interface ResourceAnalyticsProps {
  equipment: EquipmentData[];
}

export const ResourceAnalytics: React.FC<ResourceAnalyticsProps> = ({ equipment }) => {
  // Calculate analytics
  const analytics = React.useMemo(() => {
    const totalValue = equipment.reduce((sum, eq) => sum + eq.value, 0);
    const avgUtilization = equipment.reduce((sum, eq) => sum + (eq.utilizationRate || 0), 0) / equipment.length;
    
    // Status breakdown
    const statusBreakdown = equipment.reduce((acc, eq) => {
      acc[eq.status] = (acc[eq.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category breakdown with values
    const categoryBreakdown = equipment.reduce((acc, eq) => {
      if (!acc[eq.category]) {
        acc[eq.category] = { count: 0, value: 0, utilization: 0 };
      }
      acc[eq.category].count++;
      acc[eq.category].value += eq.value;
      acc[eq.category].utilization += eq.utilizationRate || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number; utilization: number }>);

    // Calculate average utilization per category
    Object.keys(categoryBreakdown).forEach(cat => {
      categoryBreakdown[cat].utilization = 
        categoryBreakdown[cat].utilization / categoryBreakdown[cat].count;
    });

    // Condition distribution
    const conditionBreakdown = equipment.reduce((acc, eq) => {
      acc[eq.condition] = (acc[eq.condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // ROI estimation (simplified)
    const estimatedAnnualRevenue = equipment.reduce((sum, eq) => {
      return sum + (eq.utilizationRate || 0) * eq.value * 0.001; // Simplified calculation
    }, 0);

    return {
      totalValue,
      avgUtilization: Math.round(avgUtilization),
      statusBreakdown,
      categoryBreakdown,
      conditionBreakdown,
      estimatedAnnualRevenue,
      totalAssets: equipment.length,
    };
  }, [equipment]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vehicle: 'bg-blue-500',
      tool: 'bg-green-500',
      machinery: 'bg-orange-500',
      safety: 'bg-purple-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      excellent: 'text-green-600',
      good: 'text-blue-600',
      fair: 'text-yellow-600',
      poor: 'text-red-600',
    };
    return colors[condition] || 'text-gray-600';
  };

  const getUtilizationTrend = (rate: number) => {
    if (rate >= 80) return { icon: TrendingUp, color: 'text-green-600', label: 'Hoch' };
    if (rate >= 50) return { icon: Activity, color: 'text-blue-600', label: 'Mittel' };
    return { icon: TrendingDown, color: 'text-yellow-600', label: 'Niedrig' };
  };

  const trend = getUtilizationTrend(analytics.avgUtilization);

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtwert Portfolio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{(analytics.totalValue / 1000).toFixed(0)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalAssets} Assets im Bestand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschn. Auslastung</CardTitle>
            <trend.icon className={`h-4 w-4 ${trend.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgUtilization}%</div>
            <div className="flex items-center mt-1">
              <Progress value={analytics.avgUtilization} className="h-2 flex-1" />
              <span className={`text-xs ml-2 ${trend.color}`}>{trend.label}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geschätzter Jahresertrag</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{Math.round(analytics.estimatedAnnualRevenue / 1000)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Basierend auf Auslastung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verfügbarkeit</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.statusBreakdown.available || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Geräte sofort einsatzbereit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Leistung nach Kategorie</CardTitle>
            <CardDescription>Wert und Auslastung pro Kategorie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(analytics.categoryBreakdown)
                .sort((a, b) => b[1].value - a[1].value)
                .map(([category, data]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
                        <span className="text-sm font-medium capitalize">{category}</span>
                        <span className="text-xs text-muted-foreground">
                          ({data.count} Geräte)
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        €{(data.value / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Auslastung</span>
                        <span className="font-medium">{Math.round(data.utilization)}%</span>
                      </div>
                      <Progress value={data.utilization} className="h-2" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Verteilung</CardTitle>
            <CardDescription>Aktuelle Status-Übersicht</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
                const percentage = (count / analytics.totalAssets) * 100;
                const statusConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
                  available: { icon: CheckCircle2, color: 'text-green-600', label: 'Verfügbar' },
                  'in-use': { icon: Activity, color: 'text-blue-600', label: 'Im Einsatz' },
                  maintenance: { icon: Clock, color: 'text-yellow-600', label: 'Wartung' },
                  broken: { icon: AlertTriangle, color: 'text-red-600', label: 'Defekt' },
                };
                const config = statusConfig[status] || { 
                  icon: Package, 
                  color: 'text-gray-600', 
                  label: status 
                };
                const Icon = config.icon;

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(percentage)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Condition Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Zustandsanalyse</CardTitle>
            <CardDescription>Verteilung nach Zustand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.conditionBreakdown)
                .sort((a, b) => {
                  const order = ['excellent', 'good', 'fair', 'poor'];
                  return order.indexOf(a[0]) - order.indexOf(b[0]);
                })
                .map(([condition, count]) => {
                  const percentage = (count / analytics.totalAssets) * 100;
                  const labels: Record<string, string> = {
                    excellent: 'Ausgezeichnet',
                    good: 'Gut',
                    fair: 'Akzeptabel',
                    poor: 'Schlecht',
                  };

                  return (
                    <div key={condition} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${getConditionColor(condition)}`}>
                          {labels[condition] || condition}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(percentage)}%)
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Utilization Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Top Ausgelastete Assets</CardTitle>
            <CardDescription>Höchste Nutzungsraten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {equipment
                .filter(eq => eq.utilizationRate)
                .sort((a, b) => (b.utilizationRate || 0) - (a.utilizationRate || 0))
                .slice(0, 5)
                .map((eq) => {
                  const trend = getUtilizationTrend(eq.utilizationRate || 0);
                  const TrendIcon = trend.icon;

                  return (
                    <div key={eq.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <TrendIcon className={`h-4 w-4 flex-shrink-0 ${trend.color}`} />
                          <span className="text-sm font-medium truncate">{eq.name}</span>
                        </div>
                        <span className="text-sm font-medium ml-2">{eq.utilizationRate}%</span>
                      </div>
                      <Progress value={eq.utilizationRate} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Investitionsanalyse</CardTitle>
          <CardDescription>Verteilung des Anlagevermögens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(analytics.categoryBreakdown)
              .sort((a, b) => b[1].value - a[1].value)
              .map(([category, data]) => {
                const percentage = (data.value / analytics.totalValue) * 100;
                
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
                        <span className="text-sm font-medium capitalize">{category}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        €{(data.value / 1000).toFixed(0)}k
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {data.count} Assets • {Math.round(data.utilization)}% Auslastung
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ROI Effizienz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analytics.estimatedAnnualRevenue / analytics.totalValue) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Geschätzter ROI pro Jahr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Wartungsbedarf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.statusBreakdown.maintenance || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Geräte in Wartung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Asset Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                ((analytics.conditionBreakdown.excellent || 0) + 
                 (analytics.conditionBreakdown.good || 0)) / 
                analytics.totalAssets * 100
              )}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In gutem/excellentem Zustand
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
