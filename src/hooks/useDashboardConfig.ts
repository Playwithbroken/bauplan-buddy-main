import { useState, useEffect } from 'react';

export type WidgetId = 'metrics' | 'insights' | 'automation' | 'actions' | 'welcome' | 'riskRadar';

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  order: number;
  settings?: Record<string, any>;
}

const DEFAULT_CONFIG: WidgetConfig[] = [
  { id: 'welcome', visible: true, order: 0 },
  { id: 'metrics', visible: true, order: 1 },
  { id: 'insights', visible: true, order: 2 },
  { id: 'automation', visible: true, order: 3 },
  { id: 'actions', visible: true, order: 4 },
  { id: 'riskRadar', visible: false, order: 5 },
];

export const useDashboardConfig = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('bauplan_dashboard_config');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        setWidgets(DEFAULT_CONFIG);
      }
    } else {
      setWidgets(DEFAULT_CONFIG);
    }
  }, []);

  const toggleWidget = (id: WidgetId) => {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setWidgets(updated);
    saveConfig(updated);
  };

  const removeWidget = (id: WidgetId) => {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: false } : w);
    setWidgets(updated);
    saveConfig(updated);
  };

  const moveWidget = (fromIndex: number, toIndex: number) => {
    const updated = [...widgets];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    
    // Re-index orders
    const final = updated.map((w, i) => ({ ...w, order: i }));
    setWidgets(final);
    saveConfig(final);
  };

  const updateWidgetSettings = (id: WidgetId, settings: Record<string, any>) => {
    const updated = widgets.map(w => w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w);
    setWidgets(updated);
    saveConfig(updated);
  };

  const saveConfig = (config: WidgetConfig[]) => {
    localStorage.setItem('bauplan_dashboard_config', JSON.stringify(config));
  };

  const resetConfig = () => {
    setWidgets(DEFAULT_CONFIG);
    localStorage.removeItem('bauplan_dashboard_config');
  };

  return {
    isEditMode,
    setIsEditMode,
    widgets,
    toggleWidget,
    removeWidget,
    moveWidget,
    updateWidgetSettings,
    resetConfig,
  };
};
