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
  Box, Layers, FileText, Building2, Users, Settings,
  Plus, CheckCircle, XCircle, Download, Upload, Eye,
  RefreshCw, Link, Folder, Image, Archive, Clock
} from 'lucide-react';
import {
  Dialog,
  MultiWindowDialog,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import CadBimIntegrationService, {
  CadBimProvider,
  CadDrawing,
  BimModel,
  CadBimProject,
  CadBimSyncResult
} from '@/services/cadBimIntegrationService';

interface CadBimIntegrationProps {
  className?: string;
}

const CadBimIntegration: React.FC<CadBimIntegrationProps> = ({ className }) => {
  const { toast } = useToast();
  const [cadBimService] = useState(() => CadBimIntegrationService);
  const [providers, setProviders] = useState<CadBimProvider[]>([]);
  const [projects, setProjects] = useState<CadBimProject[]>([]);
  const [drawings, setDrawings] = useState<CadDrawing[]>([]);
  const [models, setModels] = useState<BimModel[]>([]);
  const [syncHistory, setSyncHistory] = useState<CadBimSyncResult[]>([]);
  const [stats, setStats] = useState({ 
    totalProviders: 0, 
    activeProviders: 0, 
    totalProjects: 0, 
    totalDrawings: 0, 
    totalModels: 0,
    totalFileSize: 0,
    lastSyncTime: null as Date | null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    providerId: '',
    clientId: '',
    clientSecret: '',
    apiKey: '',
    username: '',
    password: '',
    hubId: '',
    projectId: ''
  });

  const loadData = React.useCallback(() => {
    setProviders(cadBimService.getProviders());
    setProjects(cadBimService.getProjects());
    setDrawings(cadBimService.getDrawings());
    setModels(cadBimService.getModels());
    setSyncHistory(cadBimService.getSyncHistory());
    setStats(cadBimService.getCadBimStats());
  }, [cadBimService]);

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
        hubId: connectionForm.hubId || undefined,
        projectId: connectionForm.projectId || undefined
      };

      const success = await cadBimService.authenticateProvider(connectionForm.providerId, credentials);
      
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
          hubId: '',
          projectId: ''
        });

        toast({
          title: "Provider Connected",
          description: "CAD/BIM system has been connected successfully.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to the CAD/BIM provider.",
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
      const result = await cadBimService.syncProvider(providerId);
      
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProject) {
      toast({
        title: "Upload Error",
        description: "Please select a project and file to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await cadBimService.uploadDrawing(selectedProject, file, {
        units: 'm',
        discipline: 'architectural',
        phase: 'design'
      });

      if (result) {
        loadData();
        toast({
          title: "Upload Successful",
          description: `File "${file.name}" has been uploaded successfully.`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An error occurred during file upload.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'autocad':
        return <FileText className="h-4 w-4" />;
      case 'revit':
        return <Building2 className="h-4 w-4" />;
      case 'bim360':
        return <Layers className="h-4 w-4" />;
      case 'bentley':
        return <Box className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (provider: CadBimProvider) => {
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

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getFileTypeIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'dwg':
      case 'dxf':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'rvt':
      case 'ifc':
        return <Building2 className="h-4 w-4 text-green-600" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CAD/BIM Integration</h2>
          <p className="text-muted-foreground">
            Connect and sync with AutoCAD, Revit, BIM 360, and other construction tools
          </p>
        </div>
        <div className="flex gap-2">
          <MultiWindowDialog open={isConnecting} onOpenChange={setIsConnecting} modal={false}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Link className="h-4 w-4 mr-2" />
                Connect Provider
              </Button>
            </DialogTrigger>
            <DialogFrame
              title={
                <span className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Connect CAD/BIM Provider
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
                Connect your CAD/BIM software to sync drawings and models automatically
              </DialogDescription>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider-select">Provider *</Label>
                  <Select
                    value={connectionForm.providerId}
                    onValueChange={(value) => setConnectionForm(prev => ({ ...prev, providerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select CAD/BIM provider" />
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

                {(connectionForm.providerId === 'autocad_default' || 
                  connectionForm.providerId === 'revit_default' || 
                  connectionForm.providerId === 'bim360_default') && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="client-id">Client ID</Label>
                        <Input
                          id="client-id"
                          value={connectionForm.clientId}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, clientId: e.target.value }))}
                          placeholder="Autodesk app client ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="client-secret">Client Secret</Label>
                        <Input
                          id="client-secret"
                          type="password"
                          value={connectionForm.clientSecret}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                          placeholder="Autodesk app client secret"
                        />
                      </div>
                    </div>
                    {connectionForm.providerId === 'bim360_default' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hub-id">Hub ID</Label>
                          <Input
                            id="hub-id"
                            value={connectionForm.hubId}
                            onChange={(e) => setConnectionForm(prev => ({ ...prev, hubId: e.target.value }))}
                            placeholder="BIM 360 Hub ID"
                          />
                        </div>
                        <div>
                          <Label htmlFor="project-id">Project ID</Label>
                          <Input
                            id="project-id"
                            value={connectionForm.projectId}
                            onChange={(e) => setConnectionForm(prev => ({ ...prev, projectId: e.target.value }))}
                            placeholder="BIM 360 Project ID"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {connectionForm.providerId === 'bentley_default' && (
                  <>
                    <div>
                      <Label htmlFor="bentley-apikey">API Key</Label>
                      <Input
                        id="bentley-apikey"
                        value={connectionForm.apiKey}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Enter Bentley API key"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bentley-username">Username</Label>
                        <Input
                          id="bentley-username"
                          value={connectionForm.username}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Bentley username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bentley-password">Password</Label>
                        <Input
                          id="bentley-password"
                          type="password"
                          value={connectionForm.password}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Bentley password"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DialogFrame>
          </MultiWindowDialog>

          <div className="flex items-center gap-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select project for upload" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label htmlFor="file-upload">
              <Button variant="outline" disabled={!selectedProject || isUploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".dwg,.dxf,.rvt,.ifc,.pdf,.dgn,.skp"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-6 mb-6">
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
              <Folder className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Projects</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Drawings</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalDrawings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Models</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalModels}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Storage</span>
            </div>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalFileSize)}</div>
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
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="drawings">Drawings</TabsTrigger>
          <TabsTrigger value="models">3D Models</TabsTrigger>
          <TabsTrigger value="sync">Sync History</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Providers</CardTitle>
              <CardDescription>
                Manage your CAD/BIM software connections
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
                          Version {provider.version} • Formats: {provider.supportedFormats.join(', ')}
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

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synced Projects</CardTitle>
              <CardDescription>
                CAD/BIM projects from connected systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No projects synced yet. Connect a CAD/BIM provider and sync data.
                </p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Status: {project.status}</span>
                          <span>Start: {formatDateTime(project.startDate)}</span>
                          {project.location && <span>{project.location.city}, {project.location.country}</span>}
                          <span>{project.drawings.length} drawings, {project.models.length} models</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSyncStatusBadge(project.syncStatus)}>
                          {project.syncStatus.toUpperCase()}
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

        <TabsContent value="drawings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CAD Drawings</CardTitle>
              <CardDescription>
                2D drawings and plans from CAD systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {drawings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No drawings synced yet. Connect a CAD provider and sync data.
                </p>
              ) : (
                <div className="space-y-3">
                  {drawings.slice(0, 10).map((drawing) => (
                    <div
                      key={drawing.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileTypeIcon(drawing.format)}
                        <div className="flex-1">
                          <h4 className="font-medium">{drawing.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>v{drawing.version}</span>
                            <span>{drawing.format.toUpperCase()}</span>
                            <span>{formatFileSize(drawing.fileSize)}</span>
                            <span>{drawing.metadata.discipline}</span>
                            <span>Scale: {drawing.metadata.scale}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSyncStatusBadge(drawing.syncStatus)}>
                          {drawing.syncStatus.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {drawing.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
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

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>BIM Models</CardTitle>
              <CardDescription>
                3D models and BIM data from connected systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {models.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No 3D models synced yet. Connect a BIM provider and sync data.
                </p>
              ) : (
                <div className="space-y-3">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <h4 className="font-medium">{model.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>v{model.version}</span>
                            <span>{model.format.toUpperCase()}</span>
                            <span>{formatFileSize(model.fileSize)}</span>
                            <span>{model.elements.length} elements</span>
                            <span>Volume: {model.geometry.volume?.toLocaleString()} m³</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSyncStatusBadge(model.syncStatus)}>
                          {model.syncStatus.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {model.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
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

export default CadBimIntegration;
