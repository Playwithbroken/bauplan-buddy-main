import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import GlobalCommandMenu from '@/components/GlobalCommandMenu';
import GlobalSearchModal from '@/components/search/GlobalSearchModal';
import ShortcutsPanel from '@/components/shortcuts/ShortcutsPanel';
import SettingsDialog from '@/components/settings/SettingsDialog';

export function GlobalShortcutListener() {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { toast } = useToast();
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const emitAppEvent = useCallback((eventName: string, detail?: unknown) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }, []);

  const handleNavigation = useCallback((path: string) => {
    if (!path) return;
    navigate(path);
    toast({
      title: 'Navigation',
      description: `Zu ${path} gewechselt`,
      duration: 1500,
    });
  }, [navigate, toast]);

  const handleThemeToggle = useCallback(() => {
    toggleTheme();
    toast({
      title: 'Theme gewechselt',
      description: 'Erscheinungsbild wurde umgeschaltet',
      duration: 1500,
    });
  }, [toggleTheme, toast]);

  const handleCommandMenuOpen = useCallback(() => {
    setCommandMenuOpen(true);
  }, []);

  const handleProjectSearch = useCallback(() => {
    navigate('/projects', { state: { highlightSearch: true, source: 'shortcut' } });
  }, [navigate]);

  const handleCustomerSearch = useCallback(() => {
    navigate('/customers', { state: { highlightSearch: true, source: 'shortcut' } });
  }, [navigate]);

  const handleNewProject = useCallback(() => {
    emitAppEvent('app:new-project', { source: 'shortcut' });
    navigate('/projects', { state: { openCreate: true, source: 'shortcut' } });
  }, [emitAppEvent, navigate]);

  const handleNewQuote = useCallback(() => {
    emitAppEvent('app:new-quote', { source: 'shortcut' });
    navigate('/quotes', { state: { openCreate: true, source: 'shortcut' } });
  }, [emitAppEvent, navigate]);

  const handleNewInvoice = useCallback(() => {
    emitAppEvent('app:new-invoice', { source: 'shortcut' });
    navigate('/invoices', { state: { openCreate: true, source: 'shortcut' } });
  }, [emitAppEvent, navigate]);

  const handleSave = useCallback(() => {
    emitAppEvent('app:save', { source: 'shortcut' });
  }, [emitAppEvent]);

  const handleShowShortcuts = useCallback(() => {
    setShortcutsOpen(true);
  }, []);

  const handleShowSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd+K - Command Menu
      if (modKey && e.key === 'k') {
        e.preventDefault();
        handleCommandMenuOpen();
        return;
      }

      // Ctrl/Cmd+, - Settings
      if (modKey && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }

      // Ctrl/Cmd+/ - Show shortcuts
      if (modKey && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // Ctrl/Cmd+1-6 - Navigation
      if (modKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const routes = ['/dashboard', '/projects', '/calendar', '/chat', '/documents', '/analytics'];
        const index = parseInt(e.key) - 1;
        if (routes[index]) {
          handleNavigation(routes[index]);
        }
        return;
      }

      // F1 - Help (reserved for browser, but we can show shortcuts)
      if (e.key === 'F1') {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // ? - Show shortcuts
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // Ctrl/Cmd+S - Save
      if (modKey && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Ctrl/Cmd+P - New Project
      if (modKey && e.key === 'p') {
        e.preventDefault();
        handleNewProject();
        return;
      }

      // Ctrl/Cmd+Q - New Quote
      if (modKey && e.key === 'q') {
        e.preventDefault();
        handleNewQuote();
        return;
      }

      // Ctrl/Cmd+I - New Invoice
      if (modKey && e.key === 'i') {
        e.preventDefault();
        handleNewInvoice();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const eventHandlers = [
      { event: 'shortcut:toggle-theme', handler: handleThemeToggle },
      { event: 'shortcut:global-search', handler: handleCommandMenuOpen },
      { event: 'shortcut:command-menu', handler: handleCommandMenuOpen },
      { event: 'shortcut:project-search', handler: handleProjectSearch },
      { event: 'shortcut:customer-search', handler: handleCustomerSearch },
      { event: 'shortcut:new-project', handler: handleNewProject },
      { event: 'shortcut:new-quote', handler: handleNewQuote },
      { event: 'shortcut:new-invoice', handler: handleNewInvoice },
      { event: 'shortcut:save', handler: handleSave },
      { event: 'shortcut:toggle-sidebar', handler: () => {} },
      { event: 'shortcut:show-help', handler: () => {} },
      { event: 'shortcut:show-shortcuts', handler: handleShowShortcuts },
      { event: 'shortcut:show-settings', handler: handleShowSettings },
    ];

    eventHandlers.forEach(({ event, handler }) => {
      window.addEventListener(event, handler as EventListener);
    });

    const navigationEvents = [
      'shortcut:/dashboard',
      'shortcut:/projects',
      'shortcut:/calendar',
      'shortcut:/chat',
      'shortcut:/documents',
      'shortcut:/analytics',
    ];

    const navListeners = navigationEvents.map((eventName) => {
      const path = eventName.replace('shortcut:', '');
      const listener = () => handleNavigation(path);
      window.addEventListener(eventName, listener as EventListener);
      return { eventName, listener };
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      eventHandlers.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler as EventListener);
      });

      navListeners.forEach(({ eventName, listener }) => {
        window.removeEventListener(eventName, listener as EventListener);
      });
    };
  }, [
    handleCustomerSearch,
    handleCommandMenuOpen,
    handleNavigation,
    handleNewInvoice,
    handleNewProject,
    handleNewQuote,
    handleProjectSearch,
    handleSave,
    handleShowSettings,
    handleShowShortcuts,
    handleThemeToggle,
  ]);

  return (
    <>
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <GlobalCommandMenu open={commandMenuOpen} onOpenChange={setCommandMenuOpen} />
      <ShortcutsPanel open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onRequestShortcuts={() => setShortcutsOpen(true)}
      />
    </>
  );
}

export default GlobalShortcutListener;
