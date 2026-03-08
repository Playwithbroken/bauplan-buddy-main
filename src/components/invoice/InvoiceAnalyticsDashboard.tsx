import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  ResponsiveContainer
} from 'recharts';
import {
  Euro,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Target,
  BarChart3
} from 'lucide-react';

export interface InvoiceAnalyticsData {
  id: string;
  number: string;
  customerName: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  invoiceDate: string;
  dueDate: string;
  paidAt?: string;
  daysToPay?: number;
  isOverdue: boolean;
  overdueDays?: number;
  month: string;
  quarter: string;
  year: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  receivables: number;
  overdue: number;
  avgPaymentTime: number;
  collectionRate: number;
  monthlyGrowth: number;
  topCustomers: Array<{ name: string; amount: number; invoiceCount: number }>;
  paymentTrends: Array<{ month: string; revenue: number; paid: number; overdue: number }>;
  statusDistribution: Array<{ status: string; count: number; amount: number; percentage: number }>;
}

export const InvoiceAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [viewType, setViewType] = useState<'overview' | 'detailed' | 'trends'>('overview');

  // Mock analytics data
  const [mockInvoices] = useState<InvoiceAnalyticsData[]>([
    {
      id: 'INV-001',
      number: 'AR-2024-000001',
      customerName: 'Müller Bau GmbH',
      totalAmount: 15750.00,
      status: 'paid',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-14',
      paidAt: '2024-02-10',
      daysToPay: 26,
      isOverdue: false,
      month: '2024-01',
      quarter: '2024-Q1',
      year: 2024
    },
    {
      id: 'INV-002',
      number: 'AR-2024-000002',
      customerName: 'Schmidt Immobilien',
      totalAmount: 8420.50,
      status: 'overdue',
      invoiceDate: '2024-01-20',
      dueDate: '2024-02-19',
      isOverdue: true,
      overdueDays: 7,
      month: '2024-01',
      quarter: '2024-Q1',
      year: 2024
    },
    {
      id: 'INV-003',
      number: 'AR-2024-000003',
      customerName: 'Becker Renovierungen',
      totalAmount: 4230.00,
      status: 'paid',
      invoiceDate: '2024-01-10',
      dueDate: '2024-02-09',
      paidAt: '2024-01-28',
      daysToPay: 18,
      isOverdue: false,
      month: '2024-01',
      quarter: '2024-Q1',
      year: 2024
    },
    {
      id: 'INV-004',
      number: 'AR-2024-000004',
      customerName: 'Weber Architekten',
      totalAmount: 12500.00,
      status: 'sent',
      invoiceDate: '2024-02-01',
      dueDate: '2024-03-02',
      isOverdue: false,
      month: '2024-02',
      quarter: '2024-Q1',
      year: 2024
    },
    {
      id: 'INV-005',
      number: 'AR-2024-000005',
      customerName: 'Kraft Bauunternehmen',
      totalAmount: 22800.00,
      status: 'paid',
      invoiceDate: '2024-02-15',
      dueDate: '2024-03-17',
      paidAt: '2024-03-10',
      daysToPay: 24,
      isOverdue: false,
      month: '2024-02',
      quarter: '2024-Q1',
      year: 2024
    }
  ]);

  // Calculate comprehensive financial metrics
  const financialMetrics = useMemo((): FinancialMetrics => {
    const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidInvoices = mockInvoices.filter(inv => inv.status === 'paid');
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const receivables = mockInvoices
      .filter(inv => ['sent', 'viewed', 'partial'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const overdue = mockInvoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const avgPaymentTime = paidInvoices.reduce((sum, inv) => sum + (inv.daysToPay || 0), 0) / Math.max(paidInvoices.length, 1);
    const collectionRate = (paidAmount / totalRevenue) * 100;

    // Monthly trends
    const monthlyData = mockInvoices.reduce((acc, inv) => {
      const month = inv.month;
      if (!acc[month]) {
        acc[month] = { revenue: 0, paid: 0, overdue: 0 };
      }
      acc[month].revenue += inv.totalAmount;
      if (inv.status === 'paid') acc[month].paid += inv.totalAmount;
      if (inv.status === 'overdue') acc[month].overdue += inv.totalAmount;
      return acc;
    }, {} as Record<string, { revenue: number; paid: number; overdue: number }>);

    const paymentTrends = Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }),
      ...data
    }));

    // Top customers
    const customerData = mockInvoices.reduce((acc, inv) => {
      if (!acc[inv.customerName]) {
        acc[inv.customerName] = { amount: 0, invoiceCount: 0 };
      }
      acc[inv.customerName].amount += inv.totalAmount;
      acc[inv.customerName].invoiceCount += 1;
      return acc;
    }, {} as Record<string, { amount: number; invoiceCount: number }>);

    const topCustomers = Object.entries(customerData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Status distribution
    const statusData = mockInvoices.reduce((acc, inv) => {
      if (!acc[inv.status]) {
        acc[inv.status] = { count: 0, amount: 0 };
      }
      acc[inv.status].count += 1;
      acc[inv.status].amount += inv.totalAmount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const statusDistribution = Object.entries(statusData).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount,
      percentage: (data.count / mockInvoices.length) * 100
    }));

    // Simple monthly growth calculation (mock)
    const monthlyGrowth = 12.5; // Mock value

    return {
      totalRevenue,
      receivables,
      overdue,
      avgPaymentTime: Math.round(avgPaymentTime),
      collectionRate: Math.round(collectionRate),
      monthlyGrowth,
      topCustomers,
      paymentTrends,
      statusDistribution
    };
  }, [mockInvoices]);

  // Chart colors
  const CHART_COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    secondary: '#6b7280'
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rechnungs-Analytics</h1>
          <p className="text-muted-foreground">
            Finanzielle Kennzahlen und Zahlungsanalysen
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setDateRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Tage</SelectItem>
              <SelectItem value="30d">30 Tage</SelectItem>
              <SelectItem value="90d">90 Tage</SelectItem>
              <SelectItem value="1y">1 Jahr</SelectItem>
            </SelectContent>
          </Select>
          <Select value={viewType} onValueChange={(value: 'overview' | 'detailed' | 'trends') => setViewType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Übersicht</SelectItem>
              <SelectItem value="detailed">Detailliert</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview View */}
      {viewType === 'overview' && (
        <div className="space-y-6">
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Euro className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gesamtumsatz</p>
                    <p className="text-2xl font-bold">€{financialMetrics.totalRevenue.toLocaleString('de-DE')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ausstehend</p>
                    <p className="text-2xl font-bold">€{financialMetrics.receivables.toLocaleString('de-DE')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Überfällig</p>
                    <p className="text-2xl font-bold">€{financialMetrics.overdue.toLocaleString('de-DE')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Zahlungsquote</p>
                    <p className="text-2xl font-bold">{financialMetrics.collectionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ø Zahlungszeit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{financialMetrics.avgPaymentTime} Tage</div>
                <p className="text-sm text-muted-foreground">Durchschnittliche Zahlungsdauer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Monatliches Wachstum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">+{financialMetrics.monthlyGrowth}%</div>
                <p className="text-sm text-muted-foreground">Umsatzwachstum zum Vormonat</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Aktive Kunden
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{financialMetrics.topCustomers.length}</div>
                <p className="text-sm text-muted-foreground">Kunden mit Rechnungen</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Umsatzentwicklung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={financialMetrics.paymentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`€${value.toLocaleString('de-DE')}`, '']} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="1"
                      stroke={CHART_COLORS.primary} 
                      fill={CHART_COLORS.primary}
                      fillOpacity={0.3}
                      name="Umsatz"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="paid" 
                      stackId="2"
                      stroke={CHART_COLORS.success} 
                      fill={CHART_COLORS.success}
                      fillOpacity={0.3}
                      name="Bezahlt"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Status-Verteilung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={financialMetrics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status} (${percentage.toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {financialMetrics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Detailed View */}
      {viewType === 'detailed' && (
        <div className="space-y-6">
          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Top Kunden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead className="text-right">Umsatz</TableHead>
                    <TableHead className="text-right">Rechnungen</TableHead>
                    <TableHead className="text-right">Ø pro Rechnung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialMetrics.topCustomers.map((customer, index) => (
                    <TableRow key={customer.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <div className="font-medium">{customer.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{customer.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">{customer.invoiceCount}</TableCell>
                      <TableCell className="text-right">
                        €{(customer.amount / customer.invoiceCount).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Invoices Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Rechnungsdetails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Zahlungsziel</TableHead>
                    <TableHead className="text-right">Zahlungszeit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.slice(0, 10).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.number}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell className="text-right">
                        €{invoice.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' :
                          invoice.status === 'overdue' ? 'destructive' :
                          invoice.status === 'sent' ? 'secondary' : 'outline'
                        }>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                        </div>
                        {invoice.isOverdue && (
                          <div className="text-xs text-red-600">
                            {invoice.overdueDays} Tage überfällig
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.daysToPay ? (
                          <div className="text-sm">
                            {invoice.daysToPay} Tage
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">-</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends View */}
      {viewType === 'trends' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zahlungstrends Analyse</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={financialMetrics.paymentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`€${value.toLocaleString('de-DE')}`, '']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={CHART_COLORS.primary} 
                    strokeWidth={3}
                    name="Umsatz"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="paid" 
                    stroke={CHART_COLORS.success} 
                    strokeWidth={3}
                    name="Bezahlt"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="overdue" 
                    stroke={CHART_COLORS.danger} 
                    strokeWidth={3}
                    name="Überfällig"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monatliche Leistung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialMetrics.paymentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`€${value.toLocaleString('de-DE')}`, '']} />
                    <Bar dataKey="revenue" fill={CHART_COLORS.primary} name="Umsatz" />
                    <Bar dataKey="paid" fill={CHART_COLORS.success} name="Bezahlt" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kennzahlen Übersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Zahlungsquote</p>
                    <p className="text-sm text-muted-foreground">Anteil bezahlter Rechnungen</p>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{financialMetrics.collectionRate}%</div>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Ø Zahlungszeit</p>
                    <p className="text-sm text-muted-foreground">Durchschnittliche Bezahldauer</p>
                  </div>
                  <div className="text-2xl font-bold">{financialMetrics.avgPaymentTime} Tage</div>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Überfällige Rate</p>
                    <p className="text-sm text-muted-foreground">Anteil überfälliger Rechnungen</p>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {((financialMetrics.overdue / financialMetrics.totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceAnalyticsDashboard;