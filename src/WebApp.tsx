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
  Printer,
  Receipt,
  Search,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import ProductLoginPage from "@/pages/LoginPage";
import { getAppCapabilities } from "@/utils/appCapabilities";
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

type PrintSettings = {
  letterhead: string;
  footer: string;
  paperSize: "A4";
};

const USER_KEY = "bauplan_beta_user";
const STORE_KEY = "bauplan_beta_store";
const PRINT_SETTINGS_KEY = "bauplan_beta_print_settings";
const DESKTOP_BETA_UPDATE_LIMITATION =
  "Update-Checks sind in dieser lokalen Beta noch nicht produktiv angebunden.";

const defaultPrintSettings: PrintSettings = {
  letterhead: "Bauplan Buddy\nMusterstraße 12\n12345 Musterstadt",
  footer:
    "Vielen Dank für Ihr Vertrauen.\nBankverbindung und rechtliche Pflichtangaben bitte vor produktiver Nutzung ergänzen.",
  paperSize: "A4",
};

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
  { href: "/customers", label: "Kunden", icon: Users },
  { href: "/quotes", label: "Angebote", icon: FileText },
  { href: "/invoices", label: "Rechnungen", icon: Receipt },
  { href: "/calendar", label: "Kalender", icon: Calendar },
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

function normalizePrintSettings(value: unknown): PrintSettings {
  const source =
    value && typeof value === "object" ? (value as Partial<PrintSettings>) : {};

  return {
    letterhead:
      typeof source.letterhead === "string"
        ? source.letterhead
        : defaultPrintSettings.letterhead,
    footer:
      typeof source.footer === "string"
        ? source.footer
        : defaultPrintSettings.footer,
    paperSize: "A4",
  };
}

function readPrintSettings(): PrintSettings {
  try {
    const raw = localStorage.getItem(PRINT_SETTINGS_KEY);
    return normalizePrintSettings(raw ? JSON.parse(raw) : defaultPrintSettings);
  } catch {
    return defaultPrintSettings;
  }
}

