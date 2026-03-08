import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  FileText,
  Upload,
  BarChart3,
  FileType,
  Download,
  Mail,
  Archive,
  Plus,
  TrendingUp,
  Euro,
  Clock,
  AlertTriangle
} from 'lucide-react';

// Import all invoice components
import IncomingInvoiceManager from './IncomingInvoiceManager';
import InvoiceStatusManager from './InvoiceStatusManager';
import InvoiceTemplateManager from './InvoiceTemplateManager';
import InvoiceAnalyticsDashboard from './InvoiceAnalyticsDashboard';
import InvoiceExportManager from './InvoiceExportManager';
import CostAnalysisManager from './CostAnalysisManager';

export const ComprehensiveInvoiceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock overview data
  const overviewStats = {
    totalInvoices: 156,
    incomingInvoices: 89,
    outgoingInvoices: 67,
    totalRevenue: 245750.00,
    pendingAmount: 34560.00,
    overdueAmount: 8750.00,
    paidThisMonth: 89450.00,
    avgPaymentTime: 22,
    collectionRate: 94.5,
    monthlyGrowth: 12.8
  };

  const quickActions = [
    {
      title: 'Neue Rechnung erstellen',
      description: 'Erstellen Sie eine neue Ausgangsrechnung',
      icon: <Plus className="h-5 w-5" />,
      action: () => setActiveTab('outgoing'),
      color: 'bg-blue-500'
    },
    {
      title: 'Rechnung hochladen',
      description: 'Eingangsrechnung mit OCR verarbeiten',
      icon: <Upload className="h-5 w-5" />,
      action: () => setActiveTab('incoming'),
      color: 'bg-green-500'
    },
    {
      title: 'Rechnungen exportieren',
      description: 'PDF/Excel Export und E-Mail Versand',
      icon: <Download className="h-5 w-5" />,
      action: () => setActiveTab('export'),
      color: 'bg-purple-500'
    },
    {
      title: 'Analytics anzeigen',
      description: 'Finanzberichte und Kennzahlen',
      icon: <BarChart3 className="h-5 w-5" />,
      action: () => setActiveTab('analytics'),
      color: 'bg-orange-500'
    }
  ];

  const recentActivity = [
    {
      type: 'incoming',
      title: 'Eingangsrechnung ER-2024-000089 erhalten',
      subtitle: 'Müller Elektrik GmbH - €1,250.00',
      time: 'vor 2 Stunden',
      status: 'new'
    },
    {
      type: 'outgoing',
      title: 'Rechnung AR-2024-000067 versendet',
      subtitle: 'Schmidt Bau AG - €8,750.00',
      time: 'vor 4 Stunden',
      status: 'sent'
    },
    {
      type: 'payment',
      title: 'Zahlung erhalten',
      subtitle: 'Rechnung AR-2024-000065 - €4,200.00',
      time: 'vor 6 Stunden',
      status: 'paid'
    },
    {
      type: 'reminder',
      title: 'Zahlungserinnerung versendet',
      subtitle: 'Rechnung AR-2024-000062 - €2,150.00',
      time: 'vor 1 Tag',
      status: 'reminder'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <Upload className="h-4 w-4 text-green-600" />;
      case 'outgoing':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'payment':
        return <Euro className="h-4 w-4 text-green-600" />;
      case 'reminder':
        return <Mail className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="secondary">Neu</Badge>;
      case 'sent':
        return <Badge variant="outline">Versendet</Badge>;
      case 'paid':
        return <Badge variant="default">Bezahlt</Badge>;
      case 'reminder':
        return <Badge variant="destructive">Mahnung</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rechnungsmanagement</h1>
          <p className="text-muted-foreground">
            Umfassendes System für Ein- und Ausgangsrechnungen
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Eingänge
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileType className="h-4 w-4" />
            Vorlagen
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Kostenanalyse
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gesamte Rechnungen</p>
                    <p className="text-2xl font-bold">{overviewStats.totalInvoices}</p>
                    <p className="text-xs text-muted-foreground">
                      {overviewStats.incomingInvoices} Ein | {overviewStats.outgoingInvoices} Aus
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Euro className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gesamtumsatz</p>
                    <p className="text-2xl font-bold">€{overviewStats.totalRevenue.toLocaleString('de-DE')}</p>
                    <p className="text-xs text-green-600">+{overviewStats.monthlyGrowth}% diesen Monat</p>
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
                    <p className="text-2xl font-bold">€{overviewStats.pendingAmount.toLocaleString('de-DE')}</p>
                    <p className="text-xs text-muted-foreground">Ø {overviewStats.avgPaymentTime} Tage</p>
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
                    <p className="text-2xl font-bold">€{overviewStats.overdueAmount.toLocaleString('de-DE')}</p>
                    <p className="text-xs text-muted-foreground">{overviewStats.collectionRate}% Erfolgsquote</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{action.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity and Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Letzte Aktivitäten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Leistungsübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Diesen Monat bezahlt</span>
                    <span className="font-medium">€{overviewStats.paidThisMonth.toLocaleString('de-DE')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Durchschnittliche Zahlungszeit</span>
                    <span className="font-medium">{overviewStats.avgPaymentTime} Tage</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Erfolgsquote Inkasso</span>
                    <span className="font-medium text-green-600">{overviewStats.collectionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monatliches Wachstum</span>
                    <span className="font-medium text-green-600">+{overviewStats.monthlyGrowth}%</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button onClick={() => setActiveTab('analytics')} className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Detaillierte Analytics anzeigen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Incoming Invoices Tab */}
        <TabsContent value="incoming">
          <IncomingInvoiceManager />
        </TabsContent>

        {/* Outgoing Invoices Tab */}
        <TabsContent value="outgoing">
          <InvoiceStatusManager />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <InvoiceTemplateManager />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <InvoiceAnalyticsDashboard />
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs">
          <CostAnalysisManager />
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export">
          <InvoiceExportManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveInvoiceManager;