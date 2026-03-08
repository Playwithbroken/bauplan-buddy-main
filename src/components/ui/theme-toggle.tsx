import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sun,
  Moon,
  Monitor,
  Settings,
  Palette,
  ChevronDown,
} from 'lucide-react';
import { ThemeSettingsDialog } from '@/components/ui/theme-settings-dialog';
import { ThemeImportDialog } from '@/components/ui/theme-import-dialog';
import { useTheme, useThemeTransition } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { useThemeConfigTransfer } from '@/hooks/useThemeConfigTransfer';
import { useThemeAutoSwitch } from '@/hooks/useThemeAutoSwitch';
import { cn } from '@/lib/utils';
import type { Theme } from '@/services/themeService';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'switch';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const getThemeIcon = (themeName: string) => {
  switch (themeName) {
    case 'light':
      return <Sun className="h-4 w-4" />;
    case 'dark':
      return <Moon className="h-4 w-4" />;
    case 'system':
      return <Monitor className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
};

export function ThemeToggle({
  variant = 'dropdown',
  size = 'default',
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const {
    theme,
    effectiveTheme,
    isDarkMode,
    availableThemes,
    config,
    setAutoSwitch,
    exportConfig,
    importConfig,
    themeColors,
    contrastRatio,
  } = useTheme();
  const { transitionToTheme, isTransitioning } = useThemeTransition();
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const {
    autoSwitchTime,
    updateAutoSwitchTime,
    toggleAutoSwitch,
  } = useThemeAutoSwitch({
    autoSwitchEnabled: config.autoSwitch,
    switchTime: config.switchTime,
    setAutoSwitch,
  });
  const {
    manualImportText,
    manualImportError,
    isManualImportModalOpen,
    setManualImportModalOpen,
    handleManualImportTextChange,
    handleManualImportConfirm,
    handleManualImportFileUpload,
    handleManualFileButtonClick,
    handleImportConfig,
    handleExportConfig,
    resetManualImportState,
    fileInputRef,
  } = useThemeConfigTransfer({
    importConfig,
    exportConfig,
    toast,
    onImportSuccess: () => setShowSettings(false),
  });

  const currentThemeMeta = useMemo(
    () => availableThemes.find((themeOption) => themeOption.value === theme),
    [availableThemes, theme]
  );
  const previewColors = useMemo(() => Object.entries(themeColors).slice(0, 8), [themeColors]);
  const currentThemeLabel = currentThemeMeta?.label ?? (effectiveTheme === 'dark' ? 'Dunkel' : 'Hell');
  const quickToggleTarget: Theme = isDarkMode ? 'light' : 'dark';
  const quickToggleLabel = quickToggleTarget === 'dark' ? 'Dunkel' : 'Hell';
  const quickToggleTitle = `Zu ${quickToggleLabel} wechseln`;
  const currentIcon = effectiveTheme === 'dark' ? (
    <Moon className="h-4 w-4" />
  ) : (
    <Sun className="h-4 w-4" />
  );

  const handleThemeChange = (newTheme: Theme) => {
    transitionToTheme(newTheme);
    const label = availableThemes.find((option) => option.value === newTheme)?.label ?? newTheme;
    toast({
      title: 'Theme gewechselt',
      description: `${label} Modus aktiviert`,
      duration: 1800,
    });
  };

  const handleQuickToggle = () => {
    handleThemeChange(quickToggleTarget);
  };

  const handleAutoSwitchToggle = (enabled: boolean) => {
    toggleAutoSwitch(enabled);
    toast({
      title: enabled ? 'Automatischer Wechsel aktiviert' : 'Automatischer Wechsel deaktiviert',
      description: enabled
        ? `Wechselt um ${autoSwitchTime.lightStart} zu hell und um ${autoSwitchTime.darkStart} zu dunkel`
        : 'Themes muessen manuell gewechselt werden',
    });
  };

  const handleTimeChange = (type: 'lightStart' | 'darkStart', value: string) => {
    updateAutoSwitchTime(type, value);
  };
  if (variant === 'switch') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Sun className="h-4 w-4 text-muted-foreground" />
        <Switch
          style="default"
          size="sm"
          checked={isDarkMode}
          onCheckedChange={(checked) => handleThemeChange((checked ? 'dark' : 'light') as Theme)}
          disabled={isTransitioning}
          aria-label={quickToggleTitle}
        />
        <Moon className="h-4 w-4 text-muted-foreground" />
        {showLabel && (
          <span className="text-sm">{isDarkMode ? 'Dunkel' : 'Hell'}</span>
        )}
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleQuickToggle}
        disabled={isTransitioning}
        className={className}
        title={quickToggleTitle}
        aria-label={quickToggleTitle}
      >
        {currentIcon}
        {showLabel && (
          <span className="ml-2">{effectiveTheme === 'dark' ? 'Dunkel' : 'Hell'}</span>
        )}
      </Button>
    );
  }

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant="outline"
          size={size}
          onClick={handleQuickToggle}
          disabled={isTransitioning}
          className={cn('justify-start gap-2', showLabel ? 'px-3' : 'px-2')}
          title={quickToggleTitle}
          aria-label={quickToggleTitle}
        >
          {currentIcon}
          {showLabel && (
            <span>{effectiveTheme === 'dark' ? 'Dunkel' : 'Hell'}</span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={size}
              disabled={isTransitioning}
              className="px-2"
              aria-label="Weitere Theme-Optionen"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Palette className="h-4 w-4" />
              Theme auswaehlen
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableThemes.map((themeOption) => (
              <DropdownMenuItem
                key={themeOption.value}
                onSelect={() => handleThemeChange(themeOption.value as Theme)}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  {getThemeIcon(themeOption.value)}
                  {themeOption.label}
                </span>
                {theme === themeOption.value && (
                  <Badge variant="secondary" className="text-[10px]">Aktiv</Badge>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setShowSettings(true);
              }}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Erweiterte Einstellungen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ThemeSettingsDialog
        open={showSettings}
        onOpenChange={(open) => {
          setShowSettings(open);
          if (!open) {
            setManualImportModalOpen(false);
            resetManualImportState();
          }
        }}
        onClose={() => setShowSettings(false)}
        currentIcon={currentIcon}
        currentThemeLabel={currentThemeLabel}
        effectiveTheme={effectiveTheme}
        isDarkMode={isDarkMode}
        contrastRatio={contrastRatio}
        theme={theme}
        availableThemes={availableThemes}
        onThemeChange={handleThemeChange}
        renderThemeIcon={getThemeIcon}
        autoSwitchEnabled={config.autoSwitch}
        autoSwitchTime={autoSwitchTime}
        onAutoSwitchToggle={handleAutoSwitchToggle}
        onTimeChange={handleTimeChange}
        previewColors={previewColors}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
      />

      <ThemeImportDialog
        open={isManualImportModalOpen}
        onOpenChange={(open) => {
          setManualImportModalOpen(open);
          if (!open) {
            resetManualImportState();
          }
        }}
        manualImportText={manualImportText}
        manualImportError={manualImportError}
        onManualImportTextChange={handleManualImportTextChange}
        onManualImportConfirm={handleManualImportConfirm}
        onCancel={() => {
          setManualImportModalOpen(false);
          resetManualImportState();
        }}
        onManualFileButtonClick={handleManualFileButtonClick}
        onManualImportFileUpload={handleManualImportFileUpload}
        fileInputRef={fileInputRef}
      />
    </>
  );
}

export default ThemeToggle;





