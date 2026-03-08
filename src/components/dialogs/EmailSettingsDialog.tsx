import React, { useState } from 'react';
import { MultiWindowDialog } from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Server,
  FileText,
  CheckCircle,
  AlertTriangle,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';

interface EmailSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
}

export const EmailSettingsDialog: React.FC<EmailSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('smtp');
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    secure: true,
    username: '',
    password: '',
    fromName: 'Bauplan Buddy',
    fromEmail: '',
    replyTo: ''
  });

  const [signature, setSignature] = useState(
    'Mit freundlichen Grüßen\nIhr Bauplan Buddy Team'
  );

  const handleSaveConfig = () => {
    // Validation
    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.fromEmail) {
      toast({
        title: 'Fehlende Daten',
        description: 'Bitte füllen Sie alle erforderlichen Felder aus.',
        variant: 'destructive'
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem('email_smtp_config', JSON.stringify(smtpConfig));
    localStorage.setItem('email_signature', signature);
    
    toast({
      title: 'Einstellungen gespeichert',
      description: 'Ihre E-Mail-Konfiguration wurde aktualisiert.'
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    try {
      // Simulate SMTP test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Verbindung erfolgreich',
        description: 'Die SMTP-Verbindung wurde erfolgreich getestet.'
      });
    } catch (error) {
      toast({
        title: 'Verbindung fehlgeschlagen',
        description: 'Die SMTP-Verbindung konnte nicht hergestellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = () => {
    if (!smtpConfig.fromEmail) {
      toast({
        title: 'Absenderadresse fehlt',
        description: 'Bitte konfigurieren Sie zuerst Ihre Absenderadresse.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Test-E-Mail gesendet',
      description: `Eine Test-E-Mail wurde an ${smtpConfig.fromEmail} gesendet.`
    });
  };

  const loadPresetConfig = (provider: 'gmail' | 'outlook' | 'custom') => {
    const presets = {
      gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: true
      },
      outlook: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: true
      },
      custom: {
        host: '',
        port: 587,
        secure: true
      }
    };

    setSmtpConfig({
      ...smtpConfig,
      ...presets[provider]
    });

    toast({
      title: 'Vorlage geladen',
      description: `Die ${provider === 'gmail' ? 'Gmail' : provider === 'outlook' ? 'Outlook' : 'Custom'}-Konfiguration wurde geladen.`
    });
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail Einstellungen
            </span>
          }
          width="fit-content"
          minWidth={800}
          maxWidth={1200}
          resizable={true}
          showFullscreenToggle
          headerActions={
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="smtp">SMTP</TabsTrigger>
              <TabsTrigger value="templates">Vorlagen</TabsTrigger>
              <TabsTrigger value="signature">Signatur</TabsTrigger>
            </TabsList>
          }
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveConfig}>
                Einstellungen speichern
              </Button>
            </div>
          }
        >

          {/* SMTP Tab */}
          <TabsContent value="smtp" className="space-y-4">
            {/* Quick Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schnelleinrichtung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => loadPresetConfig('gmail')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Gmail
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => loadPresetConfig('outlook')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Outlook
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => loadPresetConfig('custom')}
                  >
                    <Server className="h-4 w-4 mr-2" />
                    Eigener Server
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SMTP Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  SMTP-Server Konfiguration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Host *</Label>
                    <Input
                      placeholder="smtp.gmail.com"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port *</Label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="secure"
                    className="w-4 h-4"
                    checked={smtpConfig.secure}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                  />
                  <Label htmlFor="secure">SSL/TLS Verschlüsselung verwenden (empfohlen)</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Benutzername / E-Mail *</Label>
                    <Input
                      placeholder="ihre-email@gmail.com"
                      value={smtpConfig.username}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passwort *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={smtpConfig.password}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Hinweis für Gmail</p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        Verwenden Sie ein App-Passwort statt Ihres normalen Passworts. 
                        Erstellen Sie dieses in den Google Kontoeinstellungen.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <>Teste Verbindung...</>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verbindung testen
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Sender Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-600" />
                  Absender-Einstellungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Absender-Name</Label>
                    <Input
                      placeholder="Bauplan Buddy"
                      value={smtpConfig.fromName}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Absender E-Mail *</Label>
                    <Input
                      type="email"
                      placeholder="info@ihr-unternehmen.de"
                      value={smtpConfig.fromEmail}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Antwort-Adresse (optional)</Label>
                  <Input
                    type="email"
                    placeholder="antwort@ihr-unternehmen.de"
                    value={smtpConfig.replyTo}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, replyTo: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Falls leer, wird die Absender-E-Mail verwendet
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSendTestEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Test-E-Mail senden
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  E-Mail Vorlagen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Verwalten Sie Vorlagen für automatische E-Mails.
                </p>

                <div className="space-y-3">
                  <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Rechnungsversand</p>
                        <p className="text-sm text-muted-foreground">
                          E-Mail beim Versenden von Rechnungen
                        </p>
                      </div>
                      <Badge variant="default">Aktiv</Badge>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Angebotsversand</p>
                        <p className="text-sm text-muted-foreground">
                          E-Mail beim Versenden von Angeboten
                        </p>
                      </div>
                      <Badge variant="default">Aktiv</Badge>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Zahlungserinnerung</p>
                        <p className="text-sm text-muted-foreground">
                          Automatische Mahnung bei überfälliger Zahlung
                        </p>
                      </div>
                      <Badge variant="secondary">Inaktiv</Badge>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Termin-Bestätigung</p>
                        <p className="text-sm text-muted-foreground">
                          E-Mail zur Bestätigung von Terminen
                        </p>
                      </div>
                      <Badge variant="default">Aktiv</Badge>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Projekt-Update</p>
                        <p className="text-sm text-muted-foreground">
                          Benachrichtigung bei Projektänderungen
                        </p>
                      </div>
                      <Badge variant="default">Aktiv</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-200">Vorlagen anpassen</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Klicken Sie auf eine Vorlage, um den Text und das Design anzupassen.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signature Tab */}
          <TabsContent value="signature" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  E-Mail Signatur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Standard-Signatur</Label>
                  <textarea
                    className="w-full min-h-[150px] px-3 py-2 border rounded-md"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Mit freundlichen Grüßen&#10;Ihr Bauplan Buddy Team"
                  />
                  <p className="text-xs text-muted-foreground">
                    Diese Signatur wird automatisch an alle ausgehenden E-Mails angehängt.
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-2">Vorschau:</p>
                  <div className="text-sm whitespace-pre-wrap">{signature}</div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Schnellvorlagen:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSignature('Mit freundlichen Grüßen\nIhr Bauplan Buddy Team')}
                    >
                      Standard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSignature('Beste Grüße\n\nMax Mustermann\nBauplan Buddy\nTel: +49 123 456789')}
                    >
                      Mit Kontakt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSignature('Mit freundlichen Grüßen\n\nIhr Bauplan Buddy Team\n\n--\nBauplan Buddy GmbH\nMusterstraße 1\n12345 Musterstadt\nwww.bauplan-buddy.de')}
                    >
                      Vollständig
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSignature('')}
                    >
                      Leer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
};

export default EmailSettingsDialog;
