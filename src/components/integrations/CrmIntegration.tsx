import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Building2, Target, TrendingUp, Phone,
  Settings, Plus, CheckCircle, XCircle, Clock,
  DollarSign, Mail, RefreshCw, Eye, Link
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CrmIntegrationService, {
  CrmProvider,
  CrmContact,
  CrmAccount,
  CrmLead,
  CrmOpportunity,
  CrmSyncResult
} from '@/services/crmIntegrationService';

interface CrmIntegrationProps {
  className?: string;
}

const CrmIntegration: React.FC<CrmIntegrationProps> = ({ className }) => {
  const { toast } = useToast();
  const [crmService] = useState(() => CrmIntegrationService);
  const [providers, setProviders] = useState<CrmProvider[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [syncHistory, setSyncHistory] = useState<CrmSyncResult[]>([]);
  const [stats, setStats] = useState({
    totalProviders: 0,
    activeProviders: 0,
    totalContacts: 0,
    totalAccounts: 0,
    totalLeads: 0,
    totalOpportunities: 0,
    totalOpportunityValue: 0,
    lastSyncTime: null as Date | null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    providerId: '',
    clientId: '',
    clientSecret: '',
    apiKey: '',
    username: '',
    password: '',
    instanceUrl: ''
  });

  const loadData = React.useCallback(() => {
    setProviders(crmService.getProviders());
    setContacts(crmService.getContacts());
    setAccounts(crmService.getAccounts());
    setLeads(crmService.getLeads());
    setOpportunities(crmService.getOpportunities());
    setSyncHistory(crmService.getSyncHistory());
    setStats(crmService.getCrmStats());
  }, [crmService]);

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
        instanceUrl: connectionForm.instanceUrl || undefined
      };

      const success = await crmService.authenticateProvider(connectionForm.providerId, credentials);
      
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
          instanceUrl: ''
        });

        toast({
          title: "Provider Connected",
          description: "CRM provider has been connected successfully.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to the CRM provider.",
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
      const result = await crmService.syncProvider(providerId);
      
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
      case 'salesforce':
        return <Building2 className="h-4 w-4" />;
      case 'hubspot':
        return <Target className="h-4 w-4" />;
      case 'pipedrive':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (provider: CrmProvider) => {
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
          <h2 className="text-2xl font-bold tracking-tight">CRM Integration</h2>
          <p className="text-muted-foreground">
            Connect and sync with Salesforce, HubSpot, Pipedrive, and other CRM systems
          </p>
        </div>
        <Dialog open={isConnecting} onOpenChange={setIsConnecting}>
          <DialogTrigger asChild>
            <Button>
              <Link className="h-4 w-4 mr-2" />
              Connect CRM
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect CRM Provider</DialogTitle>
              <DialogDescription>
                Connect your CRM system to sync customer data automatically
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider-select">CRM Provider *</Label>
                <Select
                  value={connectionForm.providerId}
                  onValueChange={(value) => setConnectionForm(prev => ({ ...prev, providerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CRM provider" />
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

              {connectionForm.providerId === 'salesforce_default' && (
                <>
                  <div>
                    <Label htmlFor="sf-instance">Instance URL</Label>
                    <Input
                      id="sf-instance"
                      value={connectionForm.instanceUrl}
                      onChange={(e) => setConnectionForm(prev => ({ ...prev, instanceUrl: e.target.value }))}
                      placeholder="https://yourcompany.salesforce.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sf-username">Username</Label>
                      <Input
                        id="sf-username"
                        value={connectionForm.username}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Salesforce username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sf-password">Password</Label>
                      <Input
                        id="sf-password"
                        type="password"
                        value={connectionForm.password}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Salesforce password"
                      />
                    </div>
                  </div>
                </>
              )}

              {(connectionForm.providerId === 'hubspot_default' || connectionForm.providerId === 'pipedrive_default') && (
                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    value={connectionForm.apiKey}
                    onChange={(e) => setConnectionForm(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter API key"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConnecting(false)}>
                Cancel
              </Button>
              <Button onClick={handleConnectProvider}>
                Connect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
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
              <span className="text-sm font-medium">Contacts</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Opportunities</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalOpportunities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Pipeline Value</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOpportunityValue)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="sync">Sync History</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected CRM Systems</CardTitle>
              <CardDescription>
                Manage your CRM system connections
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
                          {provider.type.toUpperCase()} CRM System
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
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synced Contacts</CardTitle>
              <CardDescription>Contact data from connected CRM systems</CardDescription>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No contacts synced yet. Connect a CRM provider and sync data.
                </p>
              ) : (
                <div className="space-y-3">
                  {contacts.slice(0, 10).map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{contact.firstName} {contact.lastName}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                          {contact.title && <span>{contact.title}</span>}
                        </div>
                        {contact.accountName && (
                          <div className="text-sm text-muted-foreground">
                            Company: {contact.accountName}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSyncStatusBadge(contact.syncStatus)}>
                          {contact.syncStatus.toUpperCase()}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synced Accounts</CardTitle>
              <CardDescription>Company accounts from connected CRM systems</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No accounts synced yet. Connect a CRM provider and sync data.
                </p>
              ) : (
                <div className="space-y-3">
                  {accounts.slice(0, 10).map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{account.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Type: {account.type}</span>
                          {account.industry && <span>Industry: {account.industry}</span>}
                          {account.revenue && <span>Revenue: {formatCurrency(account.revenue)}</span>}
                        </div>
                        {account.website && (
                          <div className="text-sm text-muted-foreground">
                            Website: {account.website}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSyncStatusBadge(account.syncStatus)}>
                          {account.syncStatus.toUpperCase()}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Opportunities</CardTitle>
              <CardDescription>Active sales opportunities from CRM systems</CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No opportunities synced yet. Connect a CRM provider and sync data.
                </p>
              ) : (
                <div className="space-y-3">
                  {opportunities.slice(0, 10).map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{opportunity.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Stage: {opportunity.stage}</span>
                          <span>Probability: {opportunity.probability}%</span>
                          <span>Close: {formatDateTime(opportunity.closeDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(opportunity.amount)}</div>
                          <div className="text-sm text-muted-foreground">
                            {opportunity.isWon ? 'Won' : 'Open'}
                          </div>
                        </div>
                        <Badge variant={getSyncStatusBadge(opportunity.syncStatus)}>
                          {opportunity.syncStatus.toUpperCase()}
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
              <CardDescription>Recent sync operations and their results</CardDescription>
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

export default CrmIntegration;
