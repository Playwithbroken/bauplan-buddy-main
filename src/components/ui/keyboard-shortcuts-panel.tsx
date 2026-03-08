import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Keyboard, 
  Search, 
  Settings, 
  Download, 
  Upload, 
  Eye, 
  EyeOff,
  Zap,
  Info,
  ChevronRight,
  Command as CommandIcon
} from 'lucide-react';
import { useKeyboardShortcuts, usePowerUserMode } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/hooks/use-toast';
interface KeyboardShortcutsPanelProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export function KeyboardShortcutsPanel({ 
  trigger, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: KeyboardShortcutsPanelProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const {
    shortcutGroups,
    isEnabled,
    shouldShowHints,
    setEnabled,
    setShowHints,
    exportShortcuts,
    importShortcuts
  } = useKeyboardShortcuts();
  const { toast } = useToast();
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  const onOpenChange = isControlled ? controlledOnOpenChange : setOpen;
  const filteredGroups = shortcutGroups.map(group => ({
    ...group,
    shortcuts: group.shortcuts.filter(shortcut => {
      const matchesSearch = searchQuery === '' || 
        shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shortcut.key.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || group.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
  })).filter(group => group.shortcuts.length > 0);
  const handleExport = () => {
    const data = exportShortcuts();
    navigator.clipboard.writeText(data);
    toast({
      title: "Shortcuts exportiert",
      description: "Tastaturkürzel wurden in die Zwischenablage kopiert.",
    });
  };
  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (importShortcuts(text)) {
        toast({
          title: "Shortcuts importiert",
          description: "Tastaturkürzel wurden erfolgreich importiert.",
        });
      } else {
        throw new Error('Invalid format');
      }
    } catch (error) {
      toast({
        title: "Import fehlgeschlagen",
        description: "Ungültige Shortcut-Daten in der Zwischenablage.",
        variant: "destructive"
      });
    }
  };
  const renderKeyCombo = (keyCombo: string) => {
    const keys = keyCombo.split('+');
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Badge>
            {index < keys.length - 1 && <span className="text-xs text-muted-foreground">+</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Tastaturkürzel
          </DialogTitle>
          <DialogDescription>
            Alle verfügbaren Tastaturkürzel für eine effiziente Bedienung
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <Tabs defaultValue="shortcuts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shortcuts">Übersicht</TabsTrigger>
              <TabsTrigger value="settings">Einstellungen</TabsTrigger>
              <TabsTrigger value="power">Power User</TabsTrigger>
            </TabsList>
            <TabsContent value="shortcuts" className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Command>
                    <CommandInput
                      placeholder="Shortcuts durchsuchen..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                  </Command>
                </div>
                <div className="min-w-[150px]">
                  <select
                    className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">Alle Kategorien</option>
                    {shortcutGroups.map(group => (
                      <option key={group.category} value={group.category}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Shortcuts List */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {filteredGroups.map((group) => (
                    <Card key={group.category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{group.label}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {group.shortcuts.map((shortcut) => (
                            <div
                              key={shortcut.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{shortcut.description}</p>
                                <p className="text-xs text-muted-foreground">ID: {shortcut.id}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {!shortcut.enabled && (
                                  <Badge variant="secondary" className="text-xs">
                                    Deaktiviert
                                  </Badge>
                                )}
                                {renderKeyCombo(shortcut.key)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredGroups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Keyboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Keine Tastaturkürzel gefunden</p>
                      <p className="text-sm">Versuchen Sie einen anderen Suchbegriff</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Tastaturkürzel aktivieren</Label>
                    <p className="text-sm text-muted-foreground">
                      Globale Tastaturkürzel ein- oder ausschalten
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={setEnabled}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Hinweise anzeigen</Label>
                    <p className="text-sm text-muted-foreground">
                      Tastaturkürzel-Hinweise in der Benutzeroberfläche anzeigen
                    </p>
                  </div>
                  <Switch
                    checked={shouldShowHints}
                    onCheckedChange={setShowHints}
                  />
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-base">Import/Export</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleExport}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportieren
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleImport}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importieren
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Exportiert oder importiert alle Tastaturkürzel-Einstellungen
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-base">Statistiken</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                          {shortcutGroups.reduce((sum, group) => sum + group.shortcuts.length, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Gesamt Shortcuts</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                          {shortcutGroups.reduce((sum, group) => 
                            sum + group.shortcuts.filter(s => s.enabled).length, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Aktiviert</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="power" className="space-y-4">
              <PowerUserPanel />
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button onClick={() => onOpenChange?.(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function PowerUserPanel() {
  const { isEnabled, pressedKeys, keyCombo, suggestions } = usePowerUserMode();
  if (!isEnabled) {
    return (
      <div className="text-center py-8">
        <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium">Power User Modus</p>
        <p className="text-sm text-muted-foreground">
          Aktivieren Sie Tastaturkürzel um Power User Features zu nutzen
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Tastatureingabe
          </CardTitle>
          <CardDescription>
            Zeigt die aktuell gedrückten Tasten in Echtzeit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="min-h-[60px] p-4 border rounded-lg bg-muted/30">
              {pressedKeys.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Gedrückt:</span>
                  <div className="flex gap-1">
                    {pressedKeys.map((key, index) => (
                      <Badge key={index} variant="secondary" className="font-mono">
                        {key.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Drücken Sie eine Taste...
                </div>
              )}
            </div>
            {keyCombo && (
              <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <CommandIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Aktuelle Kombination:</span>
                  <Badge variant="outline" className="font-mono">
                    {keyCombo.toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Verfügbare Aktionen
            </CardTitle>
            <CardDescription>
              Shortcuts die mit der aktuellen Eingabe beginnen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.slice(0, 5).map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <span className="text-sm">{suggestion.description}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {suggestion.key.toUpperCase()}
                  </Badge>
                </div>
              ))}
              {suggestions.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{suggestions.length - 5} weitere Shortcuts verfügbar
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Modifier Keys</CardTitle>
          <CardDescription>
            Status der Modifier-Tasten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ctrl className="h-4 w-4" />
                <span className="text-sm">Ctrl</span>
              </div>
              <Badge variant={pressedKeys.includes('control') ? 'default' : 'outline'}>
                {pressedKeys.includes('control') ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Alt className="h-4 w-4" />
                <span className="text-sm">Alt</span>
              </div>
              <Badge variant={pressedKeys.includes('alt') ? 'default' : 'outline'}>
                {pressedKeys.includes('alt') ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shift className="h-4 w-4" />
                <span className="text-sm">Shift</span>
              </div>
              <Badge variant={pressedKeys.includes('shift') ? 'default' : 'outline'}>
                {pressedKeys.includes('shift') ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CommandIcon className="h-4 w-4" />
                <span className="text-sm">Meta</span>
              </div>
              <Badge variant={pressedKeys.includes('meta') ? 'default' : 'outline'}>
                {pressedKeys.includes('meta') ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default KeyboardShortcutsPanel;
