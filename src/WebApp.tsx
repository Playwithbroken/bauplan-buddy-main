import {
  Component,
  ErrorInfo,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  HashRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  FolderOpen,
  LogOut,
  Receipt,
  Search,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isDesktopRuntime } from "@/utils/runtime";

type BetaEntity = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  amount?: number;
  date: string;
};

type BetaUser = {
  email: string;
  name: string;
  role: "Admin" | "Projektleitung" | "Team";
};

type BetaStore = {
  projects: BetaEntity[];
  quotes: BetaEntity[];
  invoices: BetaEntity[];
  customers: BetaEntity[];
  appointments: BetaEntity[];
  documents: BetaEntity[];
};

interface WebAppProps {
  onDesktopReady?: () => void;
  onDesktopError?: (error: Error, errorInfo: ErrorInfo) => void;
}

const USER_KEY = "bauplan_beta_user";
const STORE_KEY = "bauplan_beta_store";

const defaultStore: BetaStore = {
  projects: [
    {
      id: "PRJ-001",
      title: "Wohnhaus Südtor",
      subtitle: "Rohbau und Ausbaukoordination",
      status: "Aktiv",
      amount: 450000,
      date: "2026-05-16",
    },
  ],
  quotes: [
    {
      id: "ANG-001",
      title: "Metallbau Eingangsanlage",
      subtitle: "Familie Müller",
      status: "Entwurf",
      amount: 18500,
      date: "2026-05-16",
    },
  ],
  invoices: [
    {
      id: "RE-001",
      title: "Abschlagsrechnung Rohbau",
      subtitle: "Wohnhaus Südtor",
      status: "Offen",
      amount: 32000,
      date: "2026-05-16",
    },
  ],
  customers: [
    {
      id: "KND-001",
      title: "Familie Müller",
      subtitle: "muster@example.de",
      status: "Aktiv",
      date: "2026-05-16",
    },
  ],
  appointments: [
    {
      id: "TER-001",
      title: "Baustellenbegehung",
      subtitle: "Wohnhaus Südtor, 08:30 Uhr",
      status: "Geplant",
      date: "2026-05-16",
    },
  ],
  documents: [
    {
      id: "DOK-001",
      title: "Bauzeitenplan.pdf",
      subtitle: "Lokal abgelegt",
      status: "Verfügbar",
      date: "2026-05-16",
    },
  ],
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Projekte", icon: FolderOpen },
  { href: "/quotes", label: "Angebote", icon: FileText },
  { href: "/invoices", label: "Rechnungen", icon: Receipt },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/customers", label: "Kunden", icon: Users },
  { href: "/documents", label: "Dokumente", icon: Upload },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeBetaEntity(value: unknown, fallback: BetaEntity): BetaEntity {
  if (!value || typeof value !== "object") return fallback;
  const source = value as Partial<BetaEntity>;
  return {
    id: typeof source.id === "string" && source.id ? source.id : fallback.id,
    title:
      typeof source.title === "string" && source.title
        ? source.title
        : fallback.title,
    subtitle:
      typeof source.subtitle === "string" ? source.subtitle : fallback.subtitle,
    status:
      typeof source.status === "string" && source.status
        ? source.status
        : fallback.status,
    amount: typeof source.amount === "number" ? source.amount : fallback.amount,
    date:
      typeof source.date === "string" && source.date ? source.date : fallback.date,
  };
}

function normalizeBetaEntityList(
  value: unknown,
  fallback: BetaEntity[],
): BetaEntity[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item, index) =>
    normalizeBetaEntity(item, fallback[index] ?? fallback[0]),
  );
}

function normalizeBetaStore(value: unknown): BetaStore {
  const source =
    value && typeof value === "object" ? (value as Partial<BetaStore>) : {};

  return {
    projects: normalizeBetaEntityList(source.projects, defaultStore.projects),
    quotes: normalizeBetaEntityList(source.quotes, defaultStore.quotes),
    invoices: normalizeBetaEntityList(source.invoices, defaultStore.invoices),
    customers: normalizeBetaEntityList(source.customers, defaultStore.customers),
    appointments: normalizeBetaEntityList(
      source.appointments,
      defaultStore.appointments,
    ),
    documents: normalizeBetaEntityList(source.documents, defaultStore.documents),
  };
}

function readBetaStore(): BetaStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return normalizeBetaStore(raw ? JSON.parse(raw) : defaultStore);
  } catch {
    return defaultStore;
  }
}