function savePrintSettings(settings: PrintSettings) {
  localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(settings));
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
    printSettings: readPrintSettings(),
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
    printSettings: readPrintSettings(),
    record: item,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrintBlock(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function openBetaPrintPreview(entityKey: keyof BetaStore, item: BetaEntity) {
  const printSettings = readPrintSettings();
  const documentLabels: Record<keyof BetaStore, string> = {
    projects: "Projekt",
    quotes: "Angebot",
    invoices: "Rechnung",
    customers: "Kunde",
    appointments: "Termin",
    documents: "Dokument",
  };
  const amount = formatAmount(item.amount);
  const preview = window.open("", "_blank", "width=980,height=760");

  if (!preview) {
    window.alert("Die Druckansicht konnte nicht geöffnet werden.");
    return;
  }

  preview.document.write(`<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${documentLabels[entityKey]} ${escapeHtml(item.id)}</title>
  <style>
    @page { size: ${printSettings.paperSize}; margin: 18mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      background: #f3f4f6;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    .toolbar {
      position: sticky;
      top: 0;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding: 12px 18px;
      background: #111827;
    }
    .toolbar button {
      border: 0;
      border-radius: 6px;
      padding: 9px 14px;
      color: #111827;
      background: #ffffff;
      font-weight: 600;
      cursor: pointer;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      padding: 18mm;
      background: #ffffff;
      box-shadow: 0 14px 45px rgba(15, 23, 42, 0.18);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 18px;
      white-space: pre-line;
    }
    .doc-type {
      text-align: right;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #4b5563;
      font-size: 12px;
      font-weight: 700;
    }
    h1 { margin: 34px 0 8px; font-size: 28px; }
    .meta {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 8px 18px;
      margin: 28px 0;
    }
    .meta dt { color: #6b7280; }
    .meta dd { margin: 0; font-weight: 600; }
    .notice {
      margin-top: 24px;
      border: 1px solid #fde68a;
      background: #fffbeb;
      padding: 12px;
      color: #92400e;
      font-size: 13px;
    }
    footer {
      margin-top: 70mm;
      border-top: 1px solid #d1d5db;
      padding-top: 14px;
      color: #4b5563;
      font-size: 12px;
      white-space: pre-line;
    }
    @media print {
      body { background: #ffffff; }
      .toolbar { display: none; }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="window.print()">Drucken</button>
    <button type="button" onclick="window.close()">Schließen</button>
  </div>
  <main class="page">
    <header>
      <div>${formatPrintBlock(printSettings.letterhead)}</div>
      <div class="doc-type">Lokale Beta-Druckansicht<br />${documentLabels[entityKey]}</div>
    </header>
    <h1>${escapeHtml(item.title)}</h1>
    <p>${escapeHtml(item.subtitle)}</p>
    <dl class="meta">
      <dt>Nummer</dt><dd>${escapeHtml(item.id)}</dd>
      <dt>Status</dt><dd>${escapeHtml(item.status)}</dd>
      <dt>Datum</dt><dd>${escapeHtml(item.date)}</dd>
      ${amount ? `<dt>Betrag</dt><dd>${escapeHtml(amount)}</dd>` : ""}
    </dl>
    <div class="notice">
      Beta-Druckansicht zur Prüfung von Briefkopf, Brieffuß und Drucklayout.
      Vor produktiver Nutzung Pflichtangaben und finale PDF-Ausgabe prüfen.
    </div>
    <footer>${formatPrintBlock(printSettings.footer)}</footer>
  </main>
</body>
</html>`);
  preview.document.close();
  preview.focus();
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

function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const capabilities = getAppCapabilities("desktop-beta");

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <BarChart3 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Bauplan Buddy</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      Lokale Desktop-Beta
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="px-4 py-2 text-xs text-sidebar-foreground/70">
            {capabilities.isLocalFirst
              ? "Local-first ohne Cloud-Pflicht"
              : "Cloud-Modus aktiv"}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Arbeitsbereich</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                      >
                        <Link to={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  localStorage.removeItem("bauplan_offline_user");
                  localStorage.removeItem(USER_KEY);
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut />
                <span>Abmelden</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex min-h-14 shrink-0 flex-col gap-2 border-b bg-background px-4 py-3 md:flex-row md:items-center md:gap-3 md:py-0">
          <SidebarTrigger />
          <div>
            <p className="text-sm font-semibold">Bauplan Buddy Desktop</p>
            <p className="text-xs text-muted-foreground">
              Einsatzfähige lokale Beta
            </p>
          </div>
          <nav
            aria-label="Mobile Beta-Navigation"
            className="flex gap-2 overflow-x-auto pb-1 md:hidden"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardPage({ store }: { store: BetaStore }) {
  const openInvoices = store.invoices.filter((item) => item.status !== "Bezahlt");
  const activeProjects = store.projects.filter((item) => item.status === "Aktiv");
  const draftQuotes = store.quotes.filter((item) => item.status === "Entwurf");
  const plannedAppointments = store.appointments.filter(
    (item) => item.status === "Geplant",
  );
  const openInvoiceTotal = openInvoices.reduce(
    (sum, item) => sum + (item.amount ?? 0),
    0,
  );
  const metrics: {
    label: string;
    value: string;
    detail: string;
    href: string;
  }[] = [
    {
      label: "Aktive Projekte",
      value: String(activeProjects.length),
      detail: `${store.projects.length} Projekte lokal gespeichert`,
      href: "/projects",
    },
    {
      label: "Offene Angebote",
      value: String(draftQuotes.length),
      detail: `${store.quotes.length} Angebote insgesamt`,
      href: "/quotes",
    },
    {
      label: "Offene Rechnungen",
      value: formatAmount(openInvoiceTotal) ?? "0 €",
      detail: `${openInvoices.length} Rechnungen nicht bezahlt`,
      href: "/invoices",
    },
    {
      label: "Geplante Termine",
      value: String(plannedAppointments.length),
      detail: `${store.appointments.length} Termine im lokalen Kalender`,
      href: "/calendar",
    },
  ];
  const quickActions = [
    { label: "Projekt anlegen", href: "/projects", icon: FolderOpen },
    { label: "Kunde erfassen", href: "/customers", icon: Users },
    { label: "Angebot schreiben", href: "/quotes", icon: FileText },
    { label: "Rechnung vorbereiten", href: "/invoices", icon: Receipt },
  ];
  const recent = [
    ...store.projects.slice(0, 1),
    ...store.quotes.slice(0, 1),
    ...store.invoices.slice(0, 1),
    ...store.appointments.slice(0, 1),
  ];
  const focusItems = [
    ...openInvoices.slice(0, 2),
    ...draftQuotes.slice(0, 2),
    ...plannedAppointments.slice(0, 2),
  ].slice(0, 4);

  return (
    <Page
      title="Dashboard"
      description="Lokaler Überblick über Projekte, Zahlungen und nächste Schritte."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="space-y-3 p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {metric.detail}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={metric.href}>Öffnen</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Heute wichtig</CardTitle>
            <p className="text-sm text-muted-foreground">
              Offene Rechnungen, Angebotsentwürfe und geplante Termine.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusItems.length ? (
              focusItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.id} - {item.subtitle}
                    </p>
                  </div>
                  {formatAmount(item.amount) ? (
                    <p className="font-semibold">{formatAmount(item.amount)}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Keine offenen Aufgaben vorhanden.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schnellstart</CardTitle>
            <p className="text-sm text-muted-foreground">
              Direkt in die wichtigsten lokalen Arbeitsbereiche springen.
            </p>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  variant="outline"
                  className="justify-start gap-2"
                  asChild
                >
                  <Link to={action.href}>
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </section>

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
  printable = false,
  moduleSummary,
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
  printable?: boolean;
  moduleSummary?: ReactNode;
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
      {moduleSummary}
      <EntityList
        title={title}
        entityKey={entityKey}
        items={filtered}
        statusOptions={statusOptions}
        onStatusChange={onStatusChange}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        onExport={exportable ? downloadBetaEntityExport : undefined}
        onPrint={printable ? openBetaPrintPreview : undefined}
        emptyText={
          normalizedFilter
            ? "Keine passenden Einträge gefunden."
            : emptyText
        }
      />
    </Page>
  );
}

function ProjectModuleSummary({ projects }: { projects: BetaEntity[] }) {
  const active = projects.filter((item) => item.status === "Aktiv").length;
  const paused = projects.filter((item) => item.status === "Pausiert").length;
  const completed = projects.filter(
    (item) => item.status === "Abgeschlossen",
  ).length;
  const projectVolume = projects.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const newestProject = projects[0];

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projektstatus</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lokaler Überblick für die Beta. Team- und Cloud-Synchronisierung ist
            hier bewusst ausgeblendet.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["Aktiv", active],
            ["Pausiert", paused],
            ["Abgeschlossen", completed],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projektkontext</CardTitle>
          <p className="text-sm text-muted-foreground">
            Kundenzuordnung und Details folgen im nächsten Ausbauschritt.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border bg-background p-3">
            <p className="text-sm text-muted-foreground">Lokales Projektvolumen</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatAmount(projectVolume) ?? "0 €"}
            </p>
          </div>
          {newestProject ? (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Zuletzt oben in der Liste</p>
              <p className="text-muted-foreground">
                {newestProject.id} - Status {newestProject.status}
              </p>
            </div>
          ) : (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Noch kein Projekt vorhanden.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function CustomerModuleSummary({
  customers,
  projects,
  quotes,
}: {
  customers: BetaEntity[];
  projects: BetaEntity[];
  quotes: BetaEntity[];
}) {
  const active = customers.filter((item) => item.status === "Aktiv").length;
  const prospects = customers.filter((item) => item.status === "Interessent").length;
  const archived = customers.filter((item) => item.status === "Archiviert").length;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kundenstatus</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lokale Kundenbasis für Projekte und Angebote, ohne CRM- oder
            Cloud-Synchronisierung.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["Aktiv", active],
            ["Interessent", prospects],
            ["Archiviert", archived],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Beziehungen</CardTitle>
          <p className="text-sm text-muted-foreground">
            Die lokale Verknüpfung zu Projekten und Angeboten wird als nächster
            Schritt ausgebaut.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">Lokale Projekte</p>
              <p className="mt-1 text-2xl font-semibold">{projects.length}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">Lokale Angebote</p>
              <p className="mt-1 text-2xl font-semibold">{quotes.length}</p>
            </div>
          </div>
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Kundendaten bleiben in dieser Beta lokal gespeichert und sind nach
            Reload oder Desktop-Neustart weiter verfügbar.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function QuoteModuleSummary({
  quotes,
  projects,
  customers,
}: {
  quotes: BetaEntity[];
  projects: BetaEntity[];
  customers: BetaEntity[];
}) {
  const draft = quotes.filter((item) => item.status === "Entwurf").length;
  const sent = quotes.filter((item) => item.status === "Gesendet").length;
  const accepted = quotes.filter((item) => item.status === "Angenommen").length;
  const quoteVolume = quotes.reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Angebotspipeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lokale Angebotsstände für die Beta. Mailversand, Freigaben und
            Cloud-Batchfunktionen bleiben ausgeblendet.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["Entwurf", draft],
            ["Gesendet", sent],
            ["Angenommen", accepted],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ausgabe & Kontext</CardTitle>
          <p className="text-sm text-muted-foreground">
            Angebote können lokal als Beta-JSON exportiert werden.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border bg-background p-3">
            <p className="text-sm text-muted-foreground">Lokales Angebotsvolumen</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatAmount(quoteVolume) ?? "0 €"}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Verfügbare Basisdaten</p>
              <p className="text-muted-foreground">
                {customers.length} Kunden, {projects.length} Projekte lokal
                gespeichert.
              </p>
            </div>
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Produktive PDF-Layouts und E-Mail-Versand folgen nach dem lokalen
              Beta-Smoke.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function InvoiceModuleSummary({
  invoices,
  quotes,
  projects,
}: {
  invoices: BetaEntity[];
  quotes: BetaEntity[];
  projects: BetaEntity[];
}) {
  const open = invoices.filter((item) => item.status === "Offen");
  const paid = invoices.filter((item) => item.status === "Bezahlt").length;
  const exported = invoices.filter((item) => item.status === "Exportiert").length;
  const openVolume = open.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const totalVolume = invoices.reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rechnungsstatus</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lokale Ausgangsrechnungen für die Beta. Mahnwesen, Banking und
            Cloud-Abgleich bleiben ausgeblendet.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["Offen", open.length],
            ["Bezahlt", paid],
            ["Exportiert", exported],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Druck & Summen</CardTitle>
          <p className="text-sm text-muted-foreground">
            Rechnungen nutzen das lokale Drucklayout mit Briefkopf und Brieffuß.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">Offene Summe</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatAmount(openVolume) ?? "0 €"}
              </p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">Rechnungsvolumen</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatAmount(totalVolume) ?? "0 €"}
              </p>
            </div>
          </div>
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Grundlage lokal verfügbar: {quotes.length} Angebote und{" "}
            {projects.length} Projekte. Produktive PDF-Nummernkreise und
            GoBD-Prüfung folgen später.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function CalendarModuleSummary({
  appointments,
  projects,
  customers,
}: {
  appointments: BetaEntity[];
  projects: BetaEntity[];
  customers: BetaEntity[];
}) {
  const planned = appointments.filter((item) => item.status === "Geplant");
  const completed = appointments.filter((item) => item.status === "Erledigt").length;
  const canceled = appointments.filter((item) => item.status === "Abgesagt").length;
  const nextAppointment = planned
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Terminstatus</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lokale Terminplanung für die Beta. Externe Kalender-Synchronisierung
            bleibt ausgeblendet.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["Geplant", planned.length],
            ["Erledigt", completed],
            ["Abgesagt", canceled],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nächster Termin</CardTitle>
          <p className="text-sm text-muted-foreground">
            Projekt- und Kundenbezug wird lokal vorbereitet.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {nextAppointment ? (
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">Als nächstes geplant</p>
              <p className="mt-1 font-semibold">{nextAppointment.title}</p>
              <p className="text-sm text-muted-foreground">
                {nextAppointment.date} - {nextAppointment.subtitle}
              </p>
            </div>
          ) : (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Kein geplanter Termin vorhanden.
            </p>
          )}
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Lokaler Kontext: {projects.length} Projekte und {customers.length}{" "}
            Kunden stehen für spätere Zuordnung bereit.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function PrintSettingsPreview({ settings }: { settings: PrintSettings }) {
  return (
    <div
      aria-label="Drucklayout Vorschau"
      className="rounded-md border bg-background p-4 text-sm"
      role="region"
    >
      <div className="flex items-start justify-between gap-4 border-b pb-4">
        <p className="whitespace-pre-line font-medium">{settings.letterhead}</p>
        <div className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Lokale Beta-Vorschau
          <br />
          A4
        </div>
      </div>
      <div className="py-6">
        <p className="text-lg font-semibold">Angebot / Rechnung</p>
        <p className="mt-2 text-muted-foreground">
          Diese Vorschau zeigt Briefkopf, Brieffuß und Druckabstand. Echte
          Positionen und PDF-Layout folgen im nächsten Ausbauschritt.
        </p>
      </div>
      <div className="border-t pt-4 text-xs text-muted-foreground">
        <p className="whitespace-pre-line">{settings.footer}</p>
      </div>
    </div>
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
  onPrint,
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
  onPrint?: (entityKey: keyof BetaStore, item: BetaEntity) => void;
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
                {entityKey && onPrint ? (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Eintrag ${item.title} Druckansicht öffnen`}
                    onClick={() => onPrint(entityKey, item)}
                  >
                    <Printer className="h-4 w-4" />
                    Druckansicht
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
  const [updateStatus, setUpdateStatus] = useState("Noch nicht geprüft.");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() =>
    readPrintSettings(),
  );
  const canCheckDesktopUpdates = Boolean(
    window.desktop?.isDesktop && window.desktop.checkForUpdates,
  );

  const saveBackup = () => {
    downloadBetaBackup();
    setMessage("Datensicherung wurde erstellt.");
  };

  const importBackup = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as {
        store?: BetaStore;
        printSettings?: unknown;
      };
      if (!parsed.store) {
        throw new Error("missing store");
      }
      const nextStore = normalizeBetaStore(parsed.store);
      localStorage.setItem(STORE_KEY, JSON.stringify(nextStore));
      if (parsed.printSettings) {
        const nextPrintSettings = normalizePrintSettings(parsed.printSettings);
        savePrintSettings(nextPrintSettings);
        setPrintSettings(nextPrintSettings);
      }
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

  const updatePrintSettings = (next: PrintSettings) => {
    setPrintSettings(next);
    savePrintSettings(next);
    setMessage("Drucklayout wurde lokal gespeichert.");
  };

  const checkDesktopUpdates = async () => {
    if (!window.desktop?.checkForUpdates) {
      setUpdateStatus("Update-Checks sind nur in der Desktop-App verfügbar.");
      return;
    }

    setIsCheckingUpdate(true);
    setUpdateStatus("Suche nach Updates...");

    try {
      const result = await window.desktop.checkForUpdates();
      if (result.ok) {
        setUpdateStatus("Update-Check wurde gestartet.");
      } else if (result.reason === "dev_mode") {
        setUpdateStatus("Update-Checks sind im Entwicklungsmodus deaktiviert.");
      } else if (result.reason === "check_failed") {
        setUpdateStatus(DESKTOP_BETA_UPDATE_LIMITATION);
      } else {
        setUpdateStatus(result.message || "Update-Check konnte nicht ausgeführt werden.");
      }
    } catch {
      setUpdateStatus(DESKTOP_BETA_UPDATE_LIMITATION);
    } finally {
      setIsCheckingUpdate(false);
    }
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Drucklayout</CardTitle>
          <p className="text-sm text-muted-foreground">
            Briefkopf und Brieffuß werden lokal gespeichert und in der
            Druckansicht von Angeboten und Rechnungen verwendet.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Briefkopf</span>
              <Textarea
                aria-label="Briefkopf für Drucklayout"
                className="min-h-28"
                value={printSettings.letterhead}
                onChange={(event) =>
                  updatePrintSettings({
                    ...printSettings,
                    letterhead: event.target.value,
                  })
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Brieffuß</span>
              <Textarea
                aria-label="Brieffuß für Drucklayout"
                className="min-h-28"
                value={printSettings.footer}
                onChange={(event) =>
                  updatePrintSettings({
                    ...printSettings,
                    footer: event.target.value,
                  })
                }
              />
            </label>
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Drucker, Papierfach, Skalierung und Zielgerät werden im nativen
              Druckdialog des Betriebssystems gewählt. Diese Beta liefert die
              lokale Dokumentansicht dafür.
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Vorschau</p>
            <PrintSettingsPreview settings={printSettings} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="font-medium">Desktop-Updates</p>
            <p className="text-sm text-muted-foreground">
              Der lokale Beta-Build prüft den nativen Update-Kanal ohne Cloud-Pflicht.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={() => void checkDesktopUpdates()}
              disabled={!canCheckDesktopUpdates || isCheckingUpdate}
            >
              {isCheckingUpdate ? "Updater läuft..." : "Updater prüfen"}
            </Button>
            <p
              className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
              aria-live="polite"
            >
              {updateStatus}
            </p>
          </div>
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
      <Route path="/login" element={<ProductLoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
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
                      moduleSummary={<ProjectModuleSummary projects={store.projects} />}
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
                      printable
                      moduleSummary={
                        <QuoteModuleSummary
                          quotes={store.quotes}
                          projects={store.projects}
                          customers={store.customers}
                        />
                      }
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
                      printable
                      moduleSummary={
                        <InvoiceModuleSummary
                          invoices={store.invoices}
                          quotes={store.quotes}
                          projects={store.projects}
                        />
                      }
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
                      moduleSummary={
                        <CalendarModuleSummary
                          appointments={store.appointments}
                          projects={store.projects}
                          customers={store.customers}
                        />
                      }
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
                      moduleSummary={
                        <CustomerModuleSummary
                          customers={store.customers}
                          projects={store.projects}
                          quotes={store.quotes}
                        />
                      }
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
          </ProtectedRoute>
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
    <LanguageProvider defaultLanguage="de">
      <AuthProvider>
        <Router>
          <BetaErrorBoundary onError={onDesktopError}>
            <BetaRoutes />
          </BetaErrorBoundary>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
