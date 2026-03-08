import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, CreditCard, FileText, TrendingUp, Users,
  Settings, Plus, CheckCircle, XCircle, AlertCircle,
  Clock, DollarSign, Download, Eye, RefreshCw, Link
} from 'lucide-react';
import {
  Dialog,
  MultiWindowDialog,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import AccountingIntegrationService, {
  AccountingProvider,
  AccountingCustomer,
  AccountingInvoice,
  SyncResult
} from '@/services/accountingIntegrationService';

interface AccountingIntegrationProps {
  className?: string;
}

const AccountingIntegration: React.FC<AccountingIntegrationProps> = ({ className }) => {
  const { toast } = useToast();
  const [accountingService] = useState(() => AccountingIntegrationService);
  const [providers, setProviders] = useState<AccountingProvider[]>([]);
  const [customers, setCustomers] = useState<AccountingCustomer[]>([]);
  const [invoices, setInvoices] = useState<AccountingInvoice[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncResult[]>([]);
  const [stats, setStats] = useState({ 
    totalProviders: 0, 
    activeProviders: 0, 
    totalCustomers: 0, 
    totalInvoices: 0, 
    totalRevenue: 0,
    lastSyncTime: null as Date | null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AccountingProvider | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    providerId: '',
    clientId: '',
    clientSecret: '',
    apiKey: '',
    username: '',
    password: '',
    consultantNumber: '',
    mandantNumber: ''
  });

  const loadData = React.useCallback(() => {
    setProviders(accountingService.getProviders());
    setCustomers(accountingService.getCustomers());
    setInvoices(accountingService.getInvoices());
    setSyncHistory(accountingService.getSyncHistory());
    setStats(accountingService.getAccountingStats());
  }, [accountingService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnectProvider = async () => {
    if (!connectionForm.providerId) {
      toast({
        title: "Validation Error",
        description: "Please select a provider to connect.",
        variant: "destructive"
      });
      return;
    }

    try {
      const credentials = {
        clientId: connectionForm.clientId || undefined,
        clientSecret: connectionForm.clientSecret || undefined,
        apiKey: connectionForm.apiKey || undefined,
        username: connectionForm.username || undefined,
        password: connectionForm.password || undefined,
        consultantNumber: connectionForm.consultantNumber || undefined,
        mandantNumber: connectionForm.mandantNumber || undefined
      };

      const success = await accountingService.authenticateProvider(connectionForm.providerId, credentials);
      
      if (success) {
        loadData();
        setIsConnecting(false);
        setConnectionForm({
          providerId: '',
          clientId: '',
          clientSecret: '',
          apiKey: '',
          username: '',
          password: '',
          consultantNumber: '',
          mandantNumber: ''
        });

        toast({
          title: "Provider Connected",
          description: "Accounting software has been connected successfully.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to the accounting provider.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to the provider.",
        variant: "destructive"
      });
    }
  };

  const handleSyncProvider = async (providerId: string) => {
    setIsSyncing(true);
    try {
      const result = await accountingService.syncProvider(providerId);
      
      loadData();
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${result.recordsSucceeded} records.`,
        });
      } else {
        toast({
          title: "Sync Issues",
          description: `Sync completed with ${result.recordsFailed} failures.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "An error occurred during synchronization.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'datev':
        return <Building2 className="h-4 w-4" />;
      case 'lexware':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (provider: AccountingProvider) => {
    if (!provider.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    if (!provider.authenticated) {
      return <Badge variant="destructive">Not Connected</Badge>;
    }
    return <Badge variant="default">Connected</Badge>;
  };

  const getSyncStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      synced: 'default',
      pending: 'secondary',
      failed: 'destructive'
    };
    return variants[status] || 'outline';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accounting Integration</h2>
          <p className="text-muted-foreground">
            Connect and sync with DATEV, Lexware, and other accounting systems
          </p>
        </div>
        <MultiWindowDialog open={isConnecting} onOpenChange={setIsConnecting} modal={false}>
          <DialogTrigger asChild>
            <Button>
              <Link className="h-4 w-4 mr-2" />
              Connect Provider
            </Button>
          </DialogTrigger>
          <DialogFrame
            title={
              <span className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Connect Accounting Provider
              </span>
            }
            width="fit-content"
            minWidth={640}
            maxWidth={1024}
            resizable={true}
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setIsConnecting(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConnectProvider}>
                  Connect
                </Button>
              </div>
            }
          >
            <DialogDescription>
              Connect your accounting software to sync data automatically
            </DialogDescription>
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider-select">Provider *</Label>
                <Select
                  value={connectionForm.providerId}
                  onValueChange={(value) => setConnectionForm(prev => ({ ...prev, providerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select accounting provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.filter(p => !p.authenticated).map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          {getProviderIcon(provider.type)}
                          {provider.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {connectionForm.providerId === 'datev_default' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="consultant-number">Consultant Number</Label>
                      <Input
                        id="consultant-number"
                        value={connectionForm.consultantNumber}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, consultantNumber: e.target.value }))}
                        placeholder="Enter consultant number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mandant-number">Mandant Number</Label>
                      <Input
                        id="mandant-number"
                        value={connectionForm.mandantNumber}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, mandantNumber: e.target.value }))}
                        placeholder="Enter mandant number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="datev-username">Username</Label>
                      <Input
                        id="datev-username"
                        value={connectionForm.username}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="DATEV username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="datev-password">Password</Label>
                      <Input
                        id="datev-password"
                        type="password"
                        value={connectionForm.password}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="DATEV password"
                      />
                    </div>
                  </div>
                </>
              )}

              {connectionForm.providerId === 'lexware_default' && (
                <>
                  <div>
                    <Label htmlFor="lexware-apikey">API Key</Label>
                    <Input
                      id="lexware-apikey"
                      value={connectionForm.apiKey}
                      onChange={(e) => setConnectionForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter Lexware API key"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lexware-username">Username</Label>
                      <Input
                        id="lexware-username"
                        value={connectionForm.username}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Lexware username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lexware-password">Password</Label>
                      <Input
                        id="lexware-password"
                        type="password"
                        value={connectionForm.password}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Lexware password"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogFrame>
        </MultiWindowDialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Providers</span>
            </div>
            <div className="text-2xl font-bold">{stats.activeProviders}/{stats.totalProviders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Customers</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Invoices</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Last Sync</span>
            </div>
            <div className="text-sm font-bold">
              {stats.lastSyncTime ? formatDateTime(stats.lastSyncTime) : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="sync">Sync History</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Providers</CardTitle>
              <CardDescription>
                Manage your accounting software connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getProviderIcon(provider.type)}
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {provider.type.toUpperCase()} Integration
                        </p>
                        {provider.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {formatDateTime(provider.lastSync)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(provider)}
                      {provider.authenticated && (
                        <Button
                          onClick={() => handleSyncProvider(provider.id)}
                          variant="outline"
                          size="sm"
                          disabled={isSyncing}
                        >
                          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      <Button
                        onClick={() => setSelectedProvider(provider)}
                        variant="outline"
                        size="sm"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synced Customers</CardTitle>
              <CardDescription>
                Customer data from connected accounting systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No customers synced yet. Connect an accounting provider and sync data.
                </p>
              ) : (
                <div className="space-y-3">
                  {customers.slice(0, 10).map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{customer.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{customer.email}</span>
                          <span>{customer.address.city}, {customer.address.country}</span>
                          <span>Terms: {customer.paymentTerms} days</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSyncStatusBadge(customer.syncStatus)}>
                          {customer.syncStatus.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {customer.externalId}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synced Invoices</CardTitle>
              <CardDescription>
                Invoice data from connected accounting systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No invoices synced yet. Connect an accounting provider and sync data.
                </p>
              ) : (
                <div className="space-y-3">
                  {invoices.slice(0, 10).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Issued: {formatDateTime(invoice.issueDate)}</span>
                          <span>Due: {formatDateTime(invoice.dueDate)}</span>
                          <span>Customer: {invoice.customerId}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(invoice.total)}</div>
                          <div className="text-sm text-muted-foreground">{invoice.status}</div>
                        </div>
                        <Badge variant={getSyncStatusBadge(invoice.syncStatus)}>
                          {invoice.syncStatus.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization History</CardTitle>
              <CardDescription>
                Recent sync operations and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No sync history available.
                </p>
              ) : (
                <div className="space-y-3">
                  {syncHistory.slice(0, 15).map((sync, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {sync.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <h4 className="font-medium">
                            {providers.find(p => p.id === sync.providerId)?.name || sync.providerId}
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            {sync.entity} • {formatDateTime(sync.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {sync.recordsSucceeded}/{sync.recordsProcessed} records
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(sync.duration / 1000)}s duration
                        </div>
                        {sync.recordsFailed > 0 && (
                          <div className="text-sm text-red-600">
                            {sync.recordsFailed} failed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingIntegration;
