/**
 * Design System Integration Example
 * 
 * This file demonstrates how to integrate all design system features
 * into your application. Copy this pattern to your main.tsx or App.tsx.
 */

import React, { useEffect } from 'react';
import designSystemService from '@/services/designSystemService';
import { DensityToggle } from '@/components/ui/density-toggle';
import { EmptyState } from '@/components/ui/empty-state';
import { toastPatterns, showUndoable } from '@/lib/toast-helpers';
import a11y from '@/lib/accessibility-helpers';
import { Plus, FileQuestion } from 'lucide-react';

/**
 * Initialize Design System
 * Call this in your root component (main.tsx or App.tsx)
 */
export function initializeApp() {
  // Initialize all design system services
  designSystemService.initialize();

  // Optional: Run accessibility audit in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const issues = a11y.auditAccessibility(document.body);
      a11y.logAccessibilityIssues(issues);
    }, 1000);
  }
}

/**
 * Example: Settings Page with Density Toggle
 */
export function SettingsPage() {
  return (
    <div className="p-fluid-lg space-y-fluid-md">
      <h1 className="text-3xl font-semibold">Einstellungen</h1>
      
      <section className="space-y-fluid-sm">
        <h2 className="text-xl font-medium">Ansicht</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Anzeigedichte</p>
            <p className="text-sm text-muted-foreground">
              Wählen Sie die Informationsdichte der Benutzeroberfläche
            </p>
          </div>
          <DensityToggle />
        </div>
      </section>
    </div>
  );
}

/**
 * Example: Empty State with Actions
 */
export function ProjectsEmptyState() {
  const handleCreateProject = () => {
    // Your create logic
    toastPatterns.created('Projekt');
  };

  const handleImportProjects = () => {
    // Your import logic
    toastPatterns.info('Import gestartet');
  };

  return (
    <EmptyState
      icon={FileQuestion}
      title="Keine Projekte vorhanden"
      description="Erstellen Sie Ihr erstes Projekt, um mit der Arbeit zu beginnen. Sie können auch bestehende Projekte importieren."
      action={{
        label: 'Projekt erstellen',
        onClick: handleCreateProject,
        icon: Plus,
      }}
      secondaryAction={{
        label: 'Projekte importieren',
        onClick: handleImportProjects,
        variant: 'outline',
      }}
      helpLink={{
        label: 'Mehr über Projekte erfahren',
        href: '/docs/projects',
      }}
    />
  );
}

/**
 * Example: Undoable Delete Action
 */
export function ProjectCard({ project, onDelete, onRestore }: any) {
  const handleDelete = async () => {
    // Optimistically remove from UI
    const deletedProject = { ...project };
    onDelete(project.id);

    // Show undo toast
    showUndoable({
      message: `${project.name} wurde gelöscht`,
      onUndo: () => {
        onRestore(deletedProject);
        toastPatterns.info('Projekt wiederhergestellt');
      },
      duration: 5000,
    });

    // Actually delete after undo timeout
    setTimeout(async () => {
      try {
        await api.deleteProject(project.id);
      } catch (error) {
        // If API call fails, restore automatically
        onRestore(deletedProject);
        toastPatterns.error('Löschen fehlgeschlagen');
      }
    }, 5000);
  };

  return (
    <div className="p-fluid-md border rounded-lg">
      <h3>{project.name}</h3>
      <button onClick={handleDelete}>Löschen</button>
    </div>
  );
}

/**
 * Example: Form with Toast Feedback
 */
export function ProjectForm({ onSubmit }: any) {
  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      toastPatterns.created('Projekt');
    } catch (error) {
      if (error instanceof ValidationError) {
        toastPatterns.validationError(error.message);
      } else if (error instanceof NetworkError) {
        toastPatterns.networkError();
      } else {
        toastPatterns.error('Ein unerwarteter Fehler ist aufgetreten');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}

/**
 * Example: Responsive Layout with Density Awareness
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { mode, padding } = useDensityMode();

  return (
    <div className={cn(
      'min-h-screen',
      padding.page,
      mode === 'comfortable' ? 'space-y-fluid-lg' : 'space-y-fluid-md'
    )}>
      {children}
    </div>
  );
}

/**
 * Example: Accessibility Announcement
 */
export function NotificationSystem() {
  const handleNewMessage = (message: string) => {
    // Visual notification
    toastPatterns.info(message);
    
    // Screen reader announcement
    a11y.announce(`Neue Nachricht: ${message}`, 'polite');
  };

  return null; // This would be your notification component
}

/**
 * Example: Custom Branding Setup
 */
export function BrandingSetup() {
  const [companyName, setCompanyName] = React.useState('');
  const [primaryColor, setPrimaryColor] = React.useState('#3B82F6');

  const handleSave = () => {
    brandingService.saveBranding({
      companyName,
      primaryColor,
      secondaryColor: '#8B5CF6',
      accentColor: '#10B981',
    });

    toastPatterns.saved();
  };

  // Check contrast before saving
  const contrast = brandingService.checkContrast(primaryColor, '#FFFFFF');

  return (
    <div className="space-y-4">
      <input
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Firmenname"
      />
      
      <div>
        <input
          type="color"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Kontrast: {contrast.ratio}:1 ({contrast.level})
          {!contrast.passes && ' ⚠️ Nicht WCAG AA konform'}
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={!contrast.passes}
      >
        Speichern
      </button>
    </div>
  );
}

/**
 * Example: Complete App Setup
 */
export function App() {
  useEffect(() => {
    // Initialize design system on mount
    initializeApp();

    // Optional: Check user preferences
    const status = designSystemService.getStatus();
    console.log('Design System Status:', status);

    // Optional: Set up keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        densityService.toggleDensity();
        a11y.announce('Anzeigedichte geändert', 'polite');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="app">
      {/* Your app content */}
    </div>
  );
}

// Export everything for easy importing
export {
  designSystemService,
  DensityToggle,
  EmptyState,
  toastPatterns,
  showUndoable,
  a11y,
};

// Type exports for TypeScript
import type { BrandingConfig } from '@/services/brandingService';
import type { DensityMode } from '@/services/densityService';
import type { UndoableAction, ToastOptions } from '@/lib/toast-helpers';
import type { AccessibilityIssue } from '@/lib/accessibility-helpers';

export type {
  BrandingConfig,
  DensityMode,
  UndoableAction,
  ToastOptions,
  AccessibilityIssue,
};
