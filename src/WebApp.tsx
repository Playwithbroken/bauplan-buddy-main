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
  customerId?: string;
  projectId?: string;
  documentSource?: "manual" | "imported" | "linked";
  documentPath?: string;
  originalPath?: string;
  fileSize?: number;
  mimeType?: string;
  missing?: boolean;
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
  paperSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  marginPreset: "compact" | "normal" | "wide";
};

type BetaBackupFile = {
  documentId: string;
  filename: string;
  source: "imported" | "linked";
  mimeType?: string;
  size?: number;
  dataBase64: string;
};

type BetaBackupPayload = {
  app: "Bauplan Buddy";
  type: "desktop-beta-backup";
  version: string;
  exportedAt: string;
  store: BetaStore;
  printSettings: PrintSettings;
  documentStorage: string;
  documentFiles: BetaBackupFile[];
  documentFileWarnings: string[];
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
  orientation: "portrait",
  marginPreset: "normal",
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
      customerId: "KND-001",
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
      customerId: "KND-001",
      projectId: "PRJ-001",
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
      customerId: "KND-001",
      projectId: "PRJ-001",
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
      customerId: "KND-001",
      projectId: "PRJ-001",
    },
  ],
  documents: [
    {
      id: "DOK-001",
      title: "Bauzeitenplan.pdf",
      subtitle: "Demo-Eintrag ohne Datei",
      status: "Verfügbar",
      date: "2026-05-16",
      projectId: "PRJ-001",
      documentSource: "manual",
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
    customerId:
      typeof source.customerId === "string" ? source.customerId : fallback.customerId,
    projectId:
      typeof source.projectId === "string" ? source.projectId : fallback.projectId,
    documentSource:
      source.documentSource === "imported" ||
      source.documentSource === "linked" ||
      source.documentSource === "manual"
        ? source.documentSource
        : fallback.documentSource,
    documentPath:
      typeof source.documentPath === "string"
        ? source.documentPath
        : fallback.documentPath,
    originalPath:
      typeof source.originalPath === "string"
        ? source.originalPath
        : fallback.originalPath,
    fileSize:
      typeof source.fileSize === "number" ? source.fileSize : fallback.fileSize,
    mimeType:
      typeof source.mimeType === "string" ? source.mimeType : fallback.mimeType,
    missing:
      typeof source.missing === "boolean" ? source.missing : fallback.missing,
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
  const paperSize = source.paperSize === "Letter" ? "Letter" : "A4";
  const orientation =
    source.orientation === "landscape" ? "landscape" : "portrait";
  const marginPreset =
    source.marginPreset === "compact" || source.marginPreset === "wide"
      ? source.marginPreset
      : "normal";

  return {
    letterhead:
      typeof source.letterhead === "string"
        ? source.letterhead
        : defaultPrintSettings.letterhead,
    footer:
      typeof source.footer === "string"
        ? source.footer
        : defaultPrintSettings.footer,
    paperSize,
    orientation,
    marginPreset,
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

function parseLocalAmountInput(value: string):
  | { ok: true; value: number | null }
  | { ok: false } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };

  const compact = trimmed.replace(/\s/g, "").replace(/€/g, "");
  if (!/^\d[\d.,]*$/.test(compact)) return { ok: false };

  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  let normalized = compact;

  if (lastComma >= 0 && lastDot >= 0) {
    normalized =
      lastComma > lastDot
        ? compact.replace(/\./g, "").replace(",", ".")
        : compact.replace(/,/g, "");
  } else if (lastComma >= 0) {
    normalized = compact.replace(",", ".");
  } else if (lastDot >= 0) {
    const parts = compact.split(".");
    normalized =
      parts.length > 2 || parts.at(-1)?.length === 3
        ? compact.replace(/\./g, "")
        : compact;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return { ok: false };
  return { ok: true, value: Math.round(parsed * 100) / 100 };
}

function formatFileSize(value?: number) {
  if (typeof value !== "number" || value < 0) return null;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function getStatusBadgeClass(status: string) {
  const normalizedStatus = status.toLocaleLowerCase("de-DE");

  if (
    ["bezahlt", "erledigt", "angenommen", "abgeschlossen", "geprüft"].includes(
      normalizedStatus,
    )
  ) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (
    ["offen", "entwurf", "geplant", "aktiv", "verfügbar"].includes(
      normalizedStatus,
    )
  ) {
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  }

  if (
    ["pausiert", "gesendet", "exportiert", "interessent"].includes(
      normalizedStatus,
    )
  ) {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  if (["abgesagt", "archiviert"].includes(normalizedStatus)) {
    return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }

  return "bg-muted text-muted-foreground";
}

function getFileNameFromPath(filePath: string) {
  return filePath.split(/[\\/]/).filter(Boolean).pop() || "Dokument";
}

function getDocumentPath(item: BetaEntity) {
  return item.documentSource === "imported"
    ? item.documentPath
    : item.originalPath || item.documentPath;
}

function findEntityTitle(items: BetaEntity[], id?: string) {
  if (!id) return null;
  return items.find((item) => item.id === id)?.title ?? null;
}

function getEntityContextLabel(
  item: BetaEntity,
  projects: BetaEntity[] = [],
  customers: BetaEntity[] = [],
) {
  const labels = [
    findEntityTitle(customers, item.customerId),
    findEntityTitle(projects, item.projectId),
  ].filter(Boolean);

  return labels.length ? labels.join(" / ") : null;
}

function getEntityExportContext(item: BetaEntity, store: BetaStore) {
  const customerTitle = findEntityTitle(store.customers, item.customerId);
  const projectTitle = findEntityTitle(store.projects, item.projectId);

  return {
    customerId: item.customerId,
    customerTitle,
    projectId: item.projectId,
    projectTitle,
    label: getEntityContextLabel(item, store.projects, store.customers),
  };
}

async function collectDocumentFilesForBackup(store: BetaStore) {
  const documentFiles: BetaBackupFile[] = [];
  const documentFileWarnings: string[] = [];

  if (!window.desktop?.readFile) {
    const hasFileDocuments = store.documents.some(
      (item) => item.documentSource === "imported" || item.documentSource === "linked",
    );
    if (hasFileDocuments) {
      documentFileWarnings.push(
        "Dateiinhalte konnten in dieser Umgebung nicht gelesen werden.",
      );
    }
    return { documentFiles, documentFileWarnings };
  }

  for (const item of store.documents) {
    if (item.documentSource !== "imported" && item.documentSource !== "linked") {
      continue;
    }

    const targetPath = getDocumentPath(item);
    if (!targetPath) {
      documentFileWarnings.push(`${item.id}: kein Dateipfad vorhanden.`);
      continue;
    }

    const result = await window.desktop.readFile(targetPath);
    if (!result.ok || !result.dataBase64) {
      documentFileWarnings.push(
        `${item.id}: Datei konnte nicht in die Sicherung aufgenommen werden.`,
      );
      continue;
    }

    documentFiles.push({
      documentId: item.id,
      filename: result.name || item.title || getFileNameFromPath(targetPath),
      source: item.documentSource,
      mimeType: result.mimeType || item.mimeType,
      size: result.size ?? item.fileSize,
      dataBase64: result.dataBase64,
    });
  }

  return { documentFiles, documentFileWarnings };
}

async function buildBetaBackup(): Promise<BetaBackupPayload> {
  const store = readBetaStore();
  const { documentFiles, documentFileWarnings } =
    await collectDocumentFilesForBackup(store);

  return {
    app: "Bauplan Buddy",
    type: "desktop-beta-backup",
    version: "0.0.2-beta.17",
    exportedAt: new Date().toISOString(),
    store,
    printSettings: readPrintSettings(),
    documentStorage:
      "Metadaten, Dateipfade und verfügbare lokale Dokumentdateien werden gesichert.",
    documentFiles,
    documentFileWarnings,
  };
}

async function downloadBetaBackup() {
  downloadJsonFile("bauplan-buddy-beta-backup", await buildBetaBackup());
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
  const store = readBetaStore();
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
    context: getEntityExportContext(item, store),
    record: item,
  });
}

async function restoreDocumentFilesFromBackup(
  store: BetaStore,
  documentFiles: BetaBackupFile[],
) {
  if (!documentFiles.length || !window.desktop?.writeFile) return store;

  const restoredById = new Map<string, BetaBackupFile & { path: string }>();

  for (const file of documentFiles) {
    const safeName = `${Date.now()}-${file.documentId}-${file.filename}`;
    const result = await window.desktop.writeFile(safeName, file.dataBase64);
    if (result.ok && result.path) {
      restoredById.set(file.documentId, {
        ...file,
        path: result.path,
        mimeType: file.mimeType || result.mimeType,
      });
    }
  }

  if (!restoredById.size) return store;

  return {
    ...store,
    documents: store.documents.map((item) => {
      const restored = restoredById.get(item.id);
      if (!restored) return item;

      return {
        ...item,
        title: item.title || restored.filename,
        subtitle: "Aus Datensicherung wiederhergestellt",
        documentSource: "imported" as const,
        documentPath: restored.path,
        originalPath: item.originalPath,
        fileSize: restored.size,
        mimeType: restored.mimeType,
        missing: false,
      };
    }),
  };
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

function getPrintLayout(settings: PrintSettings) {
  const paper =
    settings.paperSize === "Letter"
      ? { portraitWidth: "216mm", portraitHeight: "279mm" }
      : { portraitWidth: "210mm", portraitHeight: "297mm" };
  const marginMm =
    settings.marginPreset === "compact"
      ? 12
      : settings.marginPreset === "wide"
        ? 24
        : 18;
  const isLandscape = settings.orientation === "landscape";

  return {
    pageWidth: isLandscape ? paper.portraitHeight : paper.portraitWidth,
    pageHeight: isLandscape ? paper.portraitWidth : paper.portraitHeight,
    marginMm,
    label: `${settings.paperSize}, ${
      isLandscape ? "Querformat" : "Hochformat"
    }, ${settings.marginPreset === "compact" ? "schmale" : settings.marginPreset === "wide" ? "breite" : "normale"} Ränder`,
  };
}

function openBetaPrintPreview(entityKey: keyof BetaStore, item: BetaEntity) {
  const store = readBetaStore();
  const printSettings = readPrintSettings();
  const printLayout = getPrintLayout(printSettings);
  const documentLabels: Record<keyof BetaStore, string> = {
    projects: "Projekt",
    quotes: "Angebot",
    invoices: "Rechnung",
    customers: "Kunde",
    appointments: "Termin",
    documents: "Dokument",
  };
  const amount = formatAmount(item.amount);
  const context = getEntityExportContext(item, store);
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
    @page {
      size: ${printSettings.paperSize} ${printSettings.orientation};
      margin: ${printLayout.marginMm}mm;
    }
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
      width: ${printLayout.pageWidth};
      min-height: ${printLayout.pageHeight};
      margin: 18px auto;
      padding: ${printLayout.marginMm}mm;
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
      <div class="doc-type">Lokale Beta-Druckansicht<br />${documentLabels[entityKey]}<br />${printLayout.label}</div>
    </header>
    <h1>${escapeHtml(item.title)}</h1>
    <p>${escapeHtml(item.subtitle)}</p>
    <dl class="meta">
      <dt>Nummer</dt><dd>${escapeHtml(item.id)}</dd>
      <dt>Status</dt><dd>${escapeHtml(item.status)}</dd>
      <dt>Datum</dt><dd>${escapeHtml(item.date)}</dd>
      ${context.customerTitle ? `<dt>Kunde</dt><dd>${escapeHtml(context.customerTitle)}</dd>` : ""}
      ${context.projectTitle ? `<dt>Projekt</dt><dd>${escapeHtml(context.projectTitle)}</dd>` : ""}
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
            <Button variant="outline" onClick={() => void downloadBetaBackup()}>
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

  const updateEntityTitle = (
    key: keyof BetaStore,
    id: string,
    title: string,
    subtitle?: string,
    amount?: number | null,
  ) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    const nextSubtitle = subtitle?.trim();

    saveStore({
      ...store,
      [key]: store[key].map((item) =>
        item.id === id
          ? {
              ...item,
              title: nextTitle,
              subtitle:
                subtitle === undefined
                  ? item.subtitle
                  : nextSubtitle || "Keine Beschreibung",
              amount:
                amount === undefined
                  ? item.amount
                  : amount === null
                    ? undefined
                    : amount,
            }
          : item,
      ),
    });
  };

  const updateEntityRelation = (
    key: keyof BetaStore,
    id: string,
    relation: "customerId" | "projectId",
    value: string,
  ) => {
    const nextValue = value || undefined;
    saveStore({
      ...store,
      [key]: store[key].map((item) =>
        item.id === id ? { ...item, [relation]: nextValue } : item,
      ),
    });
  };

  const deleteEntity = (key: keyof BetaStore, id: string) => {
    const nextStore: BetaStore = {
      ...store,
      [key]: store[key].filter((item) => item.id !== id),
    };
    const relation =
      key === "customers" ? "customerId" : key === "projects" ? "projectId" : null;

    if (relation) {
      (Object.keys(nextStore) as Array<keyof BetaStore>).forEach((storeKey) => {
        nextStore[storeKey] = nextStore[storeKey].map((item) =>
          item[relation] === id ? { ...item, [relation]: undefined } : item,
        );
      });
    }

    saveStore(nextStore);
  };

  const addImportedDocument = async () => {
    if (
      !window.desktop?.openFileDialog ||
      !window.desktop.readFile ||
      !window.desktop.writeFile
    ) {
      window.alert("Datei-Import ist nur in der Desktop-App verfügbar.");
      return;
    }

    const selection = await window.desktop.openFileDialog(
      [
        {
          name: "Dokumente",
          extensions: ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "txt"],
        },
      ],
      ["openFile"],
      "Dokument importieren",
    );
    const sourcePath = selection.filePaths[0];
    if (selection.canceled || !sourcePath) return;

    const readResult = await window.desktop.readFile(sourcePath);
    if (!readResult.ok || !readResult.dataBase64) {
      window.alert(readResult.message || "Die Datei konnte nicht gelesen werden.");
      return;
    }

    const safeName = `${Date.now()}-${
      readResult.name || getFileNameFromPath(sourcePath)
    }`;
    const writeResult = await window.desktop.writeFile(
      safeName,
      readResult.dataBase64,
    );
    if (!writeResult.ok || !writeResult.path) {
      window.alert(writeResult.message || "Die Datei konnte nicht importiert werden.");
      return;
    }

    const nextDocument: BetaEntity = {
      id: nextEntityId(store.documents, "DOK"),
      title: readResult.name || getFileNameFromPath(sourcePath),
      subtitle: "Importiert in Bauplan Buddy",
      status: "Verfügbar",
      date: new Date().toISOString().slice(0, 10),
      documentSource: "imported",
      documentPath: writeResult.path,
      originalPath: sourcePath,
      fileSize: readResult.size,
      mimeType: readResult.mimeType || writeResult.mimeType,
      missing: false,
    };
    saveStore({ ...store, documents: [nextDocument, ...store.documents] });
  };

  const addLinkedDocument = async () => {
    if (!window.desktop?.openFileDialog) {
      window.alert("Datei-Verlinkung ist nur in der Desktop-App verfügbar.");
      return;
    }

    const selection = await window.desktop.openFileDialog(
      [
        {
          name: "Dokumente",
          extensions: ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "txt"],
        },
      ],
      ["openFile"],
      "Dokument verlinken",
    );
    const sourcePath = selection.filePaths[0];
    if (selection.canceled || !sourcePath) return;

    const nextDocument: BetaEntity = {
      id: nextEntityId(store.documents, "DOK"),
      title: getFileNameFromPath(sourcePath),
      subtitle: "Verlinkte lokale Datei",
      status: "Verfügbar",
      date: new Date().toISOString().slice(0, 10),
      documentSource: "linked",
      originalPath: sourcePath,
      missing: false,
    };
    saveStore({ ...store, documents: [nextDocument, ...store.documents] });
  };

  const updateDocumentMissing = (id: string, missing: boolean) => {
    saveStore({
      ...store,
      documents: store.documents.map((item) =>
        item.id === id ? { ...item, missing } : item,
      ),
    });
  };

  const openDocument = async (id: string) => {
    const documentItem = store.documents.find((item) => item.id === id);
    const targetPath = documentItem ? getDocumentPath(documentItem) : undefined;
    if (!documentItem || !targetPath) {
      window.alert("Für diesen Dokumenteintrag ist noch keine Datei hinterlegt.");
      return;
    }
    if (!window.desktop?.fileExists || !window.desktop.openPath) {
      window.alert("Dateien können nur in der Desktop-App geöffnet werden.");
      return;
    }

    const exists = await window.desktop.fileExists(targetPath);
    if (!exists.ok || !exists.exists) {
      updateDocumentMissing(id, true);
      window.alert("Die verknüpfte Datei wurde nicht gefunden. Bitte neu zuordnen.");
      return;
    }

    const opened = await window.desktop.openPath(targetPath);
    if (!opened.ok) {
      window.alert(opened.message || "Die Datei konnte nicht geöffnet werden.");
      return;
    }
    if (documentItem.missing) updateDocumentMissing(id, false);
  };

  const relinkDocument = async (id: string) => {
    if (!window.desktop?.openFileDialog) {
      window.alert("Neu zuordnen ist nur in der Desktop-App verfügbar.");
      return;
    }

    const selection = await window.desktop.openFileDialog(
      [
        {
          name: "Dokumente",
          extensions: ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "txt"],
        },
      ],
      ["openFile"],
      "Dokument neu zuordnen",
    );
    const sourcePath = selection.filePaths[0];
    if (selection.canceled || !sourcePath) return;

    const existingDocument = store.documents.find((item) => item.id === id);
    let nextDocumentPath = existingDocument?.documentPath;
    let nextFileSize = existingDocument?.fileSize;
    let nextMimeType = existingDocument?.mimeType;

    if (existingDocument?.documentSource === "imported") {
      if (!window.desktop.readFile || !window.desktop.writeFile) {
        window.alert(
          "Importierte Dateien können nur in der Desktop-App neu zugeordnet werden.",
        );
        return;
      }
      const readResult = await window.desktop.readFile(sourcePath);
      if (!readResult.ok || !readResult.dataBase64) {
        window.alert(readResult.message || "Die Datei konnte nicht gelesen werden.");
        return;
      }
      const safeName = `${Date.now()}-${
        readResult.name || getFileNameFromPath(sourcePath)
      }`;
      const writeResult = await window.desktop.writeFile(
        safeName,
        readResult.dataBase64,
      );
      if (!writeResult.ok || !writeResult.path) {
        window.alert(writeResult.message || "Die Datei konnte nicht importiert werden.");
        return;
      }
      nextDocumentPath = writeResult.path;
      nextFileSize = readResult.size;
      nextMimeType = readResult.mimeType || writeResult.mimeType;
    }

    saveStore({
      ...store,
      documents: store.documents.map((item) =>
        item.id === id
          ? {
              ...item,
              title:
                item.documentSource === "linked"
                  ? getFileNameFromPath(sourcePath)
                  : item.title,
              subtitle:
                item.documentSource === "imported"
                  ? "Importierte Datei neu zugeordnet"
                  : "Verlinkte lokale Datei",
              documentPath:
                item.documentSource === "imported" ? nextDocumentPath : undefined,
              originalPath: sourcePath,
              fileSize: nextFileSize,
              mimeType: nextMimeType,
              missing: false,
            }
          : item,
      ),
    });
  };

  return {
    store,
    addEntity,
    updateEntityStatus,
    updateEntityTitle,
    updateEntityRelation,
    deleteEntity,
    addImportedDocument,
    addLinkedDocument,
    openDocument,
    relinkDocument,
  };
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
              ? "Lokal zuerst, ohne Cloud-Pflicht"
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
          <SidebarTrigger
            aria-label="Seitenleiste umschalten"
            title="Seitenleiste umschalten"
          />
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
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${getStatusBadgeClass(item.status)}`}
                      >
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
  onRelationChange,
  onDelete,
  onImportDocument,
  onLinkDocument,
  onOpenDocument,
  onRelinkDocument,
  placeholder,
  statusOptions,
  emptyText,
  exportable = false,
  printable = false,
  moduleSummary,
  projects = [],
  customers = [],
}: {
  title: string;
  description: string;
  entityKey: keyof BetaStore;
  items: BetaEntity[];
  onAdd: (title: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onTitleChange: (
    id: string,
    title: string,
    subtitle?: string,
    amount?: number | null,
  ) => void;
  onRelationChange?: (
    id: string,
    relation: "customerId" | "projectId",
    value: string,
  ) => void;
  onDelete: (id: string) => void;
  onImportDocument?: () => void;
  onLinkDocument?: () => void;
  onOpenDocument?: (id: string) => void;
  onRelinkDocument?: (id: string) => void;
  placeholder: string;
  statusOptions: string[];
  emptyText: string;
  exportable?: boolean;
  printable?: boolean;
  moduleSummary?: ReactNode;
  projects?: BetaEntity[];
  customers?: BetaEntity[];
}) {
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortMode, setSortMode] = useState<"newest" | "title" | "status">(
    "newest",
  );
  const entityCopy = {
    projects: { plural: "Projekte", dativePlural: "Projekten" },
    quotes: { plural: "Angebote", dativePlural: "Angeboten" },
    invoices: { plural: "Rechnungen", dativePlural: "Rechnungen" },
    appointments: { plural: "Termine", dativePlural: "Terminen" },
    customers: { plural: "Kunden", dativePlural: "Kunden" },
    documents: { plural: "Dokumente", dativePlural: "Dokumenten" },
    printSettings: { plural: "Drucklayouts", dativePlural: "Drucklayouts" },
  }[entityKey];
  const normalizedFilter = filter.trim().toLocaleLowerCase("de-DE");
  const filtered = useMemo(() => {
    const nextItems = items.filter((item) =>
      (!statusFilter || item.status === statusFilter) &&
      (!normalizedFilter ||
        [
          item.id,
          item.title,
          item.subtitle,
          item.status,
          getEntityContextLabel(item, projects, customers) ?? "",
        ].some((value) =>
          value.toLocaleLowerCase("de-DE").includes(normalizedFilter),
        )),
    );

    return [...nextItems].sort((left, right) => {
      if (sortMode === "title") {
        return left.title.localeCompare(right.title, "de-DE");
      }
      if (sortMode === "status") {
        return (
          left.status.localeCompare(right.status, "de-DE") ||
          left.title.localeCompare(right.title, "de-DE")
        );
      }
      return (
        right.date.localeCompare(left.date) ||
        right.id.localeCompare(left.id, "de-DE")
      );
    });
  }, [customers, items, normalizedFilter, projects, sortMode, statusFilter]);
  const hasActiveFilter = Boolean(normalizedFilter || statusFilter);
  const resultLabel = hasActiveFilter
    ? `${filtered.length} von ${items.length} ${entityCopy.dativePlural} sichtbar`
    : `${items.length} ${entityCopy.plural}`;

  return (
    <Page title={title} description={description}>
      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Input
              aria-label={placeholder}
              className="min-w-[220px] flex-1"
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
            {entityKey === "documents" && onImportDocument ? (
              <Button
                className="shrink-0"
                variant="outline"
                onClick={onImportDocument}
              >
                Datei importieren
              </Button>
            ) : null}
            {entityKey === "documents" && onLinkDocument ? (
              <Button
                className="shrink-0"
                variant="outline"
                onClick={onLinkDocument}
              >
                Datei verlinken
              </Button>
            ) : null}
          </div>
          <div className="space-y-2">
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
            <div>
              <select
                aria-label={`${title} nach Status filtern`}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">Alle Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                aria-label={`${title} sortieren`}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={sortMode}
                onChange={(event) =>
                  setSortMode(
                    event.target.value === "title" ||
                      event.target.value === "status"
                      ? event.target.value
                      : "newest",
                  )
                }
              >
                <option value="newest">Neueste zuerst</option>
                <option value="title">Name A-Z</option>
                <option value="status">Status A-Z</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground" role="status">
                {resultLabel}
              </p>
              {hasActiveFilter ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilter("");
                    setStatusFilter("");
                  }}
                >
                  Filter löschen
                </Button>
              ) : null}
            </div>
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
        onRelationChange={onRelationChange}
        onDelete={onDelete}
        onExport={exportable ? downloadBetaEntityExport : undefined}
        onPrint={printable ? openBetaPrintPreview : undefined}
        onOpenDocument={onOpenDocument}
        onRelinkDocument={onRelinkDocument}
        projects={projects}
        customers={customers}
        emptyText={
          normalizedFilter
            ? `Keine passenden ${entityCopy.plural} gefunden.`
            : statusFilter
              ? `Keine ${entityCopy.plural} mit Status ${statusFilter} vorhanden.`
            : emptyText
        }
      />
    </Page>
  );
}

function ProjectModuleSummary({
  projects,
  customers,
}: {
  projects: BetaEntity[];
  customers: BetaEntity[];
}) {
  const active = projects.filter((item) => item.status === "Aktiv").length;
  const paused = projects.filter((item) => item.status === "Pausiert").length;
  const completed = projects.filter(
    (item) => item.status === "Abgeschlossen",
  ).length;
  const projectVolume = projects.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const newestProject = projects[0];
  const linkedProjects = projects.filter((item) => item.customerId).length;

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
          <div className="rounded-md border bg-background p-3">
            <p className="text-sm text-muted-foreground">Mit Kunde verknüpft</p>
            <p className="mt-1 text-2xl font-semibold">{linkedProjects}</p>
            <p className="text-xs text-muted-foreground">
              {customers.length} Kunden lokal verfügbar
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
  const linkedProjects = projects.filter((item) => item.customerId).length;
  const linkedQuotes = quotes.filter((item) => item.customerId).length;

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
              <p className="mt-1 text-2xl font-semibold">{linkedProjects}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">Lokale Angebote</p>
              <p className="mt-1 text-2xl font-semibold">{linkedQuotes}</p>
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
  const linkedQuotes = quotes.filter((item) => item.customerId || item.projectId).length;

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
              <p className="font-medium">Verknüpfte Angebote</p>
              <p className="text-muted-foreground">
                {linkedQuotes} mit Kunde oder Projekt. Basis: {customers.length}{" "}
                Kunden, {projects.length} Projekte.
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
  customers,
}: {
  invoices: BetaEntity[];
  quotes: BetaEntity[];
  projects: BetaEntity[];
  customers: BetaEntity[];
}) {
  const open = invoices.filter((item) => item.status === "Offen");
  const paid = invoices.filter((item) => item.status === "Bezahlt").length;
  const exported = invoices.filter((item) => item.status === "Exportiert").length;
  const openVolume = open.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const totalVolume = invoices.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const linkedInvoices = invoices.filter(
    (item) => item.customerId || item.projectId,
  ).length;

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
            Verknüpft: {linkedInvoices} Rechnungen. Grundlage lokal verfügbar:{" "}
            {customers.length} Kunden, {quotes.length} Angebote und{" "}
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
  const linkedAppointments = appointments.filter(
    (item) => item.customerId || item.projectId,
  ).length;
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
            Verknüpft: {linkedAppointments} Termine. Basis: {projects.length}{" "}
            Projekte und {customers.length} Kunden.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function DocumentModuleSummary({
  documents,
  projects,
  customers,
}: {
  documents: BetaEntity[];
  projects: BetaEntity[];
  customers: BetaEntity[];
}) {
  const available = documents.filter((item) => item.status === "Verfügbar").length;
  const checked = documents.filter((item) => item.status === "Geprüft").length;
  const archived = documents.filter((item) => item.status === "Archiviert").length;
  const imported = documents.filter((item) => item.documentSource === "imported").length;
  const linked = documents.filter((item) => item.documentSource === "linked").length;
  const missing = documents.filter((item) => item.missing).length;
  const assigned = documents.filter((item) => item.projectId || item.customerId).length;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dokumentenstatus</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lokale Dokumenteinträge für die Beta. Dateien können importiert oder
            mit ihrem bestehenden Speicherort verlinkt werden.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["Verfügbar", available],
            ["Geprüft", checked],
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
          <CardTitle className="text-lg">Lokale Dateien</CardTitle>
          <p className="text-sm text-muted-foreground">
            Importierte Dateien werden in den Bauplan-Buddy-Ordner kopiert;
            verlinkte Dateien bleiben am Originalspeicherort.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">Importiert</p>
              <p className="mt-1 text-2xl font-semibold">{imported}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm text-muted-foreground">Verlinkt</p>
              <p className="mt-1 text-2xl font-semibold">{linked}</p>
            </div>
          </div>
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Datei fehlt: {missing}. Zugeordnet: {assigned}. Backups sichern
            verfügbare lokale Datei-Inhalte mit.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function PrintSettingsPreview({ settings }: { settings: PrintSettings }) {
  const printLayout = getPrintLayout(settings);
  const isLandscape = settings.orientation === "landscape";

  return (
    <div
      aria-label="Drucklayout Vorschau"
      className="rounded-md border bg-background p-4 text-sm"
      role="region"
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Druckvorschau</span>
        <span>{printLayout.label}</span>
      </div>
      <div
        className={`mx-auto rounded-sm border bg-white p-4 shadow-sm ${
          isLandscape ? "aspect-[1.414/1] max-w-[360px]" : "aspect-[1/1.414] max-w-[260px]"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b pb-3">
          <p className="whitespace-pre-line text-xs font-medium leading-relaxed">
            {settings.letterhead}
          </p>
          <div className="text-right text-[10px] font-semibold uppercase text-muted-foreground">
            Lokale Beta-Vorschau
            <br />
            {settings.paperSize}
          </div>
        </div>
        <div className="py-5">
          <p className="text-sm font-semibold">Angebot / Rechnung</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Diese Vorschau zeigt Briefkopf, Brieffuß, Ausrichtung und
            Druckabstand. Der Drucker wird anschließend im Betriebssystem
            gewählt.
          </p>
        </div>
        <div className="border-t pt-3 text-[10px] leading-relaxed text-muted-foreground">
          <p className="whitespace-pre-line">{settings.footer}</p>
        </div>
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
  onRelationChange,
  onDelete,
  onExport,
  onPrint,
  onOpenDocument,
  onRelinkDocument,
  projects = [],
  customers = [],
  emptyText = "Noch keine Einträge vorhanden.",
}: {
  title: string;
  entityKey?: keyof BetaStore;
  items: BetaEntity[];
  statusOptions?: string[];
  onStatusChange?: (id: string, status: string) => void;
  onTitleChange?: (
    id: string,
    title: string,
    subtitle?: string,
    amount?: number | null,
  ) => void;
  onRelationChange?: (
    id: string,
    relation: "customerId" | "projectId",
    value: string,
  ) => void;
  onDelete?: (id: string) => void;
  onExport?: (entityKey: keyof BetaStore, item: BetaEntity) => void;
  onPrint?: (entityKey: keyof BetaStore, item: BetaEntity) => void;
  onOpenDocument?: (id: string) => void;
  onRelinkDocument?: (id: string) => void;
  projects?: BetaEntity[];
  customers?: BetaEntity[];
  emptyText?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingSubtitle, setEditingSubtitle] = useState("");
  const [editingAmount, setEditingAmount] = useState("");
  const [editingAmountError, setEditingAmountError] = useState("");
  const canEditAmount =
    entityKey === "projects" || entityKey === "quotes" || entityKey === "invoices";

  const startEditing = (item: BetaEntity) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
    setEditingSubtitle(item.subtitle);
    setEditingAmount(
      typeof item.amount === "number" ? String(Math.round(item.amount)) : "",
    );
    setEditingAmountError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingSubtitle("");
    setEditingAmount("");
    setEditingAmountError("");
  };

  const saveEditing = (item: BetaEntity) => {
    const parsedAmount = parseLocalAmountInput(editingAmount);
    if (canEditAmount && !parsedAmount.ok) {
      setEditingAmountError(
        "Bitte einen gültigen Betrag eingeben, zum Beispiel 123.456,78.",
      );
      return;
    }

    onTitleChange?.(
      item.id,
      editingTitle,
      editingSubtitle,
      canEditAmount && parsedAmount.ok ? parsedAmount.value : undefined,
    );
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
                  <div
                    className={`grid gap-2 lg:items-center ${
                      canEditAmount
                        ? "lg:grid-cols-[minmax(180px,1fr)_minmax(220px,1.3fr)_minmax(140px,0.6fr)_auto]"
                        : "lg:grid-cols-[minmax(180px,1fr)_minmax(220px,1.3fr)_auto]"
                    }`}
                  >
                    <Input
                      aria-label={`Titel für ${item.title} bearbeiten`}
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveEditing(item);
                        if (event.key === "Escape") cancelEditing();
                      }}
                    />
                    <Input
                      aria-label={`Beschreibung für ${item.title} bearbeiten`}
                      value={editingSubtitle}
                      onChange={(event) => setEditingSubtitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveEditing(item);
                        if (event.key === "Escape") cancelEditing();
                      }}
                    />
                    {canEditAmount ? (
                      <Input
                        aria-label={`Betrag für ${item.title} bearbeiten`}
                        inputMode="decimal"
                        value={editingAmount}
                        placeholder="Betrag"
                        aria-invalid={editingAmountError ? "true" : undefined}
                        onChange={(event) => {
                          setEditingAmount(event.target.value);
                          setEditingAmountError("");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveEditing(item);
                          if (event.key === "Escape") cancelEditing();
                        }}
                      />
                    ) : null}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEditing(item)}>
                        Speichern
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEditing}>
                        Abbrechen
                      </Button>
                    </div>
                    {editingAmountError ? (
                      <p
                        className="text-sm text-destructive lg:col-span-full"
                        role="alert"
                      >
                        {editingAmountError}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${getStatusBadgeClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {item.id} - {item.subtitle} - {item.date}
                </p>
                {getEntityContextLabel(item, projects, customers) ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kontext: {getEntityContextLabel(item, projects, customers)}
                  </p>
                ) : null}
                {entityKey === "documents" ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {item.documentSource === "imported"
                        ? "Importiert"
                        : item.documentSource === "linked"
                          ? "Verlinkt"
                          : "Ohne Datei"}
                    </span>
                    {item.missing ? (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                        Datei fehlt
                      </span>
                    ) : null}
                    {formatFileSize(item.fileSize) ? (
                      <span>{formatFileSize(item.fileSize)}</span>
                    ) : null}
                  </div>
                ) : null}
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
                {entityKey &&
                onRelationChange &&
                customers.length > 0 &&
                entityKey !== "customers" ? (
                  <select
                    aria-label={`Kunde für ${item.title}`}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={item.customerId ?? ""}
                    onChange={(event) =>
                      onRelationChange(item.id, "customerId", event.target.value)
                    }
                  >
                    <option value="">Kein Kunde</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.title}
                      </option>
                    ))}
                  </select>
                ) : null}
                {entityKey &&
                onRelationChange &&
                projects.length > 0 &&
                entityKey !== "projects" &&
                entityKey !== "customers" ? (
                  <select
                    aria-label={`Projekt für ${item.title}`}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={item.projectId ?? ""}
                    onChange={(event) =>
                      onRelationChange(item.id, "projectId", event.target.value)
                    }
                  >
                    <option value="">Kein Projekt</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
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
                {entityKey === "documents" && onOpenDocument ? (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Datei ${item.title} öffnen`}
                    onClick={() => onOpenDocument(item.id)}
                  >
                    Öffnen
                  </Button>
                ) : null}
                {entityKey === "documents" && onRelinkDocument ? (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Datei ${item.title} neu zuordnen`}
                    onClick={() => onRelinkDocument(item.id)}
                  >
                    Neu zuordnen
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
  const [backupWarnings, setBackupWarnings] = useState<string[]>([]);
  const [updateStatus, setUpdateStatus] = useState("Noch nicht geprüft.");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() =>
    readPrintSettings(),
  );
  const canCheckDesktopUpdates = Boolean(
    window.desktop?.isDesktop && window.desktop.checkForUpdates,
  );

  const saveBackup = async () => {
    try {
      const backup = await buildBetaBackup();
      downloadJsonFile("bauplan-buddy-beta-backup", backup);
      setBackupWarnings(backup.documentFileWarnings);
      setMessage(
        backup.documentFileWarnings.length
          ? `Datensicherung wurde mit ${backup.documentFileWarnings.length} Dateihinweisen erstellt.`
          : "Datensicherung wurde inklusive verfügbarer Dokumentdateien erstellt.",
      );
    } catch {
      setBackupWarnings([]);
      setMessage("Datensicherung konnte nicht erstellt werden.");
    }
  };

  const importBackup = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as {
        store?: BetaStore;
        printSettings?: unknown;
        documentFiles?: BetaBackupFile[];
      };
      if (!parsed.store) {
        throw new Error("missing store");
      }
      const nextStore = await restoreDocumentFilesFromBackup(
        normalizeBetaStore(parsed.store),
        Array.isArray(parsed.documentFiles) ? parsed.documentFiles : [],
      );
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
    const confirmed = window.confirm(
      "Lokale Beta-Daten wirklich zurücksetzen? Vorhandene Projekte, Kunden, Angebote, Rechnungen, Termine und Dokumenteinträge werden durch Demodaten ersetzt.",
    );
    if (!confirmed) return;

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
              Offline und lokal zuerst. Keine Cloud-Verbindung erforderlich.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-medium">Lokale Kerndaten</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Projekte, Kunden, Angebote, Rechnungen, Termine und
                Dokumenteinträge bleiben im lokalen Beta-Speicher.
              </p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-medium">Drucklayout</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Briefkopf und Brieffuß werden mit Backups gesichert und beim
                Restore wiederhergestellt.
              </p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-medium">Dateien</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Importierte und verlinkte Dokumente sind lokal nutzbar. Backups
                nehmen verfügbare Datei-Inhalte als lokale Beta-Archivdaten mit.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Button variant="outline" onClick={() => void saveBackup()}>
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
          {backupWarnings.length ? (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
              role="alert"
            >
              <p className="font-medium">Dateihinweise zur Datensicherung</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {backupWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
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
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Papierformat</span>
                <select
                  aria-label="Papierformat für Drucklayout"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={printSettings.paperSize}
                  onChange={(event) =>
                    updatePrintSettings({
                      ...printSettings,
                      paperSize: event.target.value === "Letter" ? "Letter" : "A4",
                    })
                  }
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Ausrichtung</span>
                <select
                  aria-label="Ausrichtung für Drucklayout"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={printSettings.orientation}
                  onChange={(event) =>
                    updatePrintSettings({
                      ...printSettings,
                      orientation:
                        event.target.value === "landscape"
                          ? "landscape"
                          : "portrait",
                    })
                  }
                >
                  <option value="portrait">Hochformat</option>
                  <option value="landscape">Querformat</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Ränder</span>
                <select
                  aria-label="Ränder für Drucklayout"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={printSettings.marginPreset}
                  onChange={(event) => {
                    const value = event.target.value;
                    updatePrintSettings({
                      ...printSettings,
                      marginPreset:
                        value === "compact" || value === "wide"
                          ? value
                          : "normal",
                    });
                  }}
                >
                  <option value="compact">Schmal</option>
                  <option value="normal">Normal</option>
                  <option value="wide">Breit</option>
                </select>
              </label>
            </div>
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
    updateEntityRelation,
    deleteEntity,
    addImportedDocument,
    addLinkedDocument,
    openDocument,
    relinkDocument,
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
                      onTitleChange={(id, title, subtitle, amount) =>
                        updateEntityTitle("projects", id, title, subtitle, amount)
                      }
                      onRelationChange={(id, relation, value) =>
                        updateEntityRelation("projects", id, relation, value)
                      }
                      onDelete={(id) => deleteEntity("projects", id)}
                      customers={store.customers}
                      placeholder="Projektname eingeben"
                      statusOptions={["Aktiv", "Pausiert", "Abgeschlossen"]}
                      emptyText="Noch keine Projekte vorhanden."
                      moduleSummary={
                        <ProjectModuleSummary
                          projects={store.projects}
                          customers={store.customers}
                        />
                      }
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
                      onTitleChange={(id, title, subtitle, amount) =>
                        updateEntityTitle("quotes", id, title, subtitle, amount)
                      }
                      onRelationChange={(id, relation, value) =>
                        updateEntityRelation("quotes", id, relation, value)
                      }
                      onDelete={(id) => deleteEntity("quotes", id)}
                      projects={store.projects}
                      customers={store.customers}
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
                      onTitleChange={(id, title, subtitle, amount) =>
                        updateEntityTitle("invoices", id, title, subtitle, amount)
                      }
                      onRelationChange={(id, relation, value) =>
                        updateEntityRelation("invoices", id, relation, value)
                      }
                      onDelete={(id) => deleteEntity("invoices", id)}
                      projects={store.projects}
                      customers={store.customers}
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
                          customers={store.customers}
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
                      onTitleChange={(id, title, subtitle, amount) =>
                        updateEntityTitle("appointments", id, title, subtitle, amount)
                      }
                      onRelationChange={(id, relation, value) =>
                        updateEntityRelation("appointments", id, relation, value)
                      }
                      onDelete={(id) => deleteEntity("appointments", id)}
                      projects={store.projects}
                      customers={store.customers}
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
                      onTitleChange={(id, title, subtitle, amount) =>
                        updateEntityTitle("customers", id, title, subtitle, amount)
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
                      description="Lokale Dokumenteinträge für die Beta. Dateien können importiert, verlinkt und lokal zugeordnet werden."
                      entityKey="documents"
                      items={store.documents}
                      onAdd={(title) => addEntity("documents", title)}
                      onStatusChange={(id, status) =>
                        updateEntityStatus("documents", id, status)
                      }
                      onTitleChange={(id, title, subtitle, amount) =>
                        updateEntityTitle("documents", id, title, subtitle, amount)
                      }
                      onRelationChange={(id, relation, value) =>
                        updateEntityRelation("documents", id, relation, value)
                      }
                      onDelete={(id) => deleteEntity("documents", id)}
                      projects={store.projects}
                      customers={store.customers}
                      onImportDocument={() => void addImportedDocument()}
                      onLinkDocument={() => void addLinkedDocument()}
                      onOpenDocument={(id) => void openDocument(id)}
                      onRelinkDocument={(id) => void relinkDocument(id)}
                      placeholder="Dokumentname eingeben"
                      statusOptions={["Verfügbar", "Geprüft", "Archiviert"]}
                      emptyText="Noch keine Dokumenteinträge vorhanden."
                      moduleSummary={
                        <DocumentModuleSummary
                          documents={store.documents}
                          projects={store.projects}
                          customers={store.customers}
                        />
                      }
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
