import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Mail,
  Settings,
  Clock,
  Bell,
  Users,
  Calendar,
  Shield,
  Save,
  RefreshCw,
  TestTube,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import {
  EmailNotificationSettings as EmailSettings,
  UserEmailPreferences,
  EmailTemplate,
  EmailProvider,
  SystemEmailSettings
} from '@/types/email';
import { emailService } from '@/services/emailService';
import { EmailTemplateService } from '@/services/emailTemplateService';

interface EmailNotificationSettingsProps {
  userId: string;
  onSave?: (preferences: UserEmailPreferences) => void;
  className?: string;
}

const EmailNotificationSettings: React.FC<EmailNotificationSettingsProps> = ({
  userId,
  onSave,
  className = ""
}) => {
  const [preferences, setPreferences] = useState<UserEmailPreferences | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userPrefs = await emailService.getUserPreferences(userId);
      setPreferences(userPrefs);
    } catch (error) {
      console.error('Failed to load email preferences:', error);
      setError('Fehler beim Laden der E-Mail-Einstellungen');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPreferences();
    loadTemplates();
  }, [loadPreferences]);

  const loadTemplates = async () => {
    try {
      const allTemplates = await emailService.getTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const updated = await emailService.updateUserPreferences(userId, preferences);
      setPreferences(updated);
      onSave?.(updated);
    } catch (error) {
      console.error('Failed to save email preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;

    try {
      const validation = await emailService.validateEmail(testEmail);
      if (!validation.isValid) {
        setTestResult({ success: false, message: validation.errors.join(', ') });
        return;
      }

      // Send test email (mock implementation)
      setTestResult({ success: true, message: 'Test-E-Mail erfolgreich versendet!' });
    } catch (error) {
      setTestResult({ success: false, message: 'Fehler beim Versenden der Test-E-Mail' });
    }
  };

  const updateNotificationSetting = (key: keyof UserEmailPreferences['notifications'], value: boolean) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value
      }
    });
  };

  const updateReminderTiming = (times: number[]) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      reminderTiming: {
        ...preferences.reminderTiming,
        times
      }
    });
  };

  const addReminderTime = (minutes: number) => {
    if (!preferences || preferences.reminderTiming.times.includes(minutes)) return;
    
    const newTimes = [...preferences.reminderTiming.times, minutes].sort((a, b) => b - a);
    updateReminderTiming(newTimes);
  };

  const removeReminderTime = (minutes: number) => {
    if (!preferences) return;
    
    const newTimes = preferences.reminderTiming.times.filter(time => time !== minutes);
    updateReminderTiming(newTimes);
  };

  const formatReminderTime = (minutes: number): string => {
    if (minutes >= 1440) return `${Math.floor(minutes / 1440)} Tag(e)`;
    if (minutes >= 60) return `${Math.floor(minutes / 60)} Stunde(n)`;
    return `${minutes} Minute(n)`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Lade E-Mail-Einstellungen...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <h3 className="font-medium text-red-900">Fehler</h3>
          <p className="text-red-600">{error}</p>
        </div>
        <Button onClick={loadPreferences} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
        Keine E-Mail-Einstellungen gefunden.
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">E-Mail-Benachrichtigungen</h2>
          <p className="text-gray-600">Verwalten Sie Ihre E-Mail-Präferenzen und Benachrichtigungseinstellungen</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsTestDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Test-E-Mail
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

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Benachrichtigungen
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Erinnerungen
          </TabsTrigger>
          <TabsTrigger value="digest" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Zusammenfassung
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Präferenzen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Benachrichtigungstypen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Termineinladungen</Label>
                    <p className="text-sm text-gray-600">Benachrichtigungen bei neuen Termineinladungen</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.invitations}
                    onCheckedChange={(checked) => updateNotificationSetting('invitations', checked)}
                    aria-label="Termineinladungen"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Terminaktualisierungen</Label>
                    <p className="text-sm text-gray-600">Benachrichtigungen bei Änderungen an Terminen</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.updates}
                    onCheckedChange={(checked) => updateNotificationSetting('updates', checked)}
                    aria-label="Terminaktualisierungen"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Terminerinnerungen</Label>
                    <p className="text-sm text-gray-600">Automatische Erinnerungen vor Terminen</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.reminders}
                    onCheckedChange={(checked) => updateNotificationSetting('reminders', checked)}
                    aria-label="Terminerinnerungen"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Terminabsagen</Label>
                    <p className="text-sm text-gray-600">Benachrichtigungen bei Terminabsagen</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.cancellations}
                    onCheckedChange={(checked) => updateNotificationSetting('cancellations', checked)}
                    aria-label="Terminabsagen"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Nachfassungen</Label>
                    <p className="text-sm text-gray-600">Nachfass-E-Mails nach Terminen</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.followUps}
                    onCheckedChange={(checked) => updateNotificationSetting('followUps', checked)}
                    aria-label="Nachfassungen"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Erinnerungszeiten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Erinnerungen aktiviert</Label>
                <Switch
                  checked={preferences.reminderTiming.enabled}
                  onCheckedChange={(checked) => setPreferences({
                    ...preferences,
                    reminderTiming: { ...preferences.reminderTiming, enabled: checked }
                  })}
                />
              </div>

              {preferences.reminderTiming.enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label className="font-medium">Aktive Erinnerungszeiten</Label>
                    
                    {preferences.reminderTiming.times.length === 0 ? (
                      <p className="text-sm text-gray-600">Keine Erinnerungszeiten festgelegt</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {preferences.reminderTiming.times.map((time) => (
                          <Badge
                            key={time}
                            variant="secondary"
                            className="flex items-center gap-1 cursor-pointer hover:bg-red-100"
                            onClick={() => removeReminderTime(time)}
                          >
                            {formatReminderTime(time)}
                            <span className="ml-1 text-red-500">×</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Neue Erinnerungszeit hinzufügen</Label>
                    <div className="flex gap-2 flex-wrap">
                      {[15, 30, 60, 120, 1440, 2880].map((minutes) => (
                        <Button
                          key={minutes}
                          variant="outline"
                          size="sm"
                          onClick={() => addReminderTime(minutes)}
                          disabled={preferences.reminderTiming.times.includes(minutes)}
                          className="text-xs"
                        >
                          {formatReminderTime(minutes)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="digest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                E-Mail-Zusammenfassung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Zusammenfassung aktiviert</Label>
                  <p className="text-sm text-gray-600">Regelmäßige Übersicht über Ihre Termine</p>
                </div>
                <Switch
                  checked={preferences.digestSettings.enabled}
                  onCheckedChange={(checked) => setPreferences({
                    ...preferences,
                    digestSettings: { ...preferences.digestSettings, enabled: checked }
                  })}
                  aria-label="Zusammenfassung aktiviert"
                />
              </div>

              {preferences.digestSettings.enabled && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Häufigkeit</Label>
                      <Select
                        value={preferences.digestSettings.frequency}
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setPreferences({
                          ...preferences,
                          digestSettings: { ...preferences.digestSettings, frequency: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Täglich</SelectItem>
                          <SelectItem value="weekly">Wöchentlich</SelectItem>
                          <SelectItem value="monthly">Monatlich</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Uhrzeit</Label>
                      <Input
                        type="time"
                        value={preferences.digestSettings.time}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          digestSettings: { ...preferences.digestSettings, time: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Abgeschlossene Termine einbeziehen</Label>
                      <p className="text-sm text-gray-600">Auch vergangene Termine in der Übersicht anzeigen</p>
                    </div>
                    <Switch
                      checked={preferences.digestSettings.includeCompleted}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        digestSettings: { ...preferences.digestSettings, includeCompleted: checked }
                      })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Allgemeine Präferenzen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sprache</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value: 'de' | 'en') => setPreferences({
                      ...preferences,
                      language: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Zeitzone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => setPreferences({
                      ...preferences,
                      timezone: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Berlin">Europa/Berlin</SelectItem>
                      <SelectItem value="Europe/Vienna">Europa/Wien</SelectItem>
                      <SelectItem value="Europe/Zurich">Europa/Zürich</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>E-Mail-Adresse</Label>
                <Input
                  type="email"
                  value={preferences.email}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    email: e.target.value
                  })}
                  placeholder="ihre@email.de"
                />
                <p className="text-sm text-gray-600">
                  Diese E-Mail-Adresse wird für alle Benachrichtigungen verwendet
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogFrame
          width="max-w-3xl"
          title={<span>Test-E-Mail versenden</span>}
          description={<DialogDescription>Senden Sie eine Test-E-Mail, um Ihre Einstellungen zu überprüfen.</DialogDescription>}
          footer={<>
            <Button variant="outline" onClick={() => {
              setIsTestDialogOpen(false);
              setTestResult(null);
              setTestEmail('');
            }}>Abbrechen</Button>
            <Button onClick={handleTestEmail} disabled={!testEmail}>
              Test-E-Mail senden
            </Button>
          </>}
        >

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-Mail-Adresse</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
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
                  <AlertCircle className="h-4 w-4" />
                )}
                {testResult.message}
              </div>
            )}
          </div>
        </DialogFrame>
      </Dialog>
    </div>
  );
};

export default EmailNotificationSettings;
