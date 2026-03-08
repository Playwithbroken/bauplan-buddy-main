import { useEffect, useState } from 'react';
import { KeyboardShortcutsPanel } from '@/components/ui/keyboard-shortcuts-panel';

export default function KeyboardShortcutsPanelPortal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('shortcut:show-shortcuts', onOpen as EventListener);
    return () => window.removeEventListener('shortcut:show-shortcuts', onOpen as EventListener);
  }, []);

  return (
    <KeyboardShortcutsPanel open={open} onOpenChange={setOpen} />
  );
}

