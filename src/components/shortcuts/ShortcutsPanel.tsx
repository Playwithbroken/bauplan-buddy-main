import React from 'react';
import { KeyboardShortcutsPanel } from '@/components/ui/keyboard-shortcuts-panel';

interface ShortcutsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ open, onOpenChange, trigger }) => {
  return (
    <KeyboardShortcutsPanel
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
    />
  );
};

export default ShortcutsPanel;