function nextEntityId(items: BetaEntity[], prefix: string) {
  const highest = items.reduce((max, item) => {
    const match = item.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
}

function formatAmount(value?: number) {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildBetaBackup() {
  return {
    app: "Bauplan Buddy",
    type: "desktop-beta-backup",
    version: "0.0.2-beta.17",
    exportedAt: new Date().toISOString(),
    store: readBetaStore(),
  };
}

function downloadBetaBackup() {
  downloadJsonFile("bauplan-buddy-beta-backup", buildBetaBackup());
}

function downloadJsonFile(filenamePrefix: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadBetaSupportReport() {
  const store = readBetaStore();
  const user = readJson<BetaUser | null>(USER_KEY, null);
  downloadJsonFile("bauplan-buddy-beta-supportbericht", {
    app: "Bauplan Buddy",
    type: "desktop-beta-support-report",
    version: "0.0.2-beta.17",
    createdAt: new Date().toISOString(),
    runtime: {
      desktop: isDesktopRuntime(),
      userAgent: window.navigator.userAgent,
      language: window.navigator.language,
      route: window.location.hash || window.location.pathname,
    },
    user: user
      ? {
          email: user.email,
          role: user.role,
        }
      : null,
    dataCounts: {
      projects: store.projects.length,
      quotes: store.quotes.length,
      invoices: store.invoices.length,
      customers: store.customers.length,
      appointments: store.appointments.length,
      documents: store.documents.length,
    },
  });
}

function downloadBetaEntityExport(entityKey: keyof BetaStore, item: BetaEntity) {
  const exportLabels: Record<keyof BetaStore, string> = {
    projects: "projekt",
    quotes: "angebot",
    invoices: "rechnung",
    customers: "kunde",
    appointments: "termin",
    documents: "dokument",
  };

  downloadJsonFile(`bauplan-buddy-beta-${exportLabels[entityKey]}-${item.id}`, {
    app: "Bauplan Buddy",
    type: `desktop-beta-${exportLabels[entityKey]}-export`,
    version: "0.0.2-beta.17",
    exportedAt: new Date().toISOString(),
    betaNotice:
      "Lokaler Beta-Export zur Prüfung. Nicht als produktives Rechnungs- oder Angebotsdokument verwenden.",
    record: item,
  });
}

class BetaErrorBoundary extends Component<
  {
    children: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    console.error("Bauplan Buddy beta error:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Die Beta konnte diese Ansicht nicht laden</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ihre lokalen Daten bleiben auf diesem Gerät gespeichert. Sichern
              Sie die Daten, laden Sie die App neu oder kontaktieren Sie den
              Support mit einer kurzen Beschreibung des letzten Schritts.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => window.location.reload()}>Neu laden</Button>
            <Button variant="outline" onClick={downloadBetaBackup}>
              Daten sichern
            </Button>
            <Button variant="outline" onClick={downloadBetaSupportReport}>
              Supportbericht herunterladen
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@bauplanbuddy.com">Support kontaktieren</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
}

function useBetaStore() {
  const [store, setStore] = useState<BetaStore>(() => readBetaStore());

  const saveStore = (next: BetaStore) => {
    setStore(next);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  };

  const addEntity = (key: keyof BetaStore, title: string) => {
    const prefix: Record<keyof BetaStore, string> = {
      projects: "PRJ",
      quotes: "ANG",
      invoices: "RE",
      customers: "KND",
      appointments: "TER",
      documents: "DOK",
    };
    const initialStatus: Record<keyof BetaStore, string> = {
      projects: "Aktiv",
      quotes: "Entwurf",
      invoices: "Offen",
      customers: "Aktiv",
      appointments: "Geplant",
      documents: "Verfügbar",
    };
    const nextList = [
      {
        id: nextEntityId(store[key], prefix[key]),
        title,
        subtitle: "Lokal gespeichert",
        status: initialStatus[key],
        date: new Date().toISOString().slice(0, 10),
      },
      ...store[key],
    ];
    saveStore({ ...store, [key]: nextList });
  };

  const updateEntityStatus = (
    key: keyof BetaStore,
    id: string,
    status: string,
  ) => {
    saveStore({
      ...store,
      [key]: store[key].map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    });
  };

  const updateEntityTitle = (key: keyof BetaStore, id: string, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    saveStore({
      ...store,
      [key]: store[key].map((item) =>
        item.id === id ? { ...item, title: nextTitle } : item,
      ),
    });
  };

  const deleteEntity = (key: keyof BetaStore, id: string) => {
    saveStore({
      ...store,
      [key]: store[key].filter((item) => item.id !== id),
    });
  };

  return { store, addEntity, updateEntityStatus, updateEntityTitle, deleteEntity };
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@bauplan.de");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const login = () => {
    const valid =
      (email === "admin@bauplan.de" && password === "admin123") ||
      (email === "manager@bauplan.de" && password === "manager123") ||
      (email === "user@bauplan.de" && password === "user123");

    if (!valid) {
      setError("Bitte verwenden Sie ein freigegebenes Beta-Testkonto.");
      return;
    }

    const user: BetaUser = {
      email,
      name: email === "admin@bauplan.de" ? "Admin Beta" : "Beta Nutzer",
      role: email === "admin@bauplan.de" ? "Admin" : "Projektleitung",
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-8">
        <section className="grid w-full gap-8 lg:grid-cols-[420px_1fr] lg:items-center">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Bauplan Buddy Beta</CardTitle>
              <p className="text-sm text-muted-foreground">
                Lokale Desktop-Beta für Windows. Daten werden auf diesem
                Gerät gespeichert.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">E-Mail</span>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Passwort</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") login();
                  }}
                />
              </label>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="w-full" onClick={login}>
                Anmelden
              </Button>
              <p className="text-xs text-muted-foreground">
                Testkonto: admin@bauplan.de / admin123
              </p>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Stabilität zuerst
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">
              Kernprozesse für Projekte, Angebote, Rechnungen und Termine.
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Diese Beta konzentriert sich auf die lokalen Kernflows. Cloud,
              Team-Sync und experimentelle Integrationen bleiben bewusst
              ausgeblendet.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const user = readJson<BetaUser | null>(USER_KEY, null);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = readJson<BetaUser | null>(USER_KEY, null);

  return (
    <div className="min-h-screen bg-muted/30 text-foreground lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:block lg:p-5">
          <div>
            <p className="font-semibold">Bauplan Buddy</p>
            <p className="text-xs text-muted-foreground">Lokale Beta</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Abmelden"
            onClick={() => {
              localStorage.removeItem(USER_KEY);
              navigate("/login", { replace: true });
            }}
            className="lg:hidden"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-label={item.label}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-md text-sm transition-colors sm:w-auto sm:justify-start sm:px-3 lg:h-auto lg:py-2",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t p-4 lg:block">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              localStorage.removeItem(USER_KEY);
              navigate("/login", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </aside>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}

function DashboardPage({ store }: { store: BetaStore }) {
  const metrics = [
    ["Projekte", store.projects.length],
    ["Angebote", store.quotes.length],
    ["Rechnungen", store.invoices.length],
    ["Termine", store.appointments.length],
  ];
  const recent = [
    ...store.projects.slice(0, 1),
    ...store.quotes.slice(0, 1),
    ...store.invoices.slice(0, 1),
    ...store.appointments.slice(0, 1),
  ];

  return (
    <Page title="Dashboard" description="Überblick über lokale Beta-Daten.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <EntityList title="Aktuelle Aktivitäten" items={recent} />
    </Page>
  );
}

function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      {children}
    </div>
  );
}

function EntityPage({
  title,
  description,
  entityKey,
  items,
  onAdd,
  onStatusChange,
  onTitleChange,
  onDelete,
  placeholder,
  statusOptions,
  emptyText,
  exportable = false,
}: {
  title: string;
  description: string;
  entityKey: keyof BetaStore;
  items: BetaEntity[];
  onAdd: (title: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  placeholder: string;
  statusOptions: string[];
  emptyText: string;
  exportable?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("");
  const normalizedFilter = filter.trim().toLocaleLowerCase("de-DE");
  const filtered = useMemo(() => {
    if (!normalizedFilter) return items;
    return items.filter((item) =>
      [item.id, item.title, item.subtitle, item.status].some((value) =>
        value.toLocaleLowerCase("de-DE").includes(normalizedFilter),
      ),
    );
  }, [items, normalizedFilter]);

  return (
    <Page title={title} description={description}>
      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label={placeholder}
              value={draft}
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) {
                  onAdd(draft.trim());
                  setDraft("");
                }
              }}
            />
            <Button
              className="shrink-0"
              onClick={() => {
                if (!draft.trim()) return;
                onAdd(draft.trim());
                setDraft("");
              }}
            >
              Neu anlegen
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label={`${title} filtern`}
              className="pl-9"
              value={filter}
              placeholder={`${title} filtern`}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <EntityList
        title={title}
        entityKey={entityKey}
        items={filtered}
        statusOptions={statusOptions}
        onStatusChange={onStatusChange}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        onExport={exportable ? downloadBetaEntityExport : undefined}
        emptyText={
          normalizedFilter
            ? "Keine passenden Einträge gefunden."
            : emptyText
        }
      />
    </Page>
  );
}

function EntityList({
  title,
  entityKey,
  items,
  statusOptions,
  onStatusChange,
  onTitleChange,
  onDelete,
  onExport,
  emptyText = "Noch keine Einträge vorhanden.",
}: {
  title: string;
  entityKey?: keyof BetaStore;
  items: BetaEntity[];
  statusOptions?: string[];
  onStatusChange?: (id: string, status: string) => void;
  onTitleChange?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
  onExport?: (entityKey: keyof BetaStore, item: BetaEntity) => void;
  emptyText?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const startEditing = (item: BetaEntity) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveEditing = (item: BetaEntity) => {
    onTitleChange?.(item.id, editingTitle);
    cancelEditing();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                {editingId === item.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      aria-label={`Titel für ${item.title} bearbeiten`}
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveEditing(item);
                        if (event.key === "Escape") cancelEditing();
                      }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEditing(item)}>
                        Speichern
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEditing}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {item.status}
                    </span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {item.id} - {item.subtitle} - {item.date}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {formatAmount(item.amount) ? (
                  <p className="mr-2 font-semibold">{formatAmount(item.amount)}</p>
                ) : null}
                {entityKey && statusOptions && onStatusChange ? (
                  <select
                    aria-label={`Status für ${item.title}`}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={item.status}
                    onChange={(event) =>
                      onStatusChange(item.id, event.target.value)
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : null}
                {entityKey && onTitleChange ? (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Eintrag ${item.title} bearbeiten`}
                    onClick={() => startEditing(item)}
                  >
                    Bearbeiten
                  </Button>
                ) : null}
                {entityKey && onExport ? (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Eintrag ${item.title} exportieren`}
                    onClick={() => onExport(entityKey, item)}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                ) : null}
                {entityKey && onDelete ? (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Eintrag ${item.title} löschen`}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `"${item.title}" wirklich löschen?`,
                      );
                      if (confirmed) onDelete(item.id);
                    }}
                  >
                    Löschen
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");

  const saveBackup = () => {
    downloadBetaBackup();
    setMessage("Datensicherung wurde erstellt.");
  };

  const importBackup = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as { store?: BetaStore };
      if (!parsed.store) {
        throw new Error("missing store");
      }
      const nextStore = normalizeBetaStore(parsed.store);
      localStorage.setItem(STORE_KEY, JSON.stringify(nextStore));
      setMessage("Datensicherung wurde eingespielt. Die Ansicht wird neu geladen.");
      window.setTimeout(() => window.location.reload(), 200);
    } catch {
      setMessage("Die Datei konnte nicht als Beta-Datensicherung gelesen werden.");
    }
  };

  const resetData = () => {
    localStorage.setItem(STORE_KEY, JSON.stringify(defaultStore));
    window.location.reload();
  };

  return (
    <Page
      title="Einstellungen"
      description="Lokale Beta-Konfiguration für Desktop-Tests."
    >
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="font-medium">Datenmodus</p>
            <p className="text-sm text-muted-foreground">
              Offline/local-first. Keine Cloud-Verbindung erforderlich.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Button variant="outline" onClick={saveBackup}>
              Daten sichern
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Sicherung einspielen
            </Button>
            <Button variant="outline" onClick={downloadBetaSupportReport}>
              Supportbericht herunterladen
            </Button>
            <Button variant="outline" onClick={resetData}>
              Beta-Demodaten zurücksetzen
            </Button>
          </div>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="application/json,.json"
            aria-label="Beta-Datensicherung auswählen"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void importBackup(file);
            }}
          />
          {message ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {message}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Page>
  );
}

function BetaRoutes() {
  const {
    store,
    addEntity,
    updateEntityStatus,
    updateEntityTitle,
    deleteEntity,
  } = useBetaStore();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Shell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage store={store} />} />
                <Route
                  path="/projects"
                  element={
                    <EntityPage
                      title="Projekte"
                      description="Projektübersicht für lokale Beta-Daten."
                      entityKey="projects"
                      items={store.projects}
                      onAdd={(title) => addEntity("projects", title)}
                      onStatusChange={(id, status) =>
                        updateEntityStatus("projects", id, status)
                      }
                      onTitleChange={(id, title) =>
                        updateEntityTitle("projects", id, title)
                      }
                      onDelete={(id) => deleteEntity("projects", id)}
                      placeholder="Projektname eingeben"
                      statusOptions={["Aktiv", "Pausiert", "Abgeschlossen"]}
                      emptyText="Noch keine Projekte vorhanden."
                    />
                  }
                />
                <Route
                  path="/quotes"
                  element={
                    <EntityPage
                      title="Angebote"
                      description="Angebote lokal erfassen und verfolgen."
                      entityKey="quotes"
                      items={store.quotes}
                      onAdd={(title) => addEntity("quotes", title)}
                      onStatusChange={(id, status) =>
                        updateEntityStatus("quotes", id, status)
                      }
                      onTitleChange={(id, title) =>
                        updateEntityTitle("quotes", id, title)
                      }
                      onDelete={(id) => deleteEntity("quotes", id)}
                      placeholder="Angebotstitel eingeben"
                      statusOptions={["Entwurf", "Gesendet", "Angenommen"]}
                      emptyText="Noch keine Angebote vorhanden."
                      exportable
                    />
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <EntityPage
                      title="Rechnungen"
                      description="Rechnungen für den Beta-Smoke erfassen."
                      entityKey="invoices"
                      items={store.invoices}
                      onAdd={(title) => addEntity("invoices", title)}
                      onStatusChange={(id, status) =>
                        updateEntityStatus("invoices", id, status)
                      }
                      onTitleChange={(id, title) =>
                        updateEntityTitle("invoices", id, title)
                      }
                      onDelete={(id) => deleteEntity("invoices", id)}
                      placeholder="Rechnungstitel eingeben"
                      statusOptions={["Offen", "Bezahlt", "Exportiert"]}
                      emptyText="Noch keine Rechnungen vorhanden."
                      exportable
                    />
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <EntityPage
                      title="Kalender"
                      description="Termine lokal anlegen und prüfen."
                      entityKey="appointments"
                      items={store.appointments}
                      onAdd={(title) => addEntity("appointments", title)}
                      onStatusChange={(id, status) =>
                        updateEntityStatus("appointments", id, status)
                      }
                      onTitleChange={(id, title) =>
                        updateEntityTitle("appointments", id, title)
                      }
                      onDelete={(id) => deleteEntity("appointments", id)}
                      placeholder="Termin eingeben"
                      statusOptions={["Geplant", "Erledigt", "Abgesagt"]}
                      emptyText="Noch keine Termine vorhanden."
                    />
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <EntityPage
                      title="Kunden"
                      description="Kundendaten für Projekte und Angebote."
                      entityKey="customers"
                      items={store.customers}
                      onAdd={(title) => addEntity("customers", title)}
                      onStatusChange={(id, status) =>
                        updateEntityStatus("customers", id, status)
                      }
                      onTitleChange={(id, title) =>
                        updateEntityTitle("customers", id, title)
                      }
                      onDelete={(id) => deleteEntity("customers", id)}
                      placeholder="Kundenname eingeben"
                      statusOptions={["Aktiv", "Interessent", "Archiviert"]}
                      emptyText="Noch keine Kunden vorhanden."
                    />
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <EntityPage
                      title="Dokumente"
                      description="Lokale Dokumenteinträge für die Beta. Datei-Inhalte werden noch nicht gespeichert."
                      entityKey="documents"
                      items={store.documents}
                      onAdd={(title) => addEntity("documents", title)}
                      onStatusChange={(id, status) =>
                        updateEntityStatus("documents", id, status)
                      }
                      onTitleChange={(id, title) =>
                        updateEntityTitle("documents", id, title)
                      }
                      onDelete={(id) => deleteEntity("documents", id)}
                      placeholder="Dokumentname eingeben"
                      statusOptions={["Verfügbar", "Geprüft", "Archiviert"]}
                      emptyText="Noch keine Dokumenteinträge vorhanden."
                    />
                  }
                />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Shell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function WebApp({ onDesktopReady, onDesktopError }: WebAppProps) {
  const Router = isDesktopRuntime() ? HashRouter : HashRouter;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => onDesktopReady?.());
    return () => window.cancelAnimationFrame(frameId);
  }, [onDesktopReady]);

  return (
    <Router>
      <BetaErrorBoundary onError={onDesktopError}>
        <BetaRoutes />
      </BetaErrorBoundary>
    </Router>
  );
}
