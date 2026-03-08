import React from "react";
import { MultiWindowDialog } from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Contrast, Download, Moon, Palette, Sun, Upload } from "lucide-react";
import type { Theme } from "@/services/themeService";

interface AutoSwitchTime {
  lightStart: string;
  darkStart: string;
}

type ThemeOption = {
  value: Theme;
  label: string;
  [key: string]: unknown;
};

interface ThemeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  currentIcon: React.ReactNode;
  currentThemeLabel: string;
  effectiveTheme: string;
  isDarkMode: boolean;
  contrastRatio: number;
  theme: Theme;
  availableThemes: ThemeOption[];
  onThemeChange: (theme: Theme) => void;
  renderThemeIcon: (theme: Theme) => React.ReactNode;
  autoSwitchEnabled: boolean;
  autoSwitchTime: AutoSwitchTime;
  onAutoSwitchToggle: (enabled: boolean) => void;
  onTimeChange: (type: "lightStart" | "darkStart", value: string) => void;
  previewColors: Array<[string, string]>;
  onExportConfig: () => void;
  onImportConfig: () => void;
}

export function ThemeSettingsDialog({
  open,
  onOpenChange,
  onClose,
  currentIcon,
  currentThemeLabel,
  effectiveTheme,
  isDarkMode,
  contrastRatio,
  theme,
  availableThemes,
  onThemeChange,
  renderThemeIcon,
  autoSwitchEnabled,
  autoSwitchTime,
  onAutoSwitchToggle,
  onTimeChange,
  previewColors,
  onExportConfig,
  onImportConfig,
}: ThemeSettingsDialogProps) {
  const footerContent = (
    <div className="flex w-full justify-end">
      <Button variant="secondary" onClick={onClose}>
        Schliessen
      </Button>
    </div>
  );

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        width="max-w-xl"
        title={
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme-Einstellungen
          </div>
        }
        description="Passen Sie Erscheinungsbild, Kontrast und Automatisierung an."
        onClose={onClose}
        footer={footerContent}
      >
        <div className="flex flex-col gap-6">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              Status
            </p>
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center gap-3">
                {currentIcon}
                <div>
                  <p className="text-sm font-medium">{currentThemeLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Effektiv: {effectiveTheme === "dark" ? "Dunkel" : "Hell"}
                  </p>
                </div>
              </div>
              <Badge
                variant={isDarkMode ? "secondary" : "outline"}
                className="flex items-center gap-1 text-xs"
              >
                <Contrast className="h-3 w-3" />
                {contrastRatio.toFixed(1)}:1
              </Badge>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              Theme Auswahl
            </p>
            <div className="space-y-2">
              <Label htmlFor="theme-select">Theme auswaehlen</Label>
              <Select
                value={theme}
                onValueChange={(value) => onThemeChange(value as Theme)}
              >
                <SelectTrigger id="theme-select">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Hell</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>Dunkel</span>
                    </div>
                  </SelectItem>
                  {/* Filter out duplicate entries if necessary or use availableThemes directly */}
                  {availableThemes
                    .filter((t) => t.value !== "light" && t.value !== "dark")
                    .map((themeOption) => (
                      <SelectItem
                        key={themeOption.value}
                        value={themeOption.value}
                      >
                        <div className="flex items-center gap-2">
                          {renderThemeIcon(themeOption.value)}
                          <span>{themeOption.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              Automatischer Wechsel
            </p>
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Zeitplaene aktivieren</p>
                  <p className="text-xs text-muted-foreground">
                    Wechselt automatisch zwischen Hell und Dunkel zu festen
                    Zeiten.
                  </p>
                </div>
                <Switch
                  size="md"
                  checked={autoSwitchEnabled}
                  onCheckedChange={onAutoSwitchToggle}
                />
              </div>
              {autoSwitchEnabled && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label
                      htmlFor="light-start"
                      className="flex items-center gap-1 text-xs font-medium"
                    >
                      <Sun className="h-3 w-3" />
                      Hell ab
                    </Label>
                    <Input
                      id="light-start"
                      type="time"
                      value={autoSwitchTime.lightStart}
                      onChange={(event) =>
                        onTimeChange("lightStart", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="dark-start"
                      className="flex items-center gap-1 text-xs font-medium"
                    >
                      <Moon className="h-3 w-3" />
                      Dunkel ab
                    </Label>
                    <Input
                      id="dark-start"
                      type="time"
                      value={autoSwitchTime.darkStart}
                      onChange={(event) =>
                        onTimeChange("darkStart", event.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              Farbuebersicht
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {previewColors.map(([name, color]) => (
                <div
                  key={name}
                  className="rounded-md border bg-background p-2 text-center"
                >
                  <div
                    className="mb-2 h-8 w-full rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  <p className="truncate text-xs font-medium" title={name}>
                    {name}
                  </p>
                  <p
                    className="text-[10px] text-muted-foreground"
                    title={color}
                  >
                    {color}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              Konfiguration
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportConfig}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportieren
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onImportConfig}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importieren
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Exportieren Sie Ihre Theme-Konfiguration, um sie mit
              Teammitgliedern zu teilen oder zu sichern.
            </p>
          </section>
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
}
