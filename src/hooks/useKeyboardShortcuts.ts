import { useEffect, useCallback, useState } from 'react';
import KeyboardShortcutService, { KeyboardShortcut, ShortcutCategory, ShortcutGroup } from '@/services/keyboardShortcutService';

export interface UseKeyboardShortcutsReturn {
  shortcuts: KeyboardShortcut[];
  shortcutGroups: ShortcutGroup[];
  isEnabled: boolean;
  shouldShowHints: boolean;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  updateShortcut: (key: string, updates: Partial<KeyboardShortcut>) => void;
  setEnabled: (enabled: boolean) => void;
  setShowHints: (show: boolean) => void;
  getShortcutForAction: (actionId: string) => KeyboardShortcut | undefined;
  getShortcutHint: (key: string) => string;
  pressedKeys: string[];
  isKeyPressed: (key: string) => boolean;
  exportShortcuts: () => string;
  importShortcuts: (jsonData: string) => boolean;
}

export function useKeyboardShortcuts(): UseKeyboardShortcutsReturn {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [shortcutGroups, setShortcutGroups] = useState<ShortcutGroup[]>([]);
  const [isEnabled, setIsEnabledState] = useState(KeyboardShortcutService.isEnabled());
  const [shouldShowHints, setShouldShowHintsState] = useState(KeyboardShortcutService.shouldShowHints());
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);

  // Update state when shortcuts change
  const updateState = useCallback(() => {
    setShortcuts(KeyboardShortcutService.getAllShortcuts());
    setShortcutGroups(KeyboardShortcutService.getShortcutGroups());
    setIsEnabledState(KeyboardShortcutService.isEnabled());
    setShouldShowHintsState(KeyboardShortcutService.shouldShowHints());
  }, []);

  // Track pressed keys for power user features
  useEffect(() => {
    const updatePressedKeys = () => {
      setPressedKeys(KeyboardShortcutService.getPressedKeys());
    };

    const interval = setInterval(updatePressedKeys, 100);
    return () => clearInterval(interval);
  }, []);

  // Initial load
  useEffect(() => {
    updateState();
  }, [updateState]);

  // Memoized functions
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    KeyboardShortcutService.registerShortcut(shortcut);
    updateState();
  }, [updateState]);

  const unregisterShortcut = useCallback((key: string) => {
    KeyboardShortcutService.unregisterShortcut(key);
    updateState();
  }, [updateState]);

  const updateShortcut = useCallback((key: string, updates: Partial<KeyboardShortcut>) => {
    KeyboardShortcutService.updateShortcut(key, updates);
    updateState();
  }, [updateState]);

  const setEnabled = useCallback((enabled: boolean) => {
    KeyboardShortcutService.setEnabled(enabled);
    setIsEnabledState(enabled);
  }, []);

  const setShowHints = useCallback((show: boolean) => {
    KeyboardShortcutService.setShowHints(show);
    setShouldShowHintsState(show);
  }, []);

  const getShortcutForAction = useCallback((actionId: string) => {
    return KeyboardShortcutService.getShortcutForAction(actionId);
  }, []);

  const getShortcutHint = useCallback((key: string) => {
    return KeyboardShortcutService.getShortcutHint(key);
  }, []);

  const isKeyPressed = useCallback((key: string) => {
    return KeyboardShortcutService.isKeyPressed(key);
  }, []);

  const exportShortcuts = useCallback(() => {
    return KeyboardShortcutService.exportShortcuts();
  }, []);

  const importShortcuts = useCallback((jsonData: string) => {
    const success = KeyboardShortcutService.importShortcuts(jsonData);
    if (success) {
      updateState();
    }
    return success;
  }, [updateState]);

  return {
    shortcuts,
    shortcutGroups,
    isEnabled,
    shouldShowHints,
    registerShortcut,
    unregisterShortcut,
    updateShortcut,
    setEnabled,
    setShowHints,
    getShortcutForAction,
    getShortcutHint,
    pressedKeys,
    isKeyPressed,
    exportShortcuts,
    importShortcuts
  };
}

// Hook for specific shortcut categories
export function useShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);

  useEffect(() => {
    const updateShortcuts = () => {
      setShortcuts(KeyboardShortcutService.getShortcutsByCategory(category));
    };

    updateShortcuts();
    
    // You could add an event listener here if the service emitted events
    const interval = setInterval(updateShortcuts, 1000);
    return () => clearInterval(interval);
  }, [category]);

  return shortcuts;
}

// Hook for registering temporary shortcuts
export function useTemporaryShortcut(
  shortcut: Omit<KeyboardShortcut, 'enabled'>
): void {
  useEffect(() => {
    const fullShortcut: KeyboardShortcut = { ...shortcut, enabled: true };
    KeyboardShortcutService.registerShortcut(fullShortcut);

    return () => {
      KeyboardShortcutService.unregisterShortcut(shortcut.key);
    };
  }, [shortcut]);
}

// Hook for shortcut-aware components
export function useShortcutAware(actionId: string): {
  shortcut: KeyboardShortcut | undefined;
  hint: string;
  isActive: boolean;
} {
  const [shortcut, setShortcut] = useState<KeyboardShortcut | undefined>(undefined);
  const [hint, setHint] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const foundShortcut = KeyboardShortcutService.getShortcutForAction(actionId);
    setShortcut(foundShortcut);
    setHint(foundShortcut ? KeyboardShortcutService.getShortcutHint(foundShortcut.key) : '');

    if (foundShortcut) {
      const cleanup = KeyboardShortcutService.onShortcutUsed(actionId, () => {
        setIsActive(true);
        setTimeout(() => setIsActive(false), 150); // Visual feedback
      });

      return cleanup;
    }
  }, [actionId]);

  return { shortcut, hint, isActive };
}

// Hook for power users - show pressed key combinations
export function usePowerUserMode(): {
  isEnabled: boolean;
  pressedKeys: string[];
  keyCombo: string;
  suggestions: KeyboardShortcut[];
} {
  const { pressedKeys, shortcuts, isEnabled } = useKeyboardShortcuts();
  const [keyCombo, setKeyCombo] = useState('');
  const [suggestions, setSuggestions] = useState<KeyboardShortcut[]>([]);

  useEffect(() => {
    const combo = pressedKeys.join('+');
    setKeyCombo(combo);

    // Find matching shortcuts for current key combination
    const matching = shortcuts.filter(shortcut => 
      shortcut.key.startsWith(combo) && shortcut.enabled
    );
    setSuggestions(matching);
  }, [pressedKeys, shortcuts]);

  return {
    isEnabled,
    pressedKeys,
    keyCombo,
    suggestions
  };
}

export default useKeyboardShortcuts;
