import React, { createContext, useContext, useState, useCallback } from "react";

interface DialogState {
  id: string;
  zIndex: number;
}

interface DialogManagerContextType {
  registerDialog: (id: string) => void;
  unregisterDialog: (id: string) => void;
  focusDialog: (id: string) => void;
  getZIndex: (id: string) => number;
  activeDialogId: string | null;
}

const DialogManagerContext = createContext<
  DialogManagerContextType | undefined
>(undefined);

export const DialogManagerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const [activeDialogId, setActiveDialogId] = useState<string | null>(null);
  const [baseZIndex] = useState(100);

  const registerDialog = useCallback(
    (id: string) => {
      setDialogs((prev) => {
        if (prev.find((d) => d.id === id)) return prev;
        const maxZ =
          prev.length > 0 ? Math.max(...prev.map((d) => d.zIndex)) : baseZIndex;
        return [...prev, { id, zIndex: maxZ + 100 }]; // Larger jump for better layering
      });
      setActiveDialogId(id);
    },
    [baseZIndex]
  );

  const unregisterDialog = useCallback((id: string) => {
    setDialogs((prev) => {
      const remaining = prev.filter((d) => d.id !== id);
      if (remaining.length > 0) {
        // Switch focus to the next top-most dialog
        const sorted = [...remaining].sort((a, b) => b.zIndex - a.zIndex);
        setActiveDialogId(sorted[0].id);
      } else {
        setActiveDialogId(null);
      }
      return remaining;
    });
  }, []);

  const focusDialog = useCallback((id: string) => {
    setActiveDialogId(id);
    setDialogs((prev) => {
      const dialog = prev.find((d) => d.id === id);
      if (!dialog) return prev;

      const maxZ = Math.max(...prev.map((d) => d.zIndex));
      if (dialog.zIndex === maxZ) return prev; // Already on top

      return prev.map((d) => (d.id === id ? { ...d, zIndex: maxZ + 100 } : d));
    });
  }, []);

  const getZIndex = useCallback(
    (id: string) => {
      const dialog = dialogs.find((d) => d.id === id);
      return dialog ? dialog.zIndex : baseZIndex + 1;
    },
    [dialogs, baseZIndex]
  );

  return (
    <DialogManagerContext.Provider
      value={{
        registerDialog,
        unregisterDialog,
        focusDialog,
        getZIndex,
        activeDialogId,
      }}
    >
      {children}
    </DialogManagerContext.Provider>
  );
};

export const useDialogManager = () => {
  const context = useContext(DialogManagerContext);
  if (!context) {
    throw new Error(
      "useDialogManager must be used within a DialogManagerProvider"
    );
  }
  return context;
};
