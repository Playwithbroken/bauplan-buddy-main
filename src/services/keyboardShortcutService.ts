export interface KeyboardShortcut {
  id: string;
  key: string;
  description: string;
  category: ShortcutCategory;
  action: () => void;
  enabled: boolean;
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  preventDefault?: boolean;
  global?: boolean; // Works across all pages
}

export type ShortcutCategory = 
  | 'navigation' 
  | 'editing' 
  | 'view' 
  | 'search' 
  | 'actions' 
  | 'system';

export interface ShortcutGroup {
  category: ShortcutCategory;
  label: string;
  description: string;
  shortcuts: KeyboardShortcut[];
}

export interface KeyboardShortcutConfig {
  enabled: boolean;
  showHints: boolean;
  customShortcuts: Record<string, Partial<KeyboardShortcut>>;
}

export class KeyboardShortcutService {
  private static instance: KeyboardShortcutService;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private listeners: Map<string, Array<(shortcut: KeyboardShortcut) => void>> = new Map();
  private config: KeyboardShortcutConfig;
  private isActive = true;
  private pressedKeys = new Set<string>();

  private constructor() {
    this.config = this.loadConfig();
    this.setupEventListeners();
    this.registerDefaultShortcuts();
  }

  static getInstance(): KeyboardShortcutService {
    if (!KeyboardShortcutService.instance) {
      KeyboardShortcutService.instance = new KeyboardShortcutService();
    }
    return KeyboardShortcutService.instance;
  }

  private loadConfig(): KeyboardShortcutConfig {
    try {
      const stored = localStorage.getItem('keyboard-shortcuts-config');
      if (stored) {
        return { ...this.getDefaultConfig(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load keyboard shortcuts config:', error);
    }
    return this.getDefaultConfig();
  }

  private getDefaultConfig(): KeyboardShortcutConfig {
    return {
      enabled: true,
      showHints: true,
      customShortcuts: {}
    };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('keyboard-shortcuts-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save keyboard shortcuts config:', error);
    }
  }

  private setupEventListeners(): void {
    // Global keydown listener
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Prevent shortcuts when typing in input fields
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.config.enabled || !this.isActive) return;

    // Don't trigger shortcuts when typing in input fields
    if (this.isInputFocused(event.target as Element)) return;

    this.pressedKeys.add(event.key.toLowerCase());
    
    const shortcutKey = this.buildShortcutKey(event);
    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut && shortcut.enabled) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      
      try {
        shortcut.action();
        this.notifyShortcutUsed(shortcut);
      } catch (error) {
        console.error(`Error executing shortcut ${shortcut.id}:`, error);
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key.toLowerCase());
  }

  private handleFocusIn(event: Event): void {
    if (this.isInputFocused(event.target as Element)) {
      this.isActive = false;
    }
  }

  private handleFocusOut(): void {
    this.isActive = true;
  }

  private isInputFocused(element: Element): boolean {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];
    const isEditable = element.getAttribute('contenteditable') === 'true';
    
