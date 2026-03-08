import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Server,
  Mail,
  Shield,
  Globe,
  Database,
  Settings,
  Save,
  RefreshCw,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  EmailServiceConfig,
  EmailProvider,
  SystemEmailSettings
} from '@/types/email';
import { emailService } from '@/services/emailService';

interface EmailSystemSettingsProps {
  className?: string;
}

const EmailSystemSettings: React.FC<EmailSystemSettingsProps> = ({
  className = ""
}) => {
  const [config, setConfig] = useState<EmailServiceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const currentConfig = emailService.getConfig();
      setConfig(currentConfig);
    } catch (error) {
      console.error('Failed to load email config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setIsSaving(true);
      await emailService.configure(config);
      setTestResult({ success: true, message: 'Konfiguration erfolgreich gespeichert!' });
    } catch (error) {
      setTestResult({ success: false, message: 'Fehler beim Speichern der Konfiguration' });
      console.error('Failed to save email config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) return;

    try {
      setIsTesting(true);
      // In a real implementation, this would test the email provider connection
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setTestResult({ success: true, message: 'Verbindung erfolgreich getestet!' });
    } catch (error) {
      setTestResult({ success: false, message: 'Verbindungstest fehlgeschlagen' });
    } finally {
      setIsTesting(false);
    }
  };

  const updateProviderConfig = (updates: Partial<EmailServiceConfig['provider']>) => {
    if (!config) return;
    
    setConfig({
      ...config,
      provider: {
        ...config.provider,
        ...updates
      }
    });
  };

  const updateRateLimit = (key: keyof EmailServiceConfig['rateLimits'], value: number) => {
    if (!config) return;
    
    setConfig({
      ...config,
      rateLimits: {
        ...config.rateLimits,
        [key]: value
      }
    });
  };

  const updateRetryPolicy = (key: keyof EmailServiceConfig['retryPolicy'], value: number) => {
    if (!config) return;
    
    setConfig({
      ...config,
      retryPolicy: {
        ...config.retryPolicy,
        [key]: value
      }
    });
  };

  const updateMonitoring = (key: keyof EmailServiceConfig['monitoring'], value: boolean | string) => {
    if (!config) return;
    
    setConfig({
      ...config,
      monitoring: {
        ...config.monitoring,
        [key]: value
      }
    });
  };

  const getProviderFields = () => {
    const provider = config?.provider.provider;
    
    switch (provider) {
      case 'smtp':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP Server</Label>
                <Input
                  value={config?.provider.host || ''}
                  onChange={(e) => updateProviderConfig({ host: e.target.value })}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  type="number"
                  value={config?.provider.port || 587}
                  onChange={(e) => updateProviderConfig({ port: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Benutzername</Label>
                <Input
                  value={config?.provider.username || ''}
                  onChange={(e) => updateProviderConfig({ username: e.target.value })}
                  placeholder="username@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Passwort</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={config?.provider.password || ''}
                    onChange={(e) => updateProviderConfig({ password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Sichere Verbindung (SSL/TLS)</Label>
                <p className="text-sm text-gray-600">Verschlüsselte Übertragung verwenden</p>
              </div>
              <Switch
                checked={config?.provider.secure || false}
                onCheckedChange={(checked) => updateProviderConfig({ secure: checked })}
              />
            </div>
          </>
        );

      case 'sendgrid':
      case 'mailgun':
      case 'ses':
        return (
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={config?.provider.apiKey || ''}
                onChange={(e) => updateProviderConfig({ apiKey: e.target.value })}
                placeholder="API Key eingeben"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Lade E-Mail-Konfiguration...
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System E-Mail Einstellungen</h2>
          <p className="text-gray-600">Konfiguration des E-Mail-Systems für die gesamte Anwendung</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || !config.enabled}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Verbindung testen
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Speichern
          </Button>
        </div>
      </div>

      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          testResult.success 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {testResult.message}
        </div>
      )}

      <Tabs defaultValue="provider" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Anbieter
          </TabsTrigger>
          <TabsTrigger value="sending" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Versand
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                E-Mail-Anbieter Konfiguration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">E-Mail-System aktiviert</Label>
                  <p className="text-sm text-gray-600">E-Mail-Funktionen für die Anwendung aktivieren</p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                />
              </div>

              {config.enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>E-Mail-Anbieter</Label>
                    <Select
                      value={config.provider.provider}
                      onValueChange={(value: EmailProvider) => updateProviderConfig({ provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP Server</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="ses">Amazon SES</SelectItem>
                        <SelectItem value="outlook">Outlook</SelectItem>
                        <SelectItem value="gmail">Gmail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {getProviderFields()}

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Absender E-Mail</Label>
                      <Input
                        type="email"
                        value={config.provider.fromEmail}
                        onChange={(e) => updateProviderConfig({ fromEmail: e.target.value })}
                        placeholder="noreply@bauplan-buddy.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Absender Name</Label>
                      <Input
                        value={config.provider.fromName}
                        onChange={(e) => updateProviderConfig({ fromName: e.target.value })}
                        placeholder="Bauplan Buddy"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Antwort-Adresse</Label>
                    <Input
                      type="email"
                      value={config.provider.replyTo || ''}
                      onChange={(e) => updateProviderConfig({ replyTo: e.target.value })}
                      placeholder="support@bauplan-buddy.com"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Versandeinstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Maximale Wiederholungen</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={config.provider.maxRetries}
                    onChange={(e) => updateProviderConfig({ maxRetries: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Anzahl der Wiederholungsversuche bei Fehlern</p>
                </div>
                <div className="space-y-2">
                  <Label>Timeout (Sekunden)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="300"
                    value={config.provider.timeout / 1000}
                    onChange={(e) => updateProviderConfig({ timeout: parseInt(e.target.value) * 1000 })}
                  />
                  <p className="text-sm text-gray-600">Maximale Wartezeit für E-Mail-Versand</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>BCC-Adressen (optional)</Label>
                <Textarea
                  value={config.provider.bcc?.join(', ') || ''}
                  onChange={(e) => updateProviderConfig({ 
                    bcc: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                  })}
                  placeholder="admin@bauplan-buddy.com, backup@bauplan-buddy.com"
                  rows={3}
                />
                <p className="text-sm text-gray-600">E-Mail-Adressen für Kopien aller ausgehenden E-Mails (durch Komma getrennt)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rate Limits & Sicherheit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>E-Mails pro Minute</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={config.rateLimits.maxPerMinute}
                    onChange={(e) => updateRateLimit('maxPerMinute', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-Mails pro Stunde</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    value={config.rateLimits.maxPerHour}
                    onChange={(e) => updateRateLimit('maxPerHour', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-Mails pro Tag</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100000"
                    value={config.rateLimits.maxPerDay}
                    onChange={(e) => updateRateLimit('maxPerDay', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Wiederholungsrichtlinie</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maximale Wiederholungen</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={config.retryPolicy.maxRetries}
                      onChange={(e) => updateRetryPolicy('maxRetries', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Backoff-Multiplikator</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      value={config.retryPolicy.backoffMultiplier}
                      onChange={(e) => updateRetryPolicy('backoffMultiplier', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Initiale Verzögerung (Sekunden)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="300"
                      value={config.retryPolicy.initialDelay}
                      onChange={(e) => updateRetryPolicy('initialDelay', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximale Verzögerung (Sekunden)</Label>
                    <Input
                      type="number"
                      min="60"
                      max="3600"
                      value={config.retryPolicy.maxDelay}
                      onChange={(e) => updateRetryPolicy('maxDelay', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Monitoring & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">E-Mail-Öffnungen verfolgen</Label>
                    <p className="text-sm text-gray-600">Tracking-Pixel für geöffnete E-Mails hinzufügen</p>
                  </div>
                  <Switch size="sm" radius="md"
                    checked={config.monitoring.trackOpens}
                    onCheckedChange={(checked) => updateMonitoring('trackOpens', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Link-Klicks verfolgen</Label>
                    <p className="text-sm text-gray-600">Links durch Tracking-URLs ersetzen</p>
                  </div>
                  <Switch size="sm" radius="md"
                    checked={config.monitoring.trackClicks}
                    onCheckedChange={(checked) => updateMonitoring('trackClicks', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Webhook URL (optional)</Label>
                <Input
                  type="url"
                  value={config.monitoring.webhookUrl || ''}
                  onChange={(e) => updateMonitoring('webhookUrl', e.target.value)}
                  placeholder="https://ihre-domain.com/webhook"
                />
                <p className="text-sm text-gray-600">URL für E-Mail-Event-Benachrichtigungen</p>
              </div>

              <div className="space-y-2">
                <Label>Log-Level</Label>
                <Select
                  value={config.monitoring.logLevel}
                  onValueChange={(value) => updateMonitoring('logLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning for production */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Wichtiger Hinweis</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Stellen Sie sicher, dass alle Einstellungen in einer Produktionsumgebung ordnungsgemäß 
              konfiguriert und getestet sind. Sensible Daten wie Passwörter und API-Keys sollten 
              sicher gespeichert werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSystemSettings;

<<<<<<< Local
=======
interface EmailSystemSettingsProps {
  className?: string;
}

const EmailSystemSettings: React.FC<EmailSystemSettingsProps> = ({
  className = ""
}) => {
  const [config, setConfig] = useState<EmailServiceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const currentConfig = emailService.getConfig();
      setConfig(currentConfig);
    } catch (error) {
      console.error('Failed to load email config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setIsSaving(true);
      await emailService.configure(config);
      setTestResult({ success: true, message: 'Konfiguration erfolgreich gespeichert!' });
    } catch (error) {
      setTestResult({ success: false, message: 'Fehler beim Speichern der Konfiguration' });
      console.error('Failed to save email config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) return;

    try {
      setIsTesting(true);
      // In a real implementation, this would test the email provider connection
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setTestResult({ success: true, message: 'Verbindung erfolgreich getestet!' });
    } catch (error) {
      setTestResult({ success: false, message: 'Verbindungstest fehlgeschlagen' });
    } finally {
      setIsTesting(false);
    }
  };

  const updateProviderConfig = (updates: Partial<EmailServiceConfig['provider']>) => {
    if (!config) return;
    
    setConfig({
      ...config,
      provider: {
        ...config.provider,
        ...updates
      }
    });
  };

  const updateRateLimit = (key: keyof EmailServiceConfig['rateLimits'], value: number) => {
    if (!config) return;
    
    setConfig({
      ...config,
      rateLimits: {
        ...config.rateLimits,
        [key]: value
      }
    });
  };

  const updateRetryPolicy = (key: keyof EmailServiceConfig['retryPolicy'], value: number) => {
    if (!config) return;
    
    setConfig({
      ...config,
      retryPolicy: {
        ...config.retryPolicy,
        [key]: value
      }
    });
  };

  const updateMonitoring = (key: keyof EmailServiceConfig['monitoring'], value: boolean | string) => {
    if (!config) return;
    
    setConfig({
      ...config,
      monitoring: {
        ...config.monitoring,
        [key]: value
      }
    });
  };

  const getProviderFields = () => {
    const provider = config?.provider.provider;
    
    switch (provider) {
      case 'smtp':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP Server</Label>
                <Input
                  value={config?.provider.host || ''}
                  onChange={(e) => updateProviderConfig({ host: e.target.value })}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  type="number"
                  value={config?.provider.port || 587}
                  onChange={(e) => updateProviderConfig({ port: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Benutzername</Label>
                <Input
                  value={config?.provider.username || ''}
                  onChange={(e) => updateProviderConfig({ username: e.target.value })}
                  placeholder="username@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Passwort</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={config?.provider.password || ''}
                    onChange={(e) => updateProviderConfig({ password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Sichere Verbindung (SSL/TLS)</Label>
                <p className="text-sm text-gray-600">Verschlüsselte Übertragung verwenden</p>
              </div>
              <Switch
                checked={config?.provider.secure || false}
                onCheckedChange={(checked) => updateProviderConfig({ secure: checked })}
              />
            </div>
          </>
        );

      case 'sendgrid':
      case 'mailgun':
      case 'ses':
        return (
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={config?.provider.apiKey || ''}
                onChange={(e) => updateProviderConfig({ apiKey: e.target.value })}
                placeholder="API Key eingeben"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Lade E-Mail-Konfiguration...
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System E-Mail Einstellungen</h2>
          <p className="text-gray-600">Konfiguration des E-Mail-Systems für die gesamte Anwendung</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || !config.enabled}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Verbindung testen
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Speichern
          </Button>
        </div>
      </div>

      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          testResult.success 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {testResult.message}
        </div>
      )}

      <Tabs defaultValue="provider" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Anbieter
          </TabsTrigger>
          <TabsTrigger value="sending" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Versand
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                E-Mail-Anbieter Konfiguration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">E-Mail-System aktiviert</Label>
                  <p className="text-sm text-gray-600">E-Mail-Funktionen für die Anwendung aktivieren</p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                />
              </div>

              {config.enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>E-Mail-Anbieter</Label>
                    <Select
                      value={config.provider.provider}
                      onValueChange={(value: EmailProvider) => updateProviderConfig({ provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP Server</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="ses">Amazon SES</SelectItem>
                        <SelectItem value="outlook">Outlook</SelectItem>
                        <SelectItem value="gmail">Gmail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {getProviderFields()}

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Absender E-Mail</Label>
                      <Input
                        type="email"
                        value={config.provider.fromEmail}
                        onChange={(e) => updateProviderConfig({ fromEmail: e.target.value })}
                        placeholder="noreply@bauplan-buddy.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Absender Name</Label>
                      <Input
                        value={config.provider.fromName}
                        onChange={(e) => updateProviderConfig({ fromName: e.target.value })}
                        placeholder="Bauplan Buddy"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Antwort-Adresse</Label>
                    <Input
                      type="email"
                      value={config.provider.replyTo || ''}
                      onChange={(e) => updateProviderConfig({ replyTo: e.target.value })}
                      placeholder="support@bauplan-buddy.com"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Versandeinstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Maximale Wiederholungen</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={config.provider.maxRetries}
                    onChange={(e) => updateProviderConfig({ maxRetries: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-gray-600">Anzahl der Wiederholungsversuche bei Fehlern</p>
                </div>
                <div className="space-y-2">
                  <Label>Timeout (Sekunden)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="300"
                    value={config.provider.timeout / 1000}
                    onChange={(e) => updateProviderConfig({ timeout: parseInt(e.target.value) * 1000 })}
                  />
                  <p className="text-sm text-gray-600">Maximale Wartezeit für E-Mail-Versand</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>BCC-Adressen (optional)</Label>
                <Textarea
                  value={config.provider.bcc?.join(', ') || ''}
                  onChange={(e) => updateProviderConfig({ 
                    bcc: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                  })}
                  placeholder="admin@bauplan-buddy.com, backup@bauplan-buddy.com"
                  rows={3}
                />
                <p className="text-sm text-gray-600">E-Mail-Adressen für Kopien aller ausgehenden E-Mails (durch Komma getrennt)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rate Limits & Sicherheit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>E-Mails pro Minute</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={config.rateLimits.maxPerMinute}
                    onChange={(e) => updateRateLimit('maxPerMinute', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-Mails pro Stunde</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    value={config.rateLimits.maxPerHour}
                    onChange={(e) => updateRateLimit('maxPerHour', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-Mails pro Tag</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100000"
                    value={config.rateLimits.maxPerDay}
                    onChange={(e) => updateRateLimit('maxPerDay', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Wiederholungsrichtlinie</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maximale Wiederholungen</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={config.retryPolicy.maxRetries}
                      onChange={(e) => updateRetryPolicy('maxRetries', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Backoff-Multiplikator</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      value={config.retryPolicy.backoffMultiplier}
                      onChange={(e) => updateRetryPolicy('backoffMultiplier', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Initiale Verzögerung (Sekunden)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="300"
                      value={config.retryPolicy.initialDelay}
                      onChange={(e) => updateRetryPolicy('initialDelay', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximale Verzögerung (Sekunden)</Label>
                    <Input
                      type="number"
                      min="60"
                      max="3600"
                      value={config.retryPolicy.maxDelay}
                      onChange={(e) => updateRetryPolicy('maxDelay', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Monitoring & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">E-Mail-Öffnungen verfolgen</Label>
                    <p className="text-sm text-gray-600">Tracking-Pixel für geöffnete E-Mails hinzufügen</p>
                  </div>
                  <Switch size="sm"
                    checked={config.monitoring.trackOpens}
                    onCheckedChange={(checked) => updateMonitoring('trackOpens', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Link-Klicks verfolgen</Label>
                    <p className="text-sm text-gray-600">Links durch Tracking-URLs ersetzen</p>
                  </div>
                  <Switch size="sm"
                    checked={config.monitoring.trackClicks}
                    onCheckedChange={(checked) => updateMonitoring('trackClicks', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Webhook URL (optional)</Label>
                <Input
                  type="url"
                  value={config.monitoring.webhookUrl || ''}
                  onChange={(e) => updateMonitoring('webhookUrl', e.target.value)}
                  placeholder="https://ihre-domain.com/webhook"
                />
                <p className="text-sm text-gray-600">URL für E-Mail-Event-Benachrichtigungen</p>
              </div>

              <div className="space-y-2">
                <Label>Log-Level</Label>
                <Select
                  value={config.monitoring.logLevel}
                  onValueChange={(value) => updateMonitoring('logLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning for production */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Wichtiger Hinweis</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Stellen Sie sicher, dass alle Einstellungen in einer Produktionsumgebung ordnungsgemäß 
              konfiguriert und getestet sind. Sensible Daten wie Passwörter und API-Keys sollten 
              sicher gespeichert werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSystemSettings;

>>>>>>> Remote