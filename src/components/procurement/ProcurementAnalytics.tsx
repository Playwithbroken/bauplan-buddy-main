import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Clock,
  Target,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface TopSupplier {
  name: string;
  spend: number;
  orders: number;
  onTimeRate: number;
  qualityScore: number;
}

interface CategoryTrend {
  category: string;
  currentMonth: number;
  lastMonth: number;
  change: number;
  trend: 'up' | 'down';
}

interface CostSaving {
  description: string;
  amount: number;
  type: 'negotiation' | 'consolidation' | 'optimization';
  date: string;
}

export const ProcurementAnalytics: React.FC = () => {
  const eurFormatter = useMemo(
    () =>
      new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    []
  );

  const metrics: AnalyticsMetric[] = [
    {
      label: 'Durchschn. Bestellwert',
      value: eurFormatter.format(8450),
      change: 12.5,
      trend: 'up',
      icon: <DollarSign className="h-4 w-4" />,
      color: 'text-blue-600',
    },
    {
      label: 'Aktive Lieferanten',
      value: 23,
      change: 2,
      trend: 'up',
      icon: <Users className="h-4 w-4" />,
      color: 'text-green-600',
    },
    {
      label: 'Ø Lieferzeit',
      value: '8.2 Tage',
      change: -5.3,
      trend: 'down',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-amber-600',
    },
    {
      label: 'Bestellgenauigkeit',
      value: '94.8%',
      change: 2.1,
      trend: 'up',
      icon: <Target className="h-4 w-4" />,
      color: 'text-purple-600',
    },
  ];

  const topSuppliers: TopSupplier[] = [
    { name: 'Baustoff Weber GmbH', spend: 184500, orders: 42, onTimeRate: 93, qualityScore: 4.6 },
    { name: 'Zementwerke Süd AG', spend: 96500, orders: 28, onTimeRate: 81, qualityScore: 4.2 },
    { name: 'KlimaTech Solutions', spend: 142300, orders: 12, onTimeRate: 88, qualityScore: 4.8 },
    { name: 'Elektro Schmidt', spend: 67800, orders: 35, onTimeRate: 91, qualityScore: 4.4 },
    { name: 'Holz & Mehr AG', spend: 54200, orders: 24, onTimeRate: 86, qualityScore: 4.3 },
  ];

  const categoryTrends: CategoryTrend[] = [
    { category: 'Stahl & Bewehrung', currentMonth: 42500, lastMonth: 38200, change: 11.3, trend: 'up' },
    { category: 'Beton & Mörtel', currentMonth: 28900, lastMonth: 31200, change: -7.4, trend: 'down' },
    { category: 'Technische Gebäudeausrüstung', currentMonth: 56700, lastMonth: 48300, change: 17.4, trend: 'up' },
    { category: 'Elektromaterial', currentMonth: 19500, lastMonth: 22100, change: -11.8, trend: 'down' },
  ];

  const costSavings: CostSaving[] = [
    { description: 'Mengenrabatt Stahl', amount: 4500, type: 'negotiation', date: '2025-01-15' },
    { description: 'Lieferkonsolidierung', amount: 2200, type: 'consolidation', date: '2025-01-12' },
    { description: 'Lageroptimierung', amount: 1800, type: 'optimization', date: '2025-01-08' },
  ];

  const totalSavings = costSavings.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-xs">{metric.label}</CardDescription>
              <div className={metric.color}>{metric.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : metric.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : null}
                <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : ''}>
                  {Math.abs(metric.change)}%
                </span>
                <span>vs. Vormonat</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top-Lieferanten nach Umsatz</CardTitle>
            <CardDescription>Top 5 Partner im aktuellen Quartal</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lieferant</TableHead>
                  <TableHead className="text-right">Umsatz</TableHead>
                  <TableHead className="text-right">Bestellungen</TableHead>
                  <TableHead className="text-right">On-Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSuppliers.map((supplier, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 justify-center">
                          {idx + 1}
                        </Badge>
                        <span className="text-sm font-medium">{supplier.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {eurFormatter.format(supplier.spend)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {supplier.orders}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={supplier.onTimeRate >= 90 ? 'default' : supplier.onTimeRate >= 80 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {supplier.onTimeRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Category Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategorie-Trends</CardTitle>
            <CardDescription>Monatliche Ausgabenentwicklung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryTrends.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    {cat.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                    <Badge variant={cat.trend === 'up' ? 'destructive' : 'default'} className="text-xs">
                      {cat.trend === 'up' ? '+' : ''}{cat.change.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Aktuell: {eurFormatter.format(cat.currentMonth)}</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span>Vormonat: {eurFormatter.format(cat.lastMonth)}</span>
                </div>
                <Progress value={(cat.currentMonth / 100000) * 100} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cost Savings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Kosteneinsparungen</CardTitle>
              <CardDescription>Erfolgreiche Optimierungsmaßnahmen</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{eurFormatter.format(totalSavings)}</p>
              <p className="text-xs text-muted-foreground">Gesamt im Monat</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costSavings.map((saving, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'rounded-full p-2',
                    saving.type === 'negotiation' ? 'bg-blue-100' :
                    saving.type === 'consolidation' ? 'bg-purple-100' : 'bg-green-100'
                  )}>
                    <Package className={cn(
                      'h-4 w-4',
                      saving.type === 'negotiation' ? 'text-blue-600' :
                      saving.type === 'consolidation' ? 'text-purple-600' : 'text-green-600'
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{saving.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {saving.type === 'negotiation' ? 'Verhandlung' :
                       saving.type === 'consolidation' ? 'Konsolidierung' : 'Optimierung'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">
                    {eurFormatter.format(saving.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{saving.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-blue-900">
            <AlertCircle className="h-5 w-5" />
            Empfehlungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white p-3">
            <div className="rounded-full bg-blue-100 p-1">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Lieferantenkonsolidierung bei Elektromaterial
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Potenzielle Einsparung: ca. 3.200 EUR/Monat durch Mengenrabatte
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white p-3">
            <div className="rounded-full bg-blue-100 p-1">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Lieferzeiten bei Zementwerke Süd AG optimieren
              </p>
              <p className="text-xs text-blue-700 mt-1">
                On-Time-Rate 81% - Eskalation oder Alternativlieferant prüfen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
