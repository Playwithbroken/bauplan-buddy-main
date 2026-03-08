import { 
  FileText, 
  FolderOpen, 
  Users, 
  Receipt, 
  Calendar,
  Building,
  Package,
  Truck,
  ClipboardList,
  MessageSquare,
  Search,
  Filter,
  Database
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Empty States for all major pages
 */

export function EmptyQuotes({ onCreateQuote }: { onCreateQuote?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="Noch keine Angebote vorhanden"
      description="Erstellen Sie Ihr erstes Angebot, um mit Kunden zu kommunizieren und Aufträge zu gewinnen."
      action={onCreateQuote ? {
        label: 'Erstes Angebot erstellen',
        onClick: onCreateQuote,
      } : undefined}
    />
  );
}

export function EmptyProjects({ onCreateProject }: { onCreateProject?: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Keine Projekte vorhanden"
      description="Starten Sie Ihr erstes Projekt und verwalten Sie alle Bauvorhaben zentral an einem Ort."
      action={onCreateProject ? {
        label: 'Neues Projekt starten',
        onClick: onCreateProject,
      } : undefined}
    />
  );
}

export function EmptyInvoices({ onCreateInvoice }: { onCreateInvoice?: () => void }) {
  return (
    <EmptyState
      icon={Receipt}
      title="Keine Rechnungen vorhanden"
      description="Erstellen Sie Ihre erste Rechnung, um Zahlungen von Kunden zu erhalten."
      action={onCreateInvoice ? {
        label: 'Erste Rechnung erstellen',
        onClick: onCreateInvoice,
      } : undefined}
    />
  );
}

export function EmptyCustomers({ onAddCustomer }: { onAddCustomer?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Keine Kunden vorhanden"
      description="Fügen Sie Ihren ersten Kunden hinzu, um Kontaktdaten und Projekthistorie zu verwalten."
      action={onAddCustomer ? {
        label: 'Ersten Kunden hinzufügen',
        onClick: onAddCustomer,
      } : undefined}
    />
  );
}

export function EmptyCalendar({ onCreateEvent }: { onCreateEvent?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="Keine Termine eingetragen"
      description="Planen Sie Ihren ersten Termin, um Meetings, Baustellen-Besuche und Deadlines zu organisieren."
      action={onCreateEvent ? {
        label: 'Termin planen',
        onClick: onCreateEvent,
      } : undefined}
    />
  );
}

export function EmptySuppliers({ onAddSupplier }: { onAddSupplier?: () => void }) {
  return (
    <EmptyState
      icon={Building}
      title="Keine Lieferanten vorhanden"
      description="Fügen Sie Lieferanten hinzu, um Materialbestellungen und Lieferketten zu verwalten."
      action={onAddSupplier ? {
        label: 'Lieferant hinzufügen',
        onClick: onAddSupplier,
      } : undefined}
    />
  );
}

export function EmptyInventory({ onAddItem }: { onAddItem?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="Inventar ist leer"
      description="Erfassen Sie Materialien und Werkzeuge, um Ihren Lagerbestand im Blick zu behalten."
      action={onAddItem ? {
        label: 'Artikel hinzufügen',
        onClick: onAddItem,
      } : undefined}
    />
  );
}

export function EmptyDeliveryNotes({ onCreateNote }: { onCreateNote?: () => void }) {
  return (
    <EmptyState
      icon={Truck}
      title="Keine Lieferscheine vorhanden"
      description="Erstellen Sie Lieferscheine, um Warenlieferungen zu dokumentieren."
      action={onCreateNote ? {
        label: 'Lieferschein erstellen',
        onClick: onCreateNote,
      } : undefined}
    />
  );
}

export function EmptyOrderConfirmations({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={ClipboardList}
      title="Keine Auftragsbestätigungen"
      description="Bestätigen Sie Aufträge schriftlich, um Missverständnisse zu vermeiden."
      action={onCreate ? {
        label: 'Auftragsbestätigung erstellen',
        onClick: onCreate,
      } : undefined}
    />
  );
}

export function EmptyMessages() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Keine Nachrichten"
      description="Sie haben aktuell keine Nachrichten. Neue Nachrichten erscheinen hier."
    />
  );
}

export function EmptySearchResults() {
  return (
    <EmptyState
      icon={Search}
      title="Keine Ergebnisse gefunden"
      description="Versuchen Sie es mit anderen Suchbegriffen oder passen Sie Ihre Filter an."
    />
  );
}

export function EmptyFilterResults({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="Keine Einträge gefunden"
      description="Mit den aktuellen Filtern wurden keine Einträge gefunden. Versuchen Sie andere Filterkriterien."
      action={onClearFilters ? {
        label: 'Filter zurücksetzen',
        onClick: onClearFilters,
      } : undefined}
    />
  );
}

export function EmptyData() {
  return (
    <EmptyState
      icon={Database}
      title="Keine Daten verfügbar"
      description="Es sind noch keine Daten vorhanden. Beginnen Sie mit der Erfassung Ihrer ersten Einträge."
    />
  );
}
