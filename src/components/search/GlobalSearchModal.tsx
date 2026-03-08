import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Receipt,
  Calendar,
  MessageCircle,
  Users,
  FileImage,
  BarChart3,
  HelpCircle,
  Settings as SettingsIcon,
  Truck,
  Search,
  Plus,
} from 'lucide-react';
import SearchService from '@/services/searchService';

type StaticEntryGroup = 'navigation' | 'actions' | 'system';

interface StaticEntry {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  group: StaticEntryGroup;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  score: number;
}

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUP_LABELS: Record<StaticEntryGroup, string> = {
  navigation: 'Navigation',
  actions: 'Aktionen',
  system: 'System & Hilfe',
};

const MAX_RESULTS = 8;

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const emitAppEvent = useCallback((eventName: string) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { source: 'global-search' } }));
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const searchResults = SearchService.search(query);
    setResults(searchResults.slice(0, MAX_RESULTS));
  }, [open, query]);

  const staticEntries = useMemo<StaticEntry[]>(() => [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Ctrl+1', group: 'navigation', action: () => navigate('/dashboard') },
    { id: 'nav-projects', label: 'Projekte', icon: FolderOpen, shortcut: 'Ctrl+2', group: 'navigation', action: () => navigate('/projects') },
    { id: 'nav-quotes', label: 'Angebote', icon: FileText, group: 'navigation', action: () => navigate('/quotes') },
    { id: 'nav-invoices', label: 'Rechnungen', icon: Receipt, group: 'navigation', action: () => navigate('/invoices') },
    { id: 'nav-delivery-notes', label: 'Lieferscheine', icon: Truck, group: 'navigation', action: () => navigate('/delivery-notes') },
    { id: 'nav-calendar', label: 'Kalender', icon: Calendar, shortcut: 'Ctrl+3', group: 'navigation', action: () => navigate('/calendar') },
    { id: 'nav-chat', label: 'Chat', icon: MessageCircle, shortcut: 'Ctrl+4', group: 'navigation', action: () => navigate('/chat') },
    { id: 'nav-documents', label: 'Dokumente', icon: FileImage, shortcut: 'Ctrl+5', group: 'navigation', action: () => navigate('/documents') },
    { id: 'nav-analytics', label: 'Analytics', icon: BarChart3, shortcut: 'Ctrl+6', group: 'navigation', action: () => navigate('/analytics') },
    { id: 'nav-customers', label: 'Kunden', icon: Users, group: 'navigation', action: () => navigate('/customers') },

    // Quick actions
    {
      id: 'action-new-project',
      label: 'Neues Projekt erstellen',
      description: 'Öffnet den Projekt-Erstellungsfluss',
      icon: Plus,
      group: 'actions',
      shortcut: 'Ctrl+N',
      action: () => {
        emitAppEvent('app:new-project');
        navigate('/projects', { state: { openCreate: true, source: 'global-search' } });
        close();
      },
    },
    {
      id: 'action-new-quote',
      label: 'Neues Angebot erstellen',
      description: 'Startet die Angebotserstellung',
      icon: FileText,
      group: 'actions',
      shortcut: 'Ctrl+Shift+Q',
      action: () => {
        emitAppEvent('app:new-quote');
        navigate('/quotes', { state: { openCreate: true, source: 'global-search' } });
        close();
      },
    },
    {
      id: 'action-new-invoice',
      label: 'Neue Rechnung erstellen',
      description: 'Öffnet den Rechnungsdialog',
      icon: Receipt,
      group: 'actions',
      shortcut: 'Ctrl+Shift+I',
      action: () => {
        emitAppEvent('app:new-invoice');
        navigate('/invoices', { state: { openCreate: true, source: 'global-search' } });
        close();
      },
    },

    // System
    {
      id: 'system-help',
      label: 'Hilfe anzeigen',
      description: 'Öffnet das Hilfe-Center',
      icon: HelpCircle,
      group: 'system',
      shortcut: 'F1',
      action: () => {
        window.dispatchEvent(new CustomEvent('shortcut:show-help'));
        close();
      },
    },
    {
      id: 'system-shortcuts',
      label: 'Tastaturkürzel anzeigen',
      description: 'Alle Kurzbefehle anzeigen',
      icon: HelpCircle,
      group: 'system',
      shortcut: 'Ctrl+Shift+?',
      action: () => {
        window.dispatchEvent(new CustomEvent('shortcut:show-shortcuts'));
        close();
      },
    },
    {
      id: 'system-settings',
      label: 'Einstellungen',
      description: 'Öffnet die Anwendungseinstellungen',
      icon: SettingsIcon,
      group: 'system',
      shortcut: 'Ctrl+,',
      action: () => {
        window.dispatchEvent(new CustomEvent('shortcut:show-settings'));
        close();
      },
    },
  ], [close, emitAppEvent, navigate]);

  const groupedEntries = useMemo(() => {
    return staticEntries.reduce<Record<StaticEntryGroup, StaticEntry[]>>((acc, entry) => {
      acc[entry.group].push(entry);
      return acc;
    }, {
      navigation: [],
      actions: [],
      system: [],
    });
  }, [staticEntries]);

  const handleResultSelect = (result: SearchResult) => {
    navigate(result.url);
    close();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Suchen oder Befehl eingeben..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

        {results.length > 0 && (
          <>
            <CommandGroup heading="Suchergebnisse">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`${result.title} ${result.description}`}
                  onSelect={() => handleResultSelect(result)}
                >
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    <span className="text-xs text-muted-foreground">{result.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {query.trim().length === 0 && (
          <>
            {(Object.keys(groupedEntries) as StaticEntryGroup[]).map((group) => {
              const entries = groupedEntries[group];
              if (entries.length === 0) {
                return null;
              }
              return (
                <CommandGroup key={group} heading={GROUP_LABELS[group]}>
                  {entries.map((entry) => (
                    <CommandItem
                      key={entry.id}
                      value={entry.label}
                      onSelect={() => {
                        entry.action();
                        close();
                      }}
                    >
                      {entry.icon ? <entry.icon className="mr-2 h-4 w-4 text-muted-foreground" /> : null}
                      <div className="flex flex-col flex-1">
                        <span>{entry.label}</span>
                        {entry.description ? (
                          <span className="text-xs text-muted-foreground">{entry.description}</span>
                        ) : null}
                      </div>
                      {entry.shortcut ? (
                        <CommandShortcut>{entry.shortcut}</CommandShortcut>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearchModal;
