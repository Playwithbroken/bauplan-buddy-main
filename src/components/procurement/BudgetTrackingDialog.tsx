import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dialog } from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { KpiCard } from '@/components/ui/kpi-card';
import { InsightBanner } from '@/components/ui/insight-banner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Euro,
  Calendar,
  Target,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetAllocation {
  id: string;
  projectId: string;
  projectName: string;
  costCentre: string;
  totalBudget: number;
  allocated: number;
  spent: number;
  committed: number;
  remaining: number;
  period: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface BudgetTransaction {
  id: string;
  date: string;
  type: 'allocation' | 'order' | 'receipt' | 'invoice';
  description: string;
  projectName: string;
  amount: number;
  balance: number;
}

interface CategorySpend {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
}

interface BudgetTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock budget data
const mockBudgetAllocations: BudgetAllocation[] = [
  {
    id: 'BUD-001',
    projectId: 'PRJ-001',
    projectName: 'Wohnquartier München',
    costCentre: 'CC-BAU-01',
    totalBudget: 250000,
    allocated: 250000,
    spent: 184500,
    committed: 32500,
    remaining: 33000,
    period: '2025 Q1',
    status: 'healthy',
  },
  {
    id: 'BUD-002',
    projectId: 'PRJ-002',
    projectName: 'Büropark Frankfurt',
    costCentre: 'CC-BAU-02',
    totalBudget: 180000,
    allocated: 180000,
    spent: 162000,
    committed: 15000,
    remaining: 3000,
    period: '2025 Q1',
    status: 'critical',
  },
  {
    id: 'BUD-003',
    projectId: 'PRJ-005',
    projectName: 'Krankenhaus Stuttgart',
    costCentre: 'CC-BAU-05',
    totalBudget: 450000,
    allocated: 450000,
    spent: 142300,
    committed: 87500,
    remaining: 220200,
    period: '2025 Q1',
    status: 'healthy',
  },
];

const mockTransactions: BudgetTransaction[] = [
  {
    id: 'TXN-001',
    date: '2025-01-15',
    type: 'order',
    description: 'Bewehrungsstahl - PO-2025-001',
    projectName: 'Wohnquartier München',
    amount: -7200,
    balance: 242800,
  },
  {
    id: 'TXN-002',
    date: '2025-01-12',
    type: 'order',
    description: 'Zement - PO-2025-002',
    projectName: 'Büropark Frankfurt',
    amount: -2250,
    balance: 177750,
  },
  {
    id: 'TXN-003',
    date: '2025-01-10',
    type: 'allocation',
    description: 'Q1 Budget Allocation',
    projectName: 'Wohnquartier München',
    amount: 250000,
    balance: 250000,
  },
];

const mockCategorySpend: CategorySpend[] = [
  { category: 'Stahl & Bewehrung', budget: 120000, spent: 89500, percentage: 74.6 },
  { category: 'Beton & Mörtel', budget: 85000, spent: 67200, percentage: 79.1 },
  { category: 'Technische Gebäudeausrüstung', budget: 180000, spent: 142300, percentage: 79.1 },
  { category: 'Holz & Holzwerkstoffe', budget: 45000, spent: 23400, percentage: 52.0 },
  { category: 'Elektromaterial', budget: 65000, spent: 45600, percentage: 70.2 },
];

export const BudgetTrackingDialog: React.FC<BudgetTrackingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const eurFormatter = useMemo(
    () =>
      new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    []
  );

  const totalBudget = mockBudgetAllocations.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalSpent = mockBudgetAllocations.reduce((sum, b) => sum + b.spent, 0);
  const totalCommitted = mockBudgetAllocations.reduce((sum, b) => sum + b.committed, 0);
  const totalRemaining = mockBudgetAllocations.reduce((sum, b) => sum + b.remaining, 0);

  const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const committedPercent = totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0;
  const remainingPercent = totalBudget > 0 ? (totalRemaining / totalBudget) * 100 : 0;

  const flaggedBudgets = mockBudgetAllocations.filter((b) => b.status === 'critical' || b.status === 'warning');

  const getStatusColor = (status: BudgetAllocation['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-amber-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: BudgetAllocation['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Im Budget
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="default" className="bg-amber-100 text-amber-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Achtung
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Überschreitung
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col overflow-hidden">
        <DialogFrame
          defaultFullscreen
          showFullscreenToggle
          title={
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Budget-Tracking & Kostenkontrolle
            </div>
          }
          description="Überwachen Sie Budgets, Ausgaben und finanzielle Performance"
          headerActions={
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="projects">Projekte</TabsTrigger>
              <TabsTrigger value="categories">Kategorien</TabsTrigger>
              <TabsTrigger value="transactions">Transaktionen</TabsTrigger>
            </TabsList>
          }
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          }
        >



          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs">Gesamtbudget</CardDescription>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eurFormatter.format(totalBudget)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Alle Projekte</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs">Ausgegeben</CardDescription>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {eurFormatter.format(totalSpent)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((totalSpent / totalBudget) * 100).toFixed(1)}% verbraucht
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs">Gebunden</CardDescription>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {eurFormatter.format(totalCommitted)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Offene Bestellungen</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className="text-xs">Verfügbar</CardDescription>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={cn('text-2xl font-bold', totalRemaining > 0 ? 'text-green-600' : 'text-red-600')}>
                    {eurFormatter.format(totalRemaining)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((totalRemaining / totalBudget) * 100).toFixed(1)}% verbleibend
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Budget Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget-Auslastung Gesamt</CardTitle>
                <CardDescription>Verteilung der Budgetnutzung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ausgegeben</span>
                    <span className="font-medium">{eurFormatter.format(totalSpent)} ({((totalSpent / totalBudget) * 100).toFixed(1)}%)</span>
                  </div>
                  <Progress value={(totalSpent / totalBudget) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gebunden</span>
                    <span className="font-medium">{eurFormatter.format(totalCommitted)} ({((totalCommitted / totalBudget) * 100).toFixed(1)}%)</span>
                  </div>
                  <Progress value={(totalCommitted / totalBudget) * 100} className="h-2 [&>div]:bg-amber-500" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verfügbar</span>
                    <span className="font-medium text-green-600">{eurFormatter.format(totalRemaining)} ({((totalRemaining / totalBudget) * 100).toFixed(1)}%)</span>
                  </div>
                  <Progress value={(totalRemaining / totalBudget) * 100} className="h-2 [&>div]:bg-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Critical Alerts */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-900">
                  <AlertTriangle className="h-5 w-5" />
                  Budget-Warnungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockBudgetAllocations
                  .filter((b) => b.status === 'critical' || b.status === 'warning')
                  .map((budget) => (
                    <div key={budget.id} className="flex items-start justify-between rounded-lg border border-red-200 bg-white p-3">
                      <div>
                        <p className="text-sm font-medium text-red-900">{budget.projectName}</p>
                        <p className="text-xs text-red-700">
                          Verbleibend: {eurFormatter.format(budget.remaining)} von {eurFormatter.format(budget.totalBudget)}
                        </p>
                      </div>
                      {getStatusBadge(budget.status)}
                    </div>
                  ))}
                {mockBudgetAllocations.filter((b) => b.status === 'critical' || b.status === 'warning').length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    Alle Budgets im grünen Bereich
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget nach Projekt</CardTitle>
                <CardDescription>Detaillierte Aufschlüsselung pro Projekt</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projekt</TableHead>
                      <TableHead>Kostenstelle</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Ausgegeben</TableHead>
                      <TableHead className="text-right">Gebunden</TableHead>
                      <TableHead className="text-right">Verfügbar</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBudgetAllocations.map((budget) => {
                      const spentPercentage = (budget.spent / budget.totalBudget) * 100;
                      return (
                        <TableRow key={budget.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{budget.projectName}</p>
                              <p className="text-xs text-muted-foreground">{budget.period}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{budget.costCentre}</TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {eurFormatter.format(budget.totalBudget)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="text-sm font-medium text-blue-600">
                                {eurFormatter.format(budget.spent)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {spentPercentage.toFixed(1)}%
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm text-amber-600">
                            {eurFormatter.format(budget.committed)}
                          </TableCell>
                          <TableCell className="text-right">
                            <p className={cn('text-sm font-medium', budget.remaining > 0 ? 'text-green-600' : 'text-red-600')}>
                              {eurFormatter.format(budget.remaining)}
                            </p>
                          </TableCell>
                          <TableCell>{getStatusBadge(budget.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Budget Details per Project */}
            {mockBudgetAllocations.map((budget) => (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{budget.projectName}</CardTitle>
                      <CardDescription>{budget.costCentre} • {budget.period}</CardDescription>
                    </div>
                    {getStatusBadge(budget.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Ausgegeben</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {eurFormatter.format(budget.spent)}
                      </p>
                      <Progress value={(budget.spent / budget.totalBudget) * 100} className="h-1" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Gebunden</p>
                      <p className="text-lg font-semibold text-amber-600">
                        {eurFormatter.format(budget.committed)}
                      </p>
                      <Progress value={(budget.committed / budget.totalBudget) * 100} className="h-1 [&>div]:bg-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Verfügbar</p>
                      <p className={cn('text-lg font-semibold', budget.remaining > 0 ? 'text-green-600' : 'text-red-600')}>
                        {eurFormatter.format(budget.remaining)}
                      </p>
                      <Progress value={(budget.remaining / budget.totalBudget) * 100} className="h-1 [&>div]:bg-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Ausgaben nach Kategorie
                </CardTitle>
                <CardDescription>Budgetverteilung über Materialkategorien</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockCategorySpend.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{cat.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {eurFormatter.format(cat.spent)} von {eurFormatter.format(cat.budget)}
                        </p>
                      </div>
                      <Badge variant={cat.percentage > 90 ? 'destructive' : cat.percentage > 75 ? 'default' : 'secondary'}>
                        {cat.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget-Transaktionen</CardTitle>
                <CardDescription>Chronologische Übersicht aller Buchungen</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Projekt</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="text-sm">
                          {format(new Date(txn.date), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {txn.type === 'allocation' ? 'Zuweisung' : txn.type === 'order' ? 'Bestellung' : txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{txn.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{txn.projectName}</TableCell>
                        <TableCell className={cn('text-right text-sm font-medium', txn.amount < 0 ? 'text-red-600' : 'text-green-600')}>
                          {txn.amount < 0 ? (
                            <span className="flex items-center justify-end gap-1">
                              <TrendingDown className="h-3 w-3" />
                              {eurFormatter.format(Math.abs(txn.amount))}
                            </span>
                          ) : (
                            <span className="flex items-center justify-end gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {eurFormatter.format(txn.amount)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {eurFormatter.format(txn.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
      </DialogFrame>
    </Tabs>
    </Dialog>
  );
};