    return inputTypes.includes(tagName) || isEditable;
  }

  private buildShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }

  private registerDefaultShortcuts(): void {
    const defaultShortcuts: Omit<KeyboardShortcut, 'action'>[] = [
      // Navigation
      {
        id: 'nav-dashboard',
        key: 'ctrl+1',
        description: 'Dashboard öffnen',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        id: 'nav-projects',
        key: 'ctrl+2',
        description: 'Projekte öffnen',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        id: 'nav-calendar',
        key: 'ctrl+3',
        description: 'Kalender öffnen',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        id: 'nav-chat',
        key: 'ctrl+4',
        description: 'Chat öffnen',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        id: 'nav-documents',
        key: 'ctrl+5',
        description: 'Dokumente öffnen',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        id: 'nav-analytics',
        key: 'ctrl+6',
        description: 'Analytics öffnen',
        category: 'navigation',
        enabled: true,
        global: true
      },

      // Search
      {
        id: 'search-global',
        key: 'ctrl+k',
        description: 'Globale Suche',
        category: 'search',
        enabled: true,
        global: true
      },
      {
        id: 'search-projects',
        key: 'ctrl+shift+p',
        description: 'Projekte durchsuchen',
        category: 'search',
        enabled: true,
        global: true
      },
      {
        id: 'search-customers',
        key: 'ctrl+shift+c',
        description: 'Kunden durchsuchen',
        category: 'search',
        enabled: true,
        global: true
      },

      // Actions
      {
        id: 'action-new-project',
        key: 'ctrl+n',
        description: 'Neues Projekt erstellen',
        category: 'actions',
        enabled: true,
        global: true
      },
      {
        id: 'action-new-quote',
        key: 'ctrl+shift+q',
        description: 'Neues Angebot erstellen',
        category: 'actions',
        enabled: true,
        global: true
      },
      {
        id: 'action-new-invoice',
        key: 'ctrl+shift+i',
        description: 'Neue Rechnung erstellen',
        category: 'actions',
        enabled: true,
        global: true
      },
      {
        id: 'action-save',
        key: 'ctrl+s',
        description: 'Speichern',
        category: 'actions',
        enabled: true,
        preventDefault: true
      },

      // View
      {
        id: 'view-toggle-sidebar',
        key: 'ctrl+b',
        description: 'Sidebar ein/ausblenden',
        category: 'view',
        enabled: true,
        global: true
      },
      {
        id: 'view-toggle-theme',
        key: 'ctrl+shift+t',
        description: 'Theme wechseln',
        category: 'view',
        enabled: true,
        global: true
      },
      {
        id: 'view-fullscreen',
        key: 'f11',
        description: 'Vollbild ein/aus',
        category: 'view',
        enabled: true,
        global: true,
        preventDefault: false
      },

      // System
      {
        id: 'system-help',
        key: 'f1',
        description: 'Hilfe anzeigen',
        category: 'system',
        enabled: true,
        global: true
      },
      {
        id: 'system-shortcuts',
        key: 'ctrl+shift+?',
        description: 'Tastaturkürzel anzeigen',
        category: 'system',
        enabled: true,
        global: true
      },
      {
        id: 'system-settings',
        key: 'ctrl+comma',
        description: 'Einstellungen öffnen',
        category: 'system',
        enabled: true,
        global: true
      },

      // Editing
      {
        id: 'edit-undo',
        key: 'ctrl+z',
        description: 'Rückgängig',
        category: 'editing',
        enabled: true
      },
      {
        id: 'edit-redo',
        key: 'ctrl+y',
        description: 'Wiederholen',
        category: 'editing',
        enabled: true
      },
      {
        id: 'edit-select-all',
        key: 'ctrl+a',
        description: 'Alles auswählen',
        category: 'editing',
        enabled: true
      },
      {
        id: 'edit-copy',
        key: 'ctrl+c',
        description: 'Kopieren',
        category: 'editing',
        enabled: true,
        preventDefault: false
      },
      {
        id: 'edit-paste',
        key: 'ctrl+v',
        description: 'Einfügen',
        category: 'editing',
        enabled: true,
        preventDefault: false
      }
    ];

    // Register shortcuts with default actions
    defaultShortcuts.forEach(shortcut => {
      this.registerShortcut({
        ...shortcut,
        action: this.getDefaultAction(shortcut.id)
      });
    });

    // Normalize certain descriptions to proper UTF-8 (in case of encoding artifacts)
    try {
      this.updateShortcut('ctrl+1', { description: 'Dashboard öffnen' });
      this.updateShortcut('ctrl+2', { description: 'Projekte öffnen' });
      this.updateShortcut('ctrl+3', { description: 'Kalender öffnen' });
      this.updateShortcut('ctrl+4', { description: 'Chat öffnen' });
      this.updateShortcut('ctrl+5', { description: 'Dokumente öffnen' });
      this.updateShortcut('ctrl+6', { description: 'Analytics öffnen' });

      this.updateShortcut('ctrl+shift+?', { description: 'Tastaturkürzel anzeigen' });
      this.updateShortcut('ctrl+comma', { description: 'Einstellungen öffnen' });

      this.updateShortcut('ctrl+z', { description: 'Rückgängig' });
      this.updateShortcut('ctrl+a', { description: 'Alles auswählen' });
      this.updateShortcut('ctrl+v', { description: 'Einfügen' });
    } catch { /* ignore errors while importing shortcuts */ }
  }

  private getDefaultAction(shortcutId: string): () => void {
    const actions: Record<string, () => void> = {
      'nav-dashboard': () => this.navigate('/dashboard'),
      'nav-projects': () => this.navigate('/projects'),
      'nav-calendar': () => this.navigate('/calendar'),
      'nav-chat': () => this.navigate('/chat'),
      'nav-documents': () => this.navigate('/documents'),
      'nav-analytics': () => this.navigate('/analytics'),
      
      'search-global': () => this.triggerGlobalSearch(),
      'search-projects': () => this.triggerProjectSearch(),
      'search-customers': () => this.triggerCustomerSearch(),
      
      'action-new-project': () => this.triggerNewProject(),
      'action-new-quote': () => this.triggerNewQuote(),
      'action-new-invoice': () => this.triggerNewInvoice(),
      'action-save': () => this.triggerSave(),
      
      'view-toggle-sidebar': () => this.toggleSidebar(),
      'view-toggle-theme': () => this.toggleTheme(),
      'view-fullscreen': () => this.toggleFullscreen(),
      
      'system-help': () => this.showHelp(),
      'system-shortcuts': () => this.showShortcuts(),
      'system-settings': () => this.showSettings(),
      
      'edit-undo': () => this.triggerUndo(),
      'edit-redo': () => this.triggerRedo(),
      'edit-select-all': () => this.triggerSelectAll(),
      'edit-copy': () => this.triggerCopy(),
      'edit-paste': () => this.triggerPaste()
    };

    return actions[shortcutId] || (() => console.log(`Action for ${shortcutId} not implemented`));
  }

  // Navigation actions
  private navigate(path: string): void {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  // Search actions
  private triggerGlobalSearch(): void {
    this.triggerEvent('global-search');
  }

  private triggerProjectSearch(): void {
    this.triggerEvent('project-search');
  }

  private triggerCustomerSearch(): void {
    this.triggerEvent('customer-search');
  }

  // Action triggers
  private triggerNewProject(): void {
    this.triggerEvent('new-project');
  }

  private triggerNewQuote(): void {
    this.triggerEvent('new-quote');
  }

  private triggerNewInvoice(): void {
    this.triggerEvent('new-invoice');
  }

  private triggerSave(): void {
    this.triggerEvent('save');
  }

  // View actions
  private toggleSidebar(): void {
    this.triggerEvent('toggle-sidebar');
  }

  private toggleTheme(): void {
    this.triggerEvent('toggle-theme');
  }

  private toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  // System actions
  private showHelp(): void {
    this.triggerEvent('show-help');
  }

  private showShortcuts(): void {
    this.triggerEvent('show-shortcuts');
  }

  private showSettings(): void {
    this.triggerEvent('show-settings');
  }

  // Editing actions
  private triggerUndo(): void {
    this.triggerEvent('undo');
  }

  private triggerRedo(): void {
    this.triggerEvent('redo');
  }

  private triggerSelectAll(): void {
    this.triggerEvent('select-all');
  }

  private triggerCopy(): void {
    this.triggerEvent('copy');
  }

  private triggerPaste(): void {
    this.triggerEvent('paste');
  }

  // Event system
  private triggerEvent(eventName: string, data?: unknown): void {
    const event = new CustomEvent(`shortcut:${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }

  private notifyShortcutUsed(shortcut: KeyboardShortcut): void {
    const listeners = this.listeners.get(shortcut.id) || [];
    listeners.forEach((listener) => listener(shortcut));
  }

  // Public API
  registerShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.key, shortcut);
  }

  unregisterShortcut(key: string): void {
    this.shortcuts.delete(key);
  }

  updateShortcut(key: string, updates: Partial<KeyboardShortcut>): void {
    const existing = this.shortcuts.get(key);
    if (existing) {
      this.shortcuts.set(key, { ...existing, ...updates });
    }
  }

  getShortcut(key: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(key);
  }

  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
    return this.getAllShortcuts().filter(s => s.category === category);
  }

  getShortcutGroups(): ShortcutGroup[] {
    const categories: Record<ShortcutCategory, { label: string; description: string }> = {
      navigation: { label: 'Navigation', description: 'Zwischen Seiten navigieren' },
      search: { label: 'Suche', description: 'Suche und Filter' },
      actions: { label: 'Aktionen', description: 'Neue Elemente erstellen und Aktionen ausführen' },
      view: { label: 'Ansicht', description: 'UI-Elemente und Ansichten steuern' },
      editing: { label: 'Bearbeitung', description: 'Text und Daten bearbeiten' },
      system: { label: 'System', description: 'Systemfunktionen und Hilfe' }
    };

    return Object.entries(categories).map(([category, info]) => ({
      category: category as ShortcutCategory,
      label: info.label,
      description: info.description,
      shortcuts: this.getShortcutsByCategory(category as ShortcutCategory)
    }));
  }

  // Event listeners
  onShortcutUsed(shortcutId: string, callback: (shortcut: KeyboardShortcut) => void): () => void {
    if (!this.listeners.has(shortcutId)) {
      this.listeners.set(shortcutId, []);
    }
    this.listeners.get(shortcutId)!.push(callback);

    return () => {
      const listeners = this.listeners.get(shortcutId) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // Configuration
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setShowHints(show: boolean): void {
    this.config.showHints = show;
    this.saveConfig();
  }

  shouldShowHints(): boolean {
    return this.config.showHints;
  }

  getConfig(): KeyboardShortcutConfig {
    return { ...this.config };
  }

  // Import/Export
  exportShortcuts(): string {
    const data = {
      shortcuts: Array.from(this.shortcuts.entries()),
      config: this.config
    };
    return JSON.stringify(data, null, 2);
  }

  importShortcuts(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.shortcuts && Array.isArray(data.shortcuts)) {
        this.shortcuts.clear();
        data.shortcuts.forEach(([key, shortcut]: [string, KeyboardShortcut]) => {
          this.shortcuts.set(key, shortcut);
        });
        
        if (data.config) {
          this.config = { ...this.config, ...data.config };
          this.saveConfig();
        }
        
        return true;
      }
    } catch (error) {
      console.error('Failed to import shortcuts:', error);
    }
    return false;
  }

  // Power user features
  getPressedKeys(): string[] {
    return Array.from(this.pressedKeys);
  }

  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  // Accessibility
  getShortcutHint(key: string): string {
    const shortcut = this.shortcuts.get(key);
    return shortcut ? `${shortcut.key.toUpperCase()}: ${shortcut.description}` : '';
  }

  getShortcutForAction(actionId: string): KeyboardShortcut | undefined {
    return this.getAllShortcuts().find(s => s.id === actionId);
  }
}

export default KeyboardShortcutService.getInstance();
