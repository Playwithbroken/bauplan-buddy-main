import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/hooks/useTheme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { ThemeMode } from "@/contexts/ThemeContext";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestShortcuts?: () => void;
}

const themeOptions: Array<{
  label: string;
  value: ThemeMode;
  description: string;
}> = [
  {
    label: "System",
    value: "system",
    description: "Folgt automatisch den Systemeinstellungen.",
  },
  {
    label: "Hell",
    value: "light",
    description: "Helles Erscheinungsbild mit klaren Kontrasten.",
  },
  {
    label: "Dunkel",
    value: "dark",
    description: "Dunkles Erscheinungsbild fuer wenig Licht.",
  },
  {
    label: "Hoher Kontrast (Hell)",
    value: "high-contrast",
    description: "Maximale Lesbarkeit mit hellem Hintergrund.",
  },
  {
    label: "Hoher Kontrast (Dunkel)",
    value: "high-contrast-dark",
    description: "Maximale Lesbarkeit mit dunklem Hintergrund.",
  },
];

const TAB_KEYS = [
  "appearance",
  "notifications",
  "shortcuts",
  "advanced",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

const isTabKey = (value: string | null): value is TabKey =>
  !!value && (TAB_KEYS as readonly string[]).includes(value);

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  onRequestShortcuts,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const activeTab: TabKey = isTabKey(urlTab) ? urlTab : "appearance";

  const { theme, setTheme, isHighContrast, setHighContrast } = useTheme();
  const {
    isEnabled: shortcutsEnabled,
    shouldShowHints,
    setEnabled: setShortcutsEnabled,
    setShowHints,
  } = useKeyboardShortcuts();

  const currentTheme = theme;

  const handleTabChange = (value: string) => {
    const nextTab: TabKey = isTabKey(value) ? value : "appearance";
    const nextSearch = new URLSearchParams(searchParams);
    nextSearch.set("tab", nextTab);
    setSearchParams(nextSearch, { replace: true });
  };

  const handleThemeChange = (value: string) => {
    setTheme(value as ThemeMode);
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        title="Einstellungen"
        description="Globale Einstellungen fuer Erscheinungsbild, Tastaturkuerzel und Benachrichtigungen."
        width="max-w-4xl"
        modal={false}
        onClose={() => onOpenChange(false)}
        footer={
          <div className="flex justify-end pt-2 border-t w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schliessen
            </Button>
          </div>
        }
      >
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex-1 overflow-hidden"
        >
          <TabsList className="flex w-full gap-2 overflow-x-auto">
            <TabsTrigger value="appearance">Erscheinungsbild</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="shortcuts">Tastaturkuerzel</TabsTrigger>
            <TabsTrigger value="advanced">Erweitert</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] mt-4 pr-1">
            <TabsContent value="appearance" className="space-y-4 m-0">
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Erscheinungsbild</h3>
                  <p className="text-sm text-muted-foreground">
                    Waehlen Sie das bevorzugte Theme und passen Sie Kontraste
                    oder Animationen an.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme-select">Theme</Label>
                  <Select
                    value={currentTheme}
                    onValueChange={handleThemeChange}
                  >
                    <SelectTrigger
                      id="theme-select"
                      aria-label="Theme auswaehlen"
                    >
                      <SelectValue placeholder="Theme auswaehlen" />
                    </SelectTrigger>
                    <SelectContent>
                      {themeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col text-left">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Hoher Kontrast</p>
                    <p className="text-xs text-muted-foreground">
                      Aktivieren Sie den Kontrastmodus ueber die Schaltflaeche
                      unten rechts oder per Tastaturkuerzel.
                    </p>
                  </div>
                  <Switch
                    aria-label="Hoher Kontrast aktivieren"
                    checked={isHighContrast}
                    onCheckedChange={setHighContrast}
                  />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 m-0">
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Benachrichtigungen</h3>
                  <p className="text-sm text-muted-foreground">
                    Steuern Sie, wann und wie Sie benachrichtigt werden.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">
                        Desktop-Benachrichtigungen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Zeigt System-Benachrichtigungen fuer wichtige Ereignisse
                        an.
                      </p>
                    </div>
                    <Switch aria-label="Desktop-Benachrichtigungen aktivieren" />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">
                        Sound-Benachrichtigungen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Spielt einen Ton bei neuen Benachrichtigungen ab.
                      </p>
                    </div>
                    <Switch aria-label="Sound-Benachrichtigungen aktivieren" />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">
                        E-Mail-Benachrichtigungen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sendet wichtige Updates zusaetzlich per E-Mail.
                      </p>
                    </div>
                    <Switch
                      aria-label="E-Mail-Benachrichtigungen aktivieren"
                      defaultChecked
                    />
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="shortcuts" className="space-y-4 m-0">
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Tastaturkuerzel</h3>
                  <p className="text-sm text-muted-foreground">
                    Steuern Sie globale Tastenkuerzel und kontextuelle Hinweise.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">
                        Shortcuts aktivieren
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aktiviert globale Tastenkuerzel fuer Navigation und
                        Aktionen.
                      </p>
                    </div>
                    <Switch
                      aria-label="Tastaturkuerzel aktivieren"
                      checked={shortcutsEnabled}
                      onCheckedChange={setShortcutsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">
                        Shortcut-Hinweise anzeigen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Blendet Hinweise in Tooltips oder Buttons ein, sofern
                        verfuegbar.
                      </p>
                    </div>
                    <Switch
                      aria-label="Shortcut-Hinweise aktivieren"
                      checked={shouldShowHints}
                      onCheckedChange={setShowHints}
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={() => {
                      onOpenChange(false);
                      onRequestShortcuts?.();
                    }}
                  >
                    Tastaturkuerzel verwalten
                  </Button>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 m-0">
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">
                    Erweiterte Einstellungen
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verwalten Sie Integrationen, Datenexporte und
                    Sicherheitsvorgaben.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Integrationen</p>
                    <p className="text-xs text-muted-foreground">
                      API-Schluessel und Webhooks konfigurieren Sie im Bereich
                      &ldquo;Deployment&rdquo;.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Datensicherung</p>
                    <p className="text-xs text-muted-foreground">
                      Exportieren Sie Projekte, Dokumente und Finanzdaten fuer
                      Backups oder Berichte.
                    </p>
                  </div>
                </div>
              </section>
            </TabsContent>
          </div>
        </Tabs>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export default SettingsDialog;
