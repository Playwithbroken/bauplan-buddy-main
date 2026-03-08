import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MultiWindowDialog } from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Volume2,
  Mail,
  Monitor,
  Phone,
  Truck,
  ShieldAlert,
  Clock,
  Save,
  X,
} from "lucide-react";
import {
  NotificationService,
  NotificationSettings,
} from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";

type ReminderUnit = "minutes" | "hours" | "days";

const PREDEFINED_REMINDER_TIMES = [5, 15, 30, 60, 120, 360, 720, 1440, 2880];
const REMINDER_UNITS: { value: ReminderUnit; label: string }[] = [
  { value: "minutes", label: "Minuten" },
  { value: "hours", label: "Stunden" },
  { value: "days", label: "Tage" },
];
const MAX_CUSTOM_REMINDER_MINUTES = 7 * 24 * 60; // 7 days

interface NotificationSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsDialog = ({
  isOpen,
  onClose,
}: NotificationSettingsDialogProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(() =>
    NotificationService.getDefaultSettings()
  );
  const [originalSettings, setOriginalSettings] =
    useState<NotificationSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [customReminderValue, setCustomReminderValue] = useState("");
  const [customReminderUnit, setCustomReminderUnit] =
    useState<ReminderUnit>("minutes");
  const [customReminderError, setCustomReminderError] = useState<string | null>(
    null
  );

  const defaultSettings = useMemo(
    () => NotificationService.getDefaultSettings(),
    []
  );

  const areSettingsEqual = useCallback(
    (next: NotificationSettings, baseline: NotificationSettings) => {
      const normalize = (input: NotificationSettings) => ({
        ...input,
        reminderTimes: [...input.reminderTimes].sort((a, b) => a - b),
        lastUpdatedAt: undefined,
        lastUpdatedBy: (input.lastUpdatedBy ?? "").trim(),
      });

      const nextNormalized = normalize(next);
      const baselineNormalized = normalize(baseline);

      return (
        JSON.stringify(nextNormalized) === JSON.stringify(baselineNormalized)
      );
    },
    []
  );

  const sortedReminderTimes = useMemo(
    () => [...settings.reminderTimes].sort((a, b) => a - b),
    [settings.reminderTimes]
  );

  const quietHoursActive = useMemo(() => {
    if (!settings.quietHoursEnabled) {
      return false;
    }

    const parse = (value: string) => value.split(":").map(Number);
    const [startHour, startMinute] = parse(settings.quietHoursStart);
    const [endHour, endMinute] = parse(settings.quietHoursEnd);
    if (
      [startHour, startMinute, endHour, endMinute].some((value) =>
        Number.isNaN(value)
      )
    ) {
      return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes === endMinutes) {
      return false;
    }

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }, [
    settings.quietHoursEnabled,
    settings.quietHoursStart,
    settings.quietHoursEnd,
  ]);

  const lastUpdatedText = useMemo(() => {
    if (!settings.lastUpdatedAt) {
      return "Noch nicht gespeichert";
    }

    try {
      const formatted = new Intl.DateTimeFormat("de-DE", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(settings.lastUpdatedAt));
      return formatted;
    } catch {
      return settings.lastUpdatedAt;
    }
  }, [settings.lastUpdatedAt]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    try {
      const currentSettings = NotificationService.getSettings();
      setSettings(currentSettings);
      setOriginalSettings(currentSettings);
      setCustomReminderValue("");
      setCustomReminderError(null);

      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Die Einstellungen konnten nicht geladen werden.";
      toast({
        title: "Laden fehlgeschlagen",
        description: message,
        variant: "destructive",
      });
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (originalSettings) {
      setHasChanges(!areSettingsEqual(settings, originalSettings));
    } else {
      setHasChanges(false);
    }
  }, [settings, originalSettings, areSettingsEqual]);

  const handleSettingChange = useCallback(
    <K extends keyof NotificationSettings>(
      key: K,
      value: NotificationSettings[K]
    ) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleReminderTimeToggle = useCallback((minutes: number) => {
    setSettings((prev) => {
      const exists = prev.reminderTimes.includes(minutes);
      const nextTimes = exists
        ? prev.reminderTimes.filter((time) => time !== minutes)
        : [...prev.reminderTimes, minutes];

      return {
        ...prev,
        reminderTimes: [...nextTimes].sort((a, b) => a - b),
      };
    });
  }, []);

  const handleAddCustomReminder = useCallback(() => {
    const numericValue = Number(customReminderValue);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setCustomReminderError(
        "Bitte geben Sie eine gueltige Zahl groesser 0 ein."
      );
      return;
    }

    let minutes = numericValue;
    if (customReminderUnit === "hours") {
      minutes *= 60;
    } else if (customReminderUnit === "days") {
      minutes *= 1440;
    }

    if (minutes > MAX_CUSTOM_REMINDER_MINUTES) {
      setCustomReminderError("Bitte waehlen Sie einen Wert unter 7 Tagen.");
      return;
    }

    let duplicate = false;
    setSettings((prev) => {
      if (prev.reminderTimes.includes(minutes)) {
        duplicate = true;
        return prev;
      }

      return {
        ...prev,
        reminderTimes: [...prev.reminderTimes, minutes].sort((a, b) => a - b),
      };
    });

    if (duplicate) {
      setCustomReminderError("Diese Erinnerung ist bereits aktiv.");
      return;
    }

    setCustomReminderError(null);
    setCustomReminderValue("");
  }, [customReminderUnit, customReminderValue]);

  const handleResetDefaults = useCallback(() => {
    setSettings((prev) => ({
      ...defaultSettings,
      reminderTimes: [...defaultSettings.reminderTimes],
      lastUpdatedAt: prev.lastUpdatedAt,
      lastUpdatedBy: prev.lastUpdatedBy,
    }));
  }, [defaultSettings]);

  const handleSave = useCallback(async () => {
    try {
      const savedSettings = NotificationService.saveSettings(settings);
      setSettings(savedSettings);
      setOriginalSettings(savedSettings);

      if (
        savedSettings.browserNotifications &&
        notificationPermission !== "granted"
      ) {
        try {
          const permission =
            await NotificationService.requestNotificationPermission();
          setNotificationPermission(permission);
          if (permission === "denied") {
            toast({
              title: "Browserbenachrichtigungen blockiert",
              description:
                "Aktivieren Sie Benachrichtigungen in den Browsereinstellungen, um Desktop-Hinweise zu erhalten.",
              variant: "destructive",
            });
          } else if (permission === "granted") {
            toast({
              title: "Browserbenachrichtigungen aktiviert",
              description: "Sie erhalten jetzt Desktop-Benachrichtigungen.",
            });
          }
        } catch (permissionError) {
          toast({
            title: "Berechtigungsanfrage fehlgeschlagen",
            description:
              "Die Browserberechtigung konnte nicht angefragt werden.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Einstellungen gespeichert",
        description: "Benachrichtigungsprofil aktualisiert.",
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Benachrichtigungseinstellungen konnten nicht aktualisiert werden.";
      toast({
        title: "Speichern fehlgeschlagen",
        description: message,
        variant: "destructive",
      });
    }
  }, [settings, notificationPermission, toast, onClose]);

  const handleRequestPermission = useCallback(async () => {
    try {
      const permission =
        await NotificationService.requestNotificationPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast({
          title: "Browserbenachrichtigungen aktiviert",
          description: "Desktop-Benachrichtigungen sind nun zugelassen.",
        });
      } else if (permission === "denied") {
        toast({
          title: "Zugriff verweigert",
          description:
            "Aktivieren Sie Benachrichtigungen in Ihrem Browser und versuchen Sie es erneut.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Berechtigungsanfrage fehlgeschlagen",
        description:
          error instanceof Error
            ? error.message
            : "Bitte pruefen Sie Ihre Browserberechtigungen.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSendTestNotification = useCallback(async () => {
    try {
      await NotificationService.triggerTestNotification();
      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
      }
      toast({
        title: "Testbenachrichtigung gesendet",
        description: "Pruefen Sie Ihren Browser auf eine Vorschau.",
      });
    } catch (error) {
      toast({
        title: "Testbenachrichtigung fehlgeschlagen",
        description:
          error instanceof Error
            ? error.message
            : "Senden der Testbenachrichtigung ist fehlgeschlagen.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getReminderTimeText = (minutes: number): string => {
    if (minutes < 60) return `${minutes} Minuten`;
    if (minutes < 1440) return `${minutes / 60} Stunden`;
    return `${minutes / 1440} Tage`;
  };

  const isDefaultSettings = useMemo(
    () => areSettingsEqual(settings, defaultSettings),
    [settings, defaultSettings, areSettingsEqual]
  );

  return (
    <MultiWindowDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogFrame
        width="fit-content"
        minWidth={700}
        maxWidth={1100}
        showFullscreenToggle
        defaultFullscreen
        modal={false}
        title={
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="h-5 w-5" />
            <span className="truncate">Benachrichtigungseinstellungen</span>
          </div>
        }
        description="Konfigurieren Sie Ihre Erinnerungen und Benachrichtigungen fuer Termine"
        footer={
          <div className="w-full">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetDefaults}
                  disabled={isDefaultSettings}
                >
                  Zuruecksetzen
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSendTestNotification}
                  disabled={!settings.enabled}
                >
                  Testbenachrichtigung senden
                </Button>
              </div>
              <div className="min-w-0 text-sm text-muted-foreground sm:text-right">
                Zuletzt aktualisiert: {lastUpdatedText}
                {settings.lastUpdatedBy && ` durch ${settings.lastUpdatedBy}`}
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center justify-center sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Einstellungen speichern
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 px-4 pb-6 sm:space-y-8 sm:px-6">
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Grundlagen
            </p>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Grundeinstellungen</CardTitle>
                <CardDescription>
                  Alle Benachrichtigungen zentral steuern
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications-enabled">
                      Benachrichtigungen aktivieren
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Alle Erinnerungen und Benachrichtigungen ein- oder
                      ausschalten
                    </p>
                  </div>
                  <Switch
                    id="notifications-enabled"
                    checked={settings.enabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange("enabled", checked)
                    }
                    className="shrink-0"
                    disabled={!settings.enabled}
                  />
                </div>
                <div>
                  <Label htmlFor="updated-by">Bearbeiter (optional)</Label>
                  <Input
                    id="updated-by"
                    value={settings.lastUpdatedBy ?? ""}
                    onChange={(event) =>
                      handleSettingChange("lastUpdatedBy", event.target.value)
                    }
                    placeholder="Name fuer Protokolle"
                    className="mt-1"
                  />
                </div>
                {!settings.enabled && (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                    Benachrichtigungskanaele sind aktuell deaktiviert.
                    Aktivieren Sie sie oben, um weitere Optionen freizuschalten.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Erinnerungen
            </p>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Erinnerungszeiten</CardTitle>
                <CardDescription>
                  Waehlen Sie aus, wann Sie vor Terminen erinnert werden
                  moechten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {PREDEFINED_REMINDER_TIMES.map((minutes) => (
                    <div key={minutes} className="flex items-center gap-2">
                      <Switch
                        id={`reminder-${minutes}`}
                        checked={settings.reminderTimes.includes(minutes)}
                        onCheckedChange={() =>
                          handleReminderTimeToggle(minutes)
                        }
                        disabled={!settings.enabled}
                      />
                      <Label
                        htmlFor={`reminder-${minutes}`}
                        className="text-sm cursor-pointer"
                      >
                        {getReminderTimeText(minutes)} vorher
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <Label htmlFor="custom-reminder-value">
                      Eigene Erinnerung
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="custom-reminder-value"
                        type="number"
                        min={1}
                        value={customReminderValue}
                        onChange={(event) =>
                          setCustomReminderValue(event.target.value)
                        }
                        placeholder="z. B. 90"
                        className="w-full"
                        disabled={!settings.enabled}
                      />
                      <Select
                        value={customReminderUnit}
                        onValueChange={(value) =>
                          setCustomReminderUnit(value as ReminderUnit)
                        }
                        disabled={!settings.enabled}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Einheit" />
                        </SelectTrigger>
                        <SelectContent>
                          {REMINDER_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddCustomReminder}
                        disabled={!settings.enabled}
                      >
                        Hinzufuegen
                      </Button>
                    </div>
                    {customReminderError && (
                      <p className="mt-1 text-xs text-destructive">
                        {customReminderError}
                      </p>
                    )}
                  </div>
                </div>

                {sortedReminderTimes.length > 0 && (
                  <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3 dark:border-primary/30 dark:bg-primary/10">
                    <p className="text-sm font-medium text-primary">
                      Aktive Erinnerungen
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sortedReminderTimes.map((minutes) => (
                        <Badge
                          key={minutes}
                          variant="secondary"
                          className="bg-background"
                        >
                          <Clock className="mr-1 h-3 w-3" />
                          {getReminderTimeText(minutes)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Ruhezeiten
            </p>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ruhezeiten</CardTitle>
                <CardDescription>
                  Benachrichtigungen innerhalb bestimmter Zeitfenster
                  automatisch stummschalten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="quiet-hours-enabled">
                      Ruhezeiten aktivieren
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Browser- und Sound-Benachrichtigungen werden in diesem
                      Zeitraum pausiert
                    </p>
                  </div>
                  <Switch
                    id="quiet-hours-enabled"
                    checked={settings.quietHoursEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange("quietHoursEnabled", checked)
                    }
                    disabled={!settings.enabled}
                    className="shrink-0"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label htmlFor="quiet-hours-start">Start</Label>
                    <Input
                      id="quiet-hours-start"
                      type="time"
                      value={settings.quietHoursStart}
                      onChange={(event) =>
                        handleSettingChange(
                          "quietHoursStart",
                          event.target.value
                        )
                      }
                      disabled={!settings.quietHoursEnabled}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-hours-end">Ende</Label>
                    <Input
                      id="quiet-hours-end"
                      type="time"
                      value={settings.quietHoursEnd}
                      onChange={(event) =>
                        handleSettingChange("quietHoursEnd", event.target.value)
                      }
                      disabled={!settings.quietHoursEnabled}
                      className="mt-1"
                    />
                  </div>
                </div>
                {settings.quietHoursEnabled && (
                  <p className="text-xs text-muted-foreground">
                    {quietHoursActive
                      ? "Ruhezeiten sind aktuell aktiv."
                      : "Ruhezeiten sind derzeit nicht aktiv."}
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Kanaele & Eskalation
            </p>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Benachrichtigungstypen
                </CardTitle>
                <CardDescription>
                  Steuern Sie, welche Kanaele Ihr Team nutzt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                    Direkte Kanaele
                  </p>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          <Label htmlFor="browser-notifications">
                            Browser-Benachrichtigungen
                          </Label>
                          {notificationPermission === "denied" && (
                            <Badge variant="destructive" className="text-xs">
                              Blockiert
                            </Badge>
                          )}
                          {notificationPermission === "granted" && (
                            <Badge variant="secondary" className="text-xs">
                              Erlaubt
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Desktop-Benachrichtigungen anzeigen, auch wenn die App
                          nicht im Fokus ist
                        </p>
                      </div>
                      <Switch
                        id="browser-notifications"
                        checked={settings.browserNotifications}
                        onCheckedChange={(checked) =>
                          handleSettingChange("browserNotifications", checked)
                        }
                        disabled={!settings.enabled}
                        className="shrink-0"
                      />
                    </div>

                    {settings.browserNotifications &&
                      notificationPermission !== "granted" && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100">
                          <p className="font-medium">
                            Browser-Berechtigung erforderlich
                          </p>
                          <p className="mt-1">
                            Erlauben Sie Benachrichtigungen im Browser, um diese
                            Funktion zu aktivieren.
                          </p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleRequestPermission}
                            className="mt-3 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-50 dark:hover:bg-amber-900/60"
                          >
                            Berechtigung anfordern
                          </Button>
                        </div>
                      )}

                    <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <Label htmlFor="sms-notifications">
                            SMS an Einsatzteams
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            Beta
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Kritische Warnungen per SMS an Schicht- oder
                          Bereitschaftsteams senden
                        </p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) =>
                          handleSettingChange("smsNotifications", checked)
                        }
                        disabled={!settings.enabled}
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          <Label htmlFor="sound-enabled">
                            Benachrichtigungston
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Kurzen Ton bei neuen Benachrichtigungen abspielen
                        </p>
                      </div>
                      <Switch
                        id="sound-enabled"
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked) =>
                          handleSettingChange("soundEnabled", checked)
                        }
                        disabled={!settings.enabled}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                    Eskalation
                  </p>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4" />
                          <Label htmlFor="field-alert-escalation">
                            Eskalation bei Sicherheitsmeldungen
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Hochpriorisierte Sicherheitsmeldungen automatisch an
                          Verantwortliche eskalieren
                        </p>
                      </div>
                      <Switch
                        id="field-alert-escalation"
                        checked={settings.fieldAlertEscalation}
                        onCheckedChange={(checked) =>
                          handleSettingChange("fieldAlertEscalation", checked)
                        }
                        disabled={!settings.enabled}
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <Label htmlFor="delivery-delay-alerts">
                            Lieferverzoegerungen melden
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Push-Updates bei drohenden Lieferverzoegerungen oder
                          fehlenden Lieferscheinen erhalten
                        </p>
                      </div>
                      <Switch
                        id="delivery-delay-alerts"
                        checked={settings.deliveryDelayAlerts}
                        onCheckedChange={(checked) =>
                          handleSettingChange("deliveryDelayAlerts", checked)
                        }
                        disabled={!settings.enabled}
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <Label htmlFor="email-notifications">
                            E-Mail-Benachrichtigungen
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            Geplant
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          E-Mail-Erinnerungen fuer wichtige Termine (wird in
                          einer zukuenftigen Version verfuegbar sein)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Feature ist noch deaktiviert waehrend der Pilotphase.
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) =>
                          handleSettingChange("emailNotifications", checked)
                        }
                        disabled
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {settings.enabled && (
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                Uebersicht
              </p>
              <Card className="border border-dashed border-primary/40 bg-primary/5 text-sm dark:border-primary/30 dark:bg-primary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-primary">
                    Vorschau
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-primary dark:text-primary-foreground">
                  <p>
                    <strong>Aktive Erinnerungen:</strong>{" "}
                    {sortedReminderTimes.length === 0
                      ? "Keine"
                      : `${sortedReminderTimes.length} konfiguriert`}
                  </p>
                  <p>
                    <strong>Browser-Benachrichtigungen:</strong>{" "}
                    {settings.browserNotifications
                      ? "Aktiviert"
                      : "Deaktiviert"}
                  </p>
                  <p>
                    <strong>SMS an Team:</strong>{" "}
                    {settings.smsNotifications ? "Aktiviert" : "Deaktiviert"}
                  </p>
                  <p>
                    <strong>Sicherheits-Eskalation:</strong>{" "}
                    {settings.fieldAlertEscalation
                      ? "Aktiviert"
                      : "Deaktiviert"}
                  </p>
                  <p>
                    <strong>Lieferwarnungen:</strong>{" "}
                    {settings.deliveryDelayAlerts ? "Aktiviert" : "Deaktiviert"}
                  </p>
                  <p>
                    <strong>Benachrichtigungston:</strong>{" "}
                    {settings.soundEnabled ? "Aktiviert" : "Deaktiviert"}
                  </p>
                  <p>
                    <strong>Ruhezeiten:</strong>{" "}
                    {settings.quietHoursEnabled
                      ? `${settings.quietHoursStart} - ${settings.quietHoursEnd}`
                      : "Deaktiviert"}
                  </p>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export default NotificationSettingsDialog;
