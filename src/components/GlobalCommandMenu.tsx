import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Settings,
  Truck,
  Search
} from 'lucide-react';
import SearchService from '@/services/searchService';

interface GlobalCommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Entry = {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  group: 'Navigation' | 'Aktionen' | 'Hilfe' | 'Suchergebnisse';
  url?: string;
  description?: string;
};

type SearchResult = {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  score: number;
};

export default function GlobalCommandMenu({ open, onOpenChange }: GlobalCommandMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize close handler
  const handleOpenState = useCallback((nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [onOpenChange]);

  const handleClose = useCallback(() => {
    handleOpenState(false);
  }, [handleOpenState]);

  // Memoize navigation handler
  const handleNavigate = useCallback((url: string) => {
    navigate(url);
    handleClose();
  }, [navigate, handleClose]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open]);

  useEffect(() => {
    const onOpen = () => handleOpenState(true);

    window.addEventListener('shortcut:command-menu', onOpen as EventListener);
    window.addEventListener('shortcut:global-search', onOpen as EventListener);

    return () => {
      window.removeEventListener('shortcut:command-menu', onOpen as EventListener);
      window.removeEventListener('shortcut:global-search', onOpen as EventListener);
    };
  }, [handleOpenState]);

  // Debounced search for better performance
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const results = SearchService.search(searchQuery);
      setSearchResults(results.slice(0, 8));
    }, 150); // 150ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const staticEntries: Entry[] = useMemo(() => {
    const currentPath = location.pathname;
    return [
      // Navigation - mark current page
      { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Ctrl+1', action: () => handleNavigate('/dashboard'), group: 'Navigation' },
      { id: 'nav-projects', label: 'Projekte', icon: FolderOpen, shortcut: 'Ctrl+2', action: () => handleNavigate('/projects'), group: 'Navigation' },
      { id: 'nav-quotes', label: 'Angebote', icon: FileText, action: () => handleNavigate('/quotes'), group: 'Navigation' },
      { id: 'nav-invoices', label: 'Rechnungen', icon: Receipt, action: () => handleNavigate('/invoices'), group: 'Navigation' },
      { id: 'nav-delivery-notes', label: 'Lieferscheine', icon: Truck, action: () => handleNavigate('/delivery-notes'), group: 'Navigation' },
      { id: 'nav-calendar', label: 'Kalender', icon: Calendar, shortcut: 'Ctrl+3', action: () => handleNavigate('/calendar'), group: 'Navigation' },
      { id: 'nav-chat', label: 'Chat', icon: MessageCircle, shortcut: 'Ctrl+4', action: () => handleNavigate('/chat'), group: 'Navigation' },
      { id: 'nav-documents', label: 'Dokumente', icon: FileImage, shortcut: 'Ctrl+5', action: () => handleNavigate('/documents'), group: 'Navigation' },
      { id: 'nav-analytics', label: 'Analytics', icon: BarChart3, shortcut: 'Ctrl+6', action: () => handleNavigate('/analytics'), group: 'Navigation' },
      { id: 'nav-customers', label: 'Kunden', icon: Users, action: () => handleNavigate('/customers'), group: 'Navigation' },
      { id: 'nav-settings', label: 'Einstellungen', icon: Settings, action: () => handleNavigate('/settings'), group: 'Navigation' },

      // Aktionen
      { id: 'action-new-project', label: 'Neues Projekt erstellen', action: () => { window.dispatchEvent(new CustomEvent('shortcut:new-project')); handleClose(); }, group: 'Aktionen' },
      { id: 'action-new-quote', label: 'Neues Angebot erstellen', action: () => { window.dispatchEvent(new CustomEvent('shortcut:new-quote')); handleClose(); }, group: 'Aktionen' },
      { id: 'action-new-invoice', label: 'Neue Rechnung erstellen', action: () => { window.dispatchEvent(new CustomEvent('shortcut:new-invoice')); handleClose(); }, group: 'Aktionen' },

      // Hilfe/System
      { id: 'system-help', label: 'Hilfe anzeigen', icon: HelpCircle, shortcut: 'F1', action: () => { window.dispatchEvent(new CustomEvent('shortcut:show-help')); handleClose(); }, group: 'Hilfe' },
      { id: 'system-shortcuts', label: 'Tastaturkürzel anzeigen', icon: HelpCircle, shortcut: '?', action: () => { window.dispatchEvent(new CustomEvent('shortcut:show-shortcuts')); handleClose(); }, group: 'Hilfe' },
      { id: 'system-settings', label: 'Einstellungen', icon: Settings, shortcut: ',', action: () => { handleNavigate('/settings'); }, group: 'Hilfe' },
    ];
  }, [location.pathname, handleNavigate, handleClose]);

  // Combine static entries with search results
  const allEntries: Entry[] = useMemo(() => {
    const entries = [...staticEntries];
    
    // Add search results as entries
    searchResults.forEach((result) => {
      entries.push({
        id: `search-${result.id}`,
        label: result.title,
        icon: Search,
        description: result.description,
        action: () => handleNavigate(result.url),
        group: 'Suchergebnisse',
        url: result.url
      });
    });
    
    return entries;
  }, [staticEntries, searchResults, handleNavigate]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, Entry[]> = {
      'Navigation': [],
      'Aktionen': [],
      'Hilfe & System': [],
      'Suchergebnisse': []
    };

    allEntries.forEach(entry => {
      if (entry.group === 'Hilfe') {
        groups['Hilfe & System'].push(entry);
      } else {
        groups[entry.group].push(entry);
      }
    });

    return groups;
  }, [allEntries]);

  return (
    <CommandDialog open={open} onOpenChange={handleOpenState}>
      <CommandInput 
        placeholder="Suchen oder einen Befehl eingeben (Tipp: Verwenden Sie Ctrl+K)..." 
        autoFocus 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {searchQuery ? (
          <>
            <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
            {searchResults.length > 0 && (
              <CommandGroup heading="Suchergebnisse">
                {searchResults.map((result) => (
                  <CommandItem 
                    key={result.id} 
                    onSelect={() => handleNavigate(result.url)}
                    className="cursor-pointer"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{result.title}</div>
                      <div className="text-xs text-muted-foreground">{result.description}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        ) : (
          <>
            <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

            <CommandGroup heading="Navigation">
              {groupedEntries['Navigation'].map(e => (
                <CommandItem 
                  key={e.id} 
                  onSelect={() => { e.action(); }}
                  className="cursor-pointer"
                >
                  {e.icon && <e.icon className="mr-2 h-4 w-4" />}
                  <span>{e.label}</span>
                  {e.shortcut && <CommandShortcut>{e.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Aktionen">
              {groupedEntries['Aktionen'].map(e => (
                <CommandItem 
                  key={e.id} 
                  onSelect={() => { e.action(); }}
                  className="cursor-pointer"
                >
                  <span>{e.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Hilfe & System">
              {groupedEntries['Hilfe & System'].map(e => (
                <CommandItem 
                  key={e.id} 
                  onSelect={() => { e.action(); }}
                  className="cursor-pointer"
                >
                  {e.icon && <e.icon className="mr-2 h-4 w-4" />}
                  <span>{e.label}</span>
                  {e.shortcut && <CommandShortcut>{e.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
