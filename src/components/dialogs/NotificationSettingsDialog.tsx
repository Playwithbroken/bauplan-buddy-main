import React, { useState } from 'react';
import { MultiWindowDialog } from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Users
} from 'lucide-react';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationPreferences {
  email: {
    enabled: boolean;
    newInvoice: boolean;
    paymentReceived: boolean;
    paymentOverdue: boolean;
    quoteAccepted: boolean;
    projectUpdates: boolean;
    systemAlerts: boolean;
  };
  push: {
    enabled: boolean;
    appointmentReminder: boolean;
    taskDeadline: boolean;
    teamMessages: boolean;
    documentShared: boolean;
  };
  reminders: {
    invoiceDueDays: number;
    appointmentHours: number;
    taskDueDays: number;
    quoteFollowupDays: number;
  };
}

export const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('email');
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      newInvoice: true,
      paymentReceived: true,
      paymentOverdue: true,
      quoteAccepted: true,
      projectUpdates: true,
      systemAlerts: true
    },
    push: {
      enabled: false,
      appointmentReminder: true,
      taskDeadline: true,
      teamMessages: false,
      documentShared: false
    },
    reminders: {
      invoiceDueDays: 3,
      appointmentHours: 24,
      taskDueDays: 1,
      quoteFollowupDays: 7
    }
  });

  const handleSavePreferences = () => {
    // Save to localStorage
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    
    toast({
      title: 'Einstellungen gespeichert',
      description: 'Ihre Benachrichtigungseinstellungen wurden aktualisiert.'
    });
  };

  const handleTestNotification = (type: 'email' | 'push') => {
    if (type === 'email') {
      toast({
        title: 'Test-E-Mail gesendet',
        description: 'Eine Test-E-Mail wurde an Ihre Adresse gesendet.'
      });
    } else {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Bauplan Buddy Test', {
          body: 'Dies ist eine Test-Benachrichtigung.',
          icon: '/favicon.ico'
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Bauplan Buddy Test', {
              body: 'Dies ist eine Test-Benachrichtigung.',
              icon: '/favicon.ico'
            });
          }
        });
      } else {
        toast({
          title: 'Push-Benachrichtigungen nicht verfügbar',
          description: 'Ihr Browser unterstützt keine Push-Benachrichtigungen.',
          variant: 'destructive'
        });
      }
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Nicht unterstützt',
        description: 'Ihr Browser unterstützt keine Push-Benachrichtigungen.',
        variant: 'destructive'
      });
      return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      setPreferences({
        ...preferences,
        push: { ...preferences.push, enabled: true }
      });
      toast({
        title: 'Push-Benachrichtigungen aktiviert',
        description: 'Sie erhalten jetzt Browser-Benachrichtigungen.'
      });
    } else {
      toast({
        title: 'Berechtigung abgelehnt',
        description: 'Push-Benachrichtigungen wurden blockiert.',
        variant: 'destructive'
      });
    }
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Benachrichtigungseinstellungen
            </span>
          }
          headerActions={
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">E-Mail</TabsTrigger>
              <TabsTrigger value="push">Push</TabsTrigger>
              <TabsTrigger value="reminders">Erinnerungen</TabsTrigger>
            </TabsList>
          }
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSavePreferences}>
                Einstellungen speichern
              </Button>
            </div>
          }
          width="fit-content"
          minWidth={640}
          maxWidth={1024}
          resizable={true}
        >

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    E-Mail Benachrichtigungen
                  </CardTitle>
                  <Badge variant={preferences.email.enabled ? 'default' : 'secondary'}>
                    {preferences.email.enabled ? 'Aktiviert' : 'Deaktiviert'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">E-Mail Benachrichtigungen aktivieren</p>
                      <p className="text-sm text-muted-foreground">
                        Erhalten Sie wichtige Updates per E-Mail
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.email.enabled}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      email: { ...preferences.email, enabled: checked }
                    })}
                  />
                </div>

                {preferences.email.enabled && (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Benachrichtigen bei:
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <Label>Neue Rechnung erstellt</Label>
                        </div>
                        <Switch
                          checked={preferences.email.newInvoice}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            email: { ...preferences.email, newInvoice: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Label>Zahlung eingegangen</Label>
                        </div>
                        <Switch
                          checked={preferences.email.paymentReceived}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            email: { ...preferences.email, paymentReceived: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <Label>Zahlung überfällig</Label>
                        </div>
                        <Switch
                          checked={preferences.email.paymentOverdue}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            email: { ...preferences.email, paymentOverdue: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <Label>Angebot angenommen</Label>
                        </div>
                        <Switch
                          checked={preferences.email.quoteAccepted}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            email: { ...preferences.email, quoteAccepted: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <Label>Projekt-Updates</Label>
                        </div>
                        <Switch
                          checked={preferences.email.projectUpdates}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            email: { ...preferences.email, projectUpdates: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-orange-600" />
                          <Label>System-Benachrichtigungen</Label>
                        </div>
                        <Switch
                          checked={preferences.email.systemAlerts}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            email: { ...preferences.email, systemAlerts: checked }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleTestNotification('email')}
                >
                  Test-E-Mail senden
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Push Tab */}
          <TabsContent value="push" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                    Push-Benachrichtigungen
                  </CardTitle>
                  <Badge variant={preferences.push.enabled ? 'default' : 'secondary'}>
                    {preferences.push.enabled ? 'Aktiviert' : 'Deaktiviert'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!preferences.push.enabled ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800 dark:text-blue-200">
                            Aktivieren Sie Push-Benachrichtigungen
                          </p>
                          <p className="text-blue-700 dark:text-blue-300 mt-1">
                            Erhalten Sie wichtige Updates direkt in Ihrem Browser, auch wenn die App geschlossen ist.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={requestPushPermission}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Push-Benachrichtigungen aktivieren
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Push-Benachrichtigungen sind aktiviert
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        Benachrichtigen bei:
                      </p>

                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <Label>Termin-Erinnerungen</Label>
                        </div>
                        <Switch
                          checked={preferences.push.appointmentReminder}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            push: { ...preferences.push, appointmentReminder: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <Label>Fällige Aufgaben</Label>
                        </div>
                        <Switch
                          checked={preferences.push.taskDeadline}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            push: { ...preferences.push, taskDeadline: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <Label>Team-Nachrichten</Label>
                        </div>
                        <Switch
                          checked={preferences.push.teamMessages}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            push: { ...preferences.push, teamMessages: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <Label>Geteilte Dokumente</Label>
                        </div>
                        <Switch
                          checked={preferences.push.documentShared}
                          onCheckedChange={(checked) => setPreferences({
                            ...preferences,
                            push: { ...preferences.push, documentShared: checked }
                          })}
                        />
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleTestNotification('push')}
                    >
                      Test-Benachrichtigung senden
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Automatische Erinnerungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Konfigurieren Sie, wann Sie an wichtige Ereignisse erinnert werden möchten.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rechnungsfälligkeit</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={preferences.reminders.invoiceDueDays}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          reminders: { ...preferences.reminders, invoiceDueDays: parseInt(e.target.value) || 3 }
                        })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">Tage vor Fälligkeit</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Erinnern Sie mich {preferences.reminders.invoiceDueDays} Tage bevor eine Rechnung fällig wird
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Termin-Erinnerung</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="72"
                        value={preferences.reminders.appointmentHours}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          reminders: { ...preferences.reminders, appointmentHours: parseInt(e.target.value) || 24 }
                        })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">Stunden vorher</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Erinnern Sie mich {preferences.reminders.appointmentHours} Stunden vor einem Termin
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Aufgaben-Deadline</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="14"
                        value={preferences.reminders.taskDueDays}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          reminders: { ...preferences.reminders, taskDueDays: parseInt(e.target.value) || 1 }
                        })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">Tage vor Fälligkeit</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Erinnern Sie mich {preferences.reminders.taskDueDays} Tag(e) bevor eine Aufgabe fällig wird
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Angebots-Nachverfolgung</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={preferences.reminders.quoteFollowupDays}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          reminders: { ...preferences.reminders, quoteFollowupDays: parseInt(e.target.value) || 7 }
                        })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">Tage nach Versand</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Erinnern Sie mich {preferences.reminders.quoteFollowupDays} Tage nach Angebots-Versand zur Nachverfolgung
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg mt-4">
                  <div className="flex items-start gap-2">
                    <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-200">Tipp</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Erinnerungen werden per E-Mail und Push-Benachrichtigung gesendet, 
                        falls diese aktiviert sind.
                      </p>
                    </div>
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

export default NotificationSettingsDialog;
