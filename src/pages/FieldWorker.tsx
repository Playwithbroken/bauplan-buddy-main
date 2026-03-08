import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import {
  Building,
  Camera,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Phone,
  Users,
  Wrench,
  HardHat,
  Truck,
  Upload,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Compass,
  Navigation,
  Home,
  Calendar,
  FileText,
  MessageSquare,
  Thermometer,
  Wind,
  Cloud,
  Sun,
  Search,
  Filter,
  AlertOctagon,
  ClipboardList,
  Radio,
  ShieldAlert,
} from "lucide-react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";

import { VoiceInput } from "@/components/ui/voice-input";
import { SignaturePad } from "@/components/ui/signature-pad";

type IssueSeverity = "low" | "medium" | "high" | "critical";
type IssueStatus = "open" | "in-progress" | "resolved";

interface JournalEntry {
  id: string;
  date: string;
  author: string;
  shift: string;
  summary: string;
  weather: string;
  crewCount: number;
  attachments: number;
  synced: boolean;
  signature?: string | null;
}

interface IssueReport {
  id: string;
  title: string;
  project: string;
  location: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reportedAt: string;
  description: string;
  synced: boolean;
}

interface CommunicationEvent {
  id: string;
  type: "alert" | "update" | "delivery" | "safety";
  title: string;
  message: string;
  timestamp: string;
  channel: "Teams" | "Email" | "SMS" | "App";
  actor: string;
  relatedProject?: string;
}

const toIsoMinutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: "Offen",
  "in-progress": "In Arbeit",
  resolved: "Behoben",
};

const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "journal-001",
    date: toIsoMinutesAgo(180),
    author: "Team Nord",
    shift: "Fruehschicht",
    summary:
      "Fundamentbeton wurde abgenommen, Schalung nachgearbeitet und Materiallieferung dokumentiert.",
    weather: "Bewoelkt 18 deg C",
    crewCount: 11,
    attachments: 3,
    synced: true,
  },
  {
    id: "journal-002",
    date: toIsoMinutesAgo(540),
    author: "Team West",
    shift: "Spaetschicht",
    summary:
      "Sicherheitsbegehung abgeschlossen, Beleuchtung fuer Nachtschicht vorbereitet und Werkzeuge inventarisiert.",
    weather: "Leichter Regen 16 deg C",
    crewCount: 7,
    attachments: 1,
    synced: true,
  },
];

const INITIAL_ISSUE_REPORTS: IssueReport[] = [
  {
    id: "issue-001",
    title: "Absicherung Geruest",
    project: "Wohnhaus Muenchen",
    location: "Bauabschnitt A  -  Ebene 2",
    severity: "high",
    status: "in-progress",
    reportedAt: toIsoMinutesAgo(95),
    description:
      "Geruestverschraubung geloest. Bereich wurde gesperrt, Ersatzmaterial angefordert.",
    synced: true,
  },
  {
    id: "issue-002",
    title: "Materialabweichung Stahltraeger",
    project: "Buerogebaeude Berlin",
    location: "Logistikzone Ost",
    severity: "medium",
    status: "open",
    reportedAt: toIsoMinutesAgo(260),
    description:
      "Anlieferung mit falscher Laenge festgestellt. Ruecksprache mit Lieferant laeuft.",
    synced: true,
  },
];

const INITIAL_COMMUNICATION_EVENTS: CommunicationEvent[] = [
  {
    id: "comm-001",
    type: "alert",
    title: "Sicherheitswarnung Baustelle A",
    message:
      "Bereich um Bauabschnitt A bleibt bis 11:30 Uhr gesperrt. Kontrollgang wird koordiniert.",
    timestamp: toIsoMinutesAgo(45),
    channel: "Teams",
    actor: "Sicherheitsbeauftragter",
    relatedProject: "Wohnhaus Muenchen",
  },
  {
    id: "comm-002",
    type: "delivery",
    title: "Lieferung Betonstahl unterwegs",
    message: "Spedition meldet Ankunft in 40 Minuten. Entladeteam einplanen.",
    timestamp: toIsoMinutesAgo(70),
    channel: "SMS",
    actor: "Logistikzentrale",
    relatedProject: "Buerogebaeude Berlin",
  },
  {
    id: "comm-003",
    type: "update",
    title: "Voice-Notiz vom Vorarbeiter",
    message:
      "Betonteil #23 erfolgreich verbaut, Sichtbeton bestaetigt. Naechster Abschnitt startet 14:00 Uhr.",
    timestamp: toIsoMinutesAgo(110),
    channel: "App",
    actor: "Vorarbeiter Team Nord",
    relatedProject: "Wohnhaus Muenchen",
  },
  {
    id: "comm-004",
    type: "safety",
    title: "PPE-Check abgeschlossen",
    message:
      "Team West vollstaendig mit PSA ausgestattet. Naechste Pruefung 17:00 Uhr.",
    timestamp: toIsoMinutesAgo(180),
    channel: "Email",
    actor: "Sicherheitsassistenz",
    relatedProject: "Buerogebaeude Berlin",
  },
];

const JOURNAL_WEATHER_OPTIONS = [
  "Bewoelkt 18 deg C",
  "Leichter Regen 16 deg C",
  "Sonne 22 deg C",
  "Windig 14 deg C",
];

const JOURNAL_SHIFT_OPTIONS = [
  { value: "Fruehschicht", label: "Fruehschicht" },
  { value: "Spaetschicht", label: "Spaetschicht" },
  { value: "Nachtschicht", label: "Nachtschicht" },
];
const FieldWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(
    INITIAL_JOURNAL_ENTRIES
  );
  const [issueReports, setIssueReports] = useState<IssueReport[]>(
    INITIAL_ISSUE_REPORTS
  );
  const [communicationEvents, setCommunicationEvents] = useState<
    CommunicationEvent[]
  >(INITIAL_COMMUNICATION_EVENTS);
  const [pendingJournalEntries, setPendingJournalEntries] = useState<
    JournalEntry[]
  >([]);
  const [pendingIssueReports, setPendingIssueReports] = useState<IssueReport[]>(
    []
  );
  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [journalAttachmentCount, setJournalAttachmentCount] = useState(0);
  const [newJournalEntry, setNewJournalEntry] = useState({
    summary: "",
    weather: JOURNAL_WEATHER_OPTIONS[0],
    crewCount: 10,
    shift: JOURNAL_SHIFT_OPTIONS[0].value,
    signature: null as string | null,
  });
  const [newIssueReport, setNewIssueReport] = useState<{
    title: string;
    project: string;
    location: string;
    severity: IssueSeverity;
    description: string;
  }>({
    title: "",
    project: "",
    location: "",
    severity: "high",
    description: "",
  });

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    if (pendingJournalEntries.length > 0) {
      setJournalEntries((prev) =>
        prev.map((entry) =>
          pendingJournalEntries.some((pending) => pending.id === entry.id)
            ? { ...entry, synced: true }
            : entry
        )
      );
      setPendingJournalEntries([]);
    }

    if (pendingIssueReports.length > 0) {
      setIssueReports((prev) =>
        prev.map((issue) =>
          pendingIssueReports.some((pending) => pending.id === issue.id)
            ? { ...issue, synced: true }
            : issue
        )
      );
      setPendingIssueReports([]);
    }
  }, [isOnline, pendingJournalEntries, pendingIssueReports]);

  const todayTasks = useMemo(
    () => [
      {
        id: "TASK-001",
        title: "Betonpruefung Fundament",
        project: "Wohnhaus Muenchen",
        priority: "high",
        status: "pending",
        deadline: "10:00",
        location: "Musterstrasse 12, Muenchen",
        description: "Qualitaetskontrolle des gegossenen Fundaments.",
        equipment: ["Pruefgeraet", "Kamera"],
        estimatedTime: "30 min",
      },
      {
        id: "TASK-002",
        title: "Materiallieferung pruefen",
        project: "Buerogebaeude Berlin",
        priority: "medium",
        status: "in-progress",
        deadline: "14:00",
        location: "Alexanderplatz 5, Berlin",
        description: "Eingehende Stahltraeger kontrollieren und dokumentieren.",
        equipment: ["Tablet", "Messgeraet"],
        estimatedTime: "45 min",
      },
      {
        id: "TASK-003",
        title: "Sicherheitsrundgang",
        project: "Dachsanierung Hamburg",
        priority: "high",
        status: "pending",
        deadline: "16:30",
        location: "Hafenstrasse 88, Hamburg",
        description: "Woechentlicher Sicherheitscheck aller Arbeitsbereiche.",
        equipment: ["Checkliste", "Kamera"],
        estimatedTime: "60 min",
      },
    ],
    []
  );

  const quickActions = useMemo(
    () => [
      {
        id: "photo",
        icon: Camera,
        label: "Foto aufnehmen",
        color: "bg-blue-500",
      },
      {
        id: "report",
        icon: FileText,
        label: "Bericht erstellen",
        color: "bg-green-500",
      },
      {
        id: "emergency",
        icon: AlertTriangle,
        label: "Notfall melden",
        color: "bg-red-500",
      },
      {
        id: "checkin",
        icon: MapPin,
        label: "Einchecken",
        color: "bg-purple-500",
      },
    ],
    []
  );

  const weatherInfo = useMemo(
    () => ({
      temperature: "18 deg C",
      condition: "Bewoelkt",
      humidity: "65%",
      wind: "12 km/h",
    }),
    []
  );
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in-progress":
        return "text-blue-600";
      case "pending":
        return "text-yellow-600";
      case "overdue":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in-progress":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSeverityBadgeClasses = (severity: IssueSeverity) => {
    switch (severity) {
      case "critical":
        return "bg-rose-100 text-rose-800 border border-rose-300";
      case "high":
        return "bg-red-100 text-red-800 border border-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border border-amber-300";
      default:
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
    }
  };

  const getIssueStatusClasses = (status: IssueStatus) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-300";
    }
  };

  const getSyncBadgeClasses = (synced: boolean) =>
    synced
      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
      : "bg-amber-100 text-amber-800 border border-amber-300";

  const getCommunicationBadgeClasses = (type: CommunicationEvent["type"]) => {
    switch (type) {
      case "alert":
        return "bg-red-100 text-red-800 border border-red-300";
      case "delivery":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "safety":
        return "bg-purple-100 text-purple-800 border border-purple-300";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-300";
    }
  };

  const getCommunicationIcon = (type: CommunicationEvent["type"]) => {
    switch (type) {
      case "alert":
        return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case "delivery":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "safety":
        return <ShieldAlert className="h-5 w-5 text-purple-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-slate-500" />;
    }
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const isSameDay = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const filteredTodayTasks = useMemo(() => {
    if (!searchTerm.trim()) {
      return todayTasks;
    }

    const value = searchTerm.toLowerCase();
    return todayTasks.filter((task) =>
      [task.title, task.project, task.location].some((field) =>
        field.toLowerCase().includes(value)
      )
    );
  }, [todayTasks, searchTerm]);

  const sortedJournalEntries = useMemo(
    () =>
      [...journalEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [journalEntries]
  );

  const filteredJournalEntries = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedJournalEntries;
    }

    const value = searchTerm.toLowerCase();
    return sortedJournalEntries.filter((entry) =>
      [entry.summary, entry.author, entry.weather].some((field) =>
        field.toLowerCase().includes(value)
      )
    );
  }, [sortedJournalEntries, searchTerm]);

  const filteredIssueReports = useMemo(() => {
    if (!searchTerm.trim()) {
      return issueReports;
    }

    const value = searchTerm.toLowerCase();
    return issueReports.filter((issue) =>
      [issue.title, issue.project, issue.location, issue.description].some(
        (field) => field.toLowerCase().includes(value)
      )
    );
  }, [issueReports, searchTerm]);

  const filteredCommunicationEvents = useMemo(() => {
    if (!searchTerm.trim()) {
      return communicationEvents;
    }

    const value = searchTerm.toLowerCase();
    return communicationEvents.filter((event) =>
      [
        event.title,
        event.message,
        event.channel,
        event.actor,
        event.relatedProject || "",
      ].some((field) => field.toLowerCase().includes(value))
    );
  }, [communicationEvents, searchTerm]);

  const journalEntriesToday = useMemo(
    () => journalEntries.filter((entry) => isSameDay(entry.date)).length,
    [journalEntries]
  );

  const openIssuesCount = useMemo(
    () => issueReports.filter((issue) => issue.status !== "resolved").length,
    [issueReports]
  );

  const pendingDeliveriesCount = useMemo(
    () =>
      communicationEvents.filter((event) => event.type === "delivery").length,
    [communicationEvents]
  );

  const unsyncedItemsCount = useMemo(
    () =>
      journalEntries.filter((entry) => !entry.synced).length +
      issueReports.filter((issue) => !issue.synced).length,
    [journalEntries, issueReports]
  );

  const offlineQueueCount =
    pendingJournalEntries.length + pendingIssueReports.length;

  const handlePhotoCapture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleJournalAttachmentChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    setJournalAttachmentCount(files?.length ?? 0);

    const file = files?.[0];
    if (!file) {
      setPhotoPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveJournalEntry = () => {
    if (!newJournalEntry.summary.trim()) {
      return;
    }

    const entry: JournalEntry = {
      id: `journal-${Date.now()}`,
      date: new Date().toISOString(),
      author: "Teamleitung",
      shift: newJournalEntry.shift,
      summary: newJournalEntry.summary.trim(),
      weather: newJournalEntry.weather,
      crewCount: newJournalEntry.crewCount,
      attachments: journalAttachmentCount,
      synced: isOnline,
      signature: newJournalEntry.signature,
    };

    setJournalEntries((prev) => [entry, ...prev]);

    if (!isOnline) {
      setPendingJournalEntries((prev) => [...prev, entry]);
    }

    setCommunicationEvents((prev) => [
      {
        id: `comm-${Date.now()}`,
        type: "update",
        title: "Journal aktualisiert",
        message:
          entry.summary.length > 120
            ? `${entry.summary.slice(0, 120)}...`
            : entry.summary,
        timestamp: new Date().toISOString(),
        channel: "App",
        actor: entry.author,
        relatedProject: todayTasks[0]?.project ?? "Baustelle",
      },
      ...prev,
    ]);

    setNewJournalEntry((prev) => ({ ...prev, summary: "", signature: null }));
    setJournalAttachmentCount(0);
    setPhotoPreview(null);
    setIsJournalDialogOpen(false);
  };

  const handleSaveIssueReport = () => {
    if (!newIssueReport.title.trim()) {
      return;
    }

    const issue: IssueReport = {
      id: `issue-${Date.now()}`,
      title: newIssueReport.title.trim(),
      project: newIssueReport.project.trim() || "Allgemein",
      location:
        newIssueReport.location.trim() ||
        (currentLocation
          ? `GPS ${currentLocation.lat.toFixed(
              3
            )}, ${currentLocation.lng.toFixed(3)}`
          : "Ort wird nachgereicht"),
      severity: newIssueReport.severity,
      status: "open",
      reportedAt: new Date().toISOString(),
      description: newIssueReport.description.trim(),
      synced: isOnline,
    };

    setIssueReports((prev) => [issue, ...prev]);

    if (!isOnline) {
      setPendingIssueReports((prev) => [...prev, issue]);
    }

    setCommunicationEvents((prev) => [
      {
        id: `comm-${Date.now() + 1}`,
        type: issue.severity === "low" ? "update" : "alert",
        title: `Vorfall: ${issue.title}`,
        message: issue.description || "Neue Meldung ohne Beschreibung.",
        timestamp: new Date().toISOString(),
        channel: "App",
        actor: "Baustellen-Team",
        relatedProject: issue.project,
      },
      ...prev,
    ]);

    setNewIssueReport({
      title: "",
      project: "",
      location: "",
      severity: "high",
      description: "",
    });
    setIsIssueDialogOpen(false);
  };
  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Außendienst" },
      ]}
      pageTitle="Außendienst"
    >
      <div className="px-4 py-4 pb-28 space-y-6">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                  <Cloud className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {weatherInfo.temperature}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {weatherInfo.condition}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="flex items-center justify-end space-x-2">
                  <Thermometer className="h-4 w-4" />
                  <span>Feuchte {weatherInfo.humidity}</span>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Wind className="h-4 w-4" />
                  <span>Wind {weatherInfo.wind}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <span>UV-Check um 11:00 Uhr</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>
                  {currentLocation
                    ? `GPS ${currentLocation.lat.toFixed(
                        3
                      )}, ${currentLocation.lng.toFixed(3)}`
                    : "Standort wird bestimmt..."}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Arbeitsorganisation</CardTitle>
            <CardDescription>
              Suche und Kennzahlen fuer Aufgaben, Journal und Meldungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <label htmlFor="field-search" className="sr-only">
                  Suche
                </label>
                <Input
                  id="field-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Suche nach Aufgaben, Journal oder Lieferungen"
                  className="pl-9"
                />
              </div>
              <Button variant="outline" className="md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-muted bg-muted/40 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tasks heute</span>
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {filteredTodayTasks.length}
                </p>
              </div>
              <div className="rounded-lg border border-muted bg-muted/40 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Journal heute</span>
                  <HardHat className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {journalEntriesToday}
                </p>
              </div>
              <div className="rounded-lg border border-muted bg-muted/40 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Offene Meldungen</span>
                  <AlertOctagon className="h-4 w-4 text-red-500" />
                </div>
                <p className="mt-1 text-lg font-semibold">{openIssuesCount}</p>
              </div>
              <div className="rounded-lg border border-muted bg-muted/40 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Lieferstatus</span>
                  <Truck className="h-4 w-4 text-blue-500" />
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {pendingDeliveriesCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Netzwerk &amp; Geraete</CardTitle>
            <CardDescription>
              Status fuer Offline-Verarbeitung und Kommunikation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Verbindung</p>
                  <p className="text-sm font-medium">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-emerald-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Signal</p>
                  <p className="text-sm font-medium">LTE</p>
                </div>
                <Signal className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Akku</p>
                  <p className="text-sm font-medium">82%</p>
                </div>
                <Battery className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Position</p>
                  <p className="text-sm font-medium">
                    {currentLocation ? "GPS aktiv" : "Wird ermittelt"}
                  </p>
                </div>
                <Compass className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            {offlineQueueCount > 0 && (
              <div className="rounded-md border border-dashed border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500 dark:bg-amber-900/30">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Offline gespeichert</span>
                  <Radio className="h-4 w-4" />
                </div>
                <p className="mt-1 text-xs">
                  {offlineQueueCount} Element(e) warten auf Synchronisation,
                  sobald eine Verbindung verfuegbar ist.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Journal: {pendingJournalEntries.length}
                  </Badge>
                  <Badge variant="outline">
                    Vorfaelle: {pendingIssueReports.length}
                  </Badge>
                  <Badge variant="outline">Unsync: {unsyncedItemsCount}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Schnellaktionen</CardTitle>
            <CardDescription>
              Direkt vom Feld Informationen erfassen und teilen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Dialog key={action.id}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex h-20 flex-col items-center justify-center space-y-2"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${action.color}`}
                      >
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>{action.label}</DialogTitle>
                      <DialogDescription>
                        {action.id === "photo" &&
                          "Dokumentationsfoto aufnehmen"}
                        {action.id === "report" &&
                          "Arbeitsfortschritt dokumentieren"}
                        {action.id === "emergency" &&
                          "Sicherheitsvorfall oder Notfall melden"}
                        {action.id === "checkin" &&
                          "Am Arbeitsplatz einchecken"}
                      </DialogDescription>
                    </DialogHeader>

                    {action.id === "photo" && (
                      <div className="space-y-4">
                        <Input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoCapture}
                        />
                        {photoPreview && (
                          <div className="space-y-2">
                            <img
                              src={photoPreview}
                              alt="Preview"
                              className="w-full rounded-lg"
                            />
                            <Textarea placeholder="Beschreibung hinzufuegen..." />
                            <Button className="w-full">
                              <Upload className="mr-2 h-4 w-4" />
                              Hochladen
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {action.id === "report" && (
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Kurzbericht fuer das Bautagebuch..."
                          rows={4}
                        />
                        <Button
                          className="w-full"
                          onClick={() => setIsJournalDialogOpen(true)}
                        >
                          <ClipboardList className="mr-2 h-4 w-4" />
                          In Bautagebuch uebernehmen
                        </Button>
                      </div>
                    )}

                    {action.id === "emergency" && (
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <Button variant="destructive" className="flex-1">
                            <Phone className="mr-2 h-4 w-4" />
                            Notruf 112
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Phone className="mr-2 h-4 w-4" />
                            Bauleitung
                          </Button>
                        </div>
                        <Textarea placeholder="Beschreibung des Notfalls..." />
                        <Button className="w-full">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Notfall melden
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Kommunikation &amp; Timeline
            </CardTitle>
            <CardDescription>
              Aktuelle Meldungen aus Baustelle, Logistik und Sicherheit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredCommunicationEvents.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Keine Nachrichten fuer den aktuellen Filter.
              </div>
            ) : (
              filteredCommunicationEvents.map((event, index) => (
                <div key={event.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start gap-3">
                      <div className="mt-1">
                        {getCommunicationIcon(event.type)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium leading-none">
                            {event.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className={getCommunicationBadgeClasses(event.type)}
                          >
                            {event.channel}
                          </Badge>
                          {event.relatedProject && (
                            <Badge variant="outline">
                              {event.relatedProject}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.message}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{formatTime(event.timestamp)}</p>
                      <p>{event.actor}</p>
                    </div>
                  </div>
                  {index < filteredCommunicationEvents.length - 1 && (
                    <Separator />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2 sm:grid-cols-5">
              <TabsTrigger value="today">Heute</TabsTrigger>
              <TabsTrigger value="week">Woche</TabsTrigger>
              <TabsTrigger value="completed">Erledigt</TabsTrigger>
              <TabsTrigger value="journal">Bautagebuch</TabsTrigger>
              <TabsTrigger value="issues">Vorfaelle</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="today" className="space-y-4 pt-4">
            {filteredTodayTasks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Keine Aufgaben fuer den aktuellen Filter.
                </CardContent>
              </Card>
            ) : (
              filteredTodayTasks.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center space-x-2">
                          <h4 className="text-sm font-semibold">
                            {task.title}
                          </h4>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="mb-2 text-xs text-muted-foreground">
                          {task.project}
                        </p>
                        <p className="text-sm">{task.description}</p>
                      </div>
                      <div className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Bis {task.deadline} - {task.estimatedTime}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span>{task.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Wrench className="h-3 w-3" />
                        <span>{task.equipment.join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Start
                      </Button>
                      <Button variant="outline" size="sm">
                        <Navigation className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="week" className="pt-4">
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Wochenuebersicht wird vorbereitet...
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="pt-4">
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Keine erledigten Aufgaben heute
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journal" className="space-y-4 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredJournalEntries.length} Eintraege im Bautagebuch
              </p>
              <Button size="sm" onClick={() => setIsJournalDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Eintrag erfassen
              </Button>
            </div>
            {filteredJournalEntries.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Noch keine Eintraege vorhanden.
                </CardContent>
              </Card>
            ) : (
              filteredJournalEntries.map((entry) => (
                <Card key={entry.id} className="border-l-4 border-l-slate-500">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{entry.author}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(entry.date)} - {entry.shift}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getSyncBadgeClasses(entry.synced)}>
                          {entry.synced ? "Synchron" : "Wartet auf Sync"}
                        </Badge>
                        <Badge variant="outline">
                          <Cloud className="mr-1 h-3 w-3" />
                          {entry.weather}
                        </Badge>
                        <Badge variant="outline">
                          <HardHat className="mr-1 h-3 w-3" />
                          Team {entry.crewCount}
                        </Badge>
                        {entry.attachments > 0 && (
                          <Badge variant="secondary">
                            <Camera className="mr-1 h-3 w-3" />
                            {entry.attachments} Fotos
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{entry.summary}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-4 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredIssueReports.length} Meldungen im Feld
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsIssueDialogOpen(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Vorfall melden
              </Button>
            </div>
            {filteredIssueReports.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Keine aktuellen Vorfaelle.
                </CardContent>
              </Card>
            ) : (
              filteredIssueReports.map((issue) => (
                <Card key={issue.id} className="border-l-4 border-l-amber-500">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {issue.project} - {formatDateTime(issue.reportedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={getSeverityBadgeClasses(issue.severity)}
                        >
                          {SEVERITY_LABELS[issue.severity]}
                        </Badge>
                        <Badge className={getIssueStatusClasses(issue.status)}>
                          {ISSUE_STATUS_LABELS[issue.status]}
                        </Badge>
                        <Badge className={getSyncBadgeClasses(issue.synced)}>
                          {issue.synced ? "Synchron" : "Wartet"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {issue.location}
                    </p>
                    {issue.description && (
                      <p className="text-sm leading-relaxed">
                        {issue.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                      <ShieldAlert className="h-3 w-3" />
                      <span>Sicherheitsprozess ausgeloest</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MultiWindowDialog
        open={isJournalDialogOpen}
        onOpenChange={setIsJournalDialogOpen}
      >
        <DialogFrame
          title="Neuer Bautagebuch-Eintrag"
          description="Erfasse Fortschritt, Crew und Rahmenbedingungen."
          width="max-w-xl"
          modal={false}
          onClose={() => setIsJournalDialogOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsJournalDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveJournalEntry}
                disabled={!newJournalEntry.summary.trim()}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Speichern
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Schicht</label>
                <Select
                  value={newJournalEntry.shift}
                  onValueChange={(value) =>
                    setNewJournalEntry((prev) => ({ ...prev, shift: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Schicht waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOURNAL_SHIFT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Crew</label>
                <Input
                  type="number"
                  min={1}
                  value={newJournalEntry.crewCount}
                  onChange={(event) =>
                    setNewJournalEntry((prev) => ({
                      ...prev,
                      crewCount: Number(event.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Wetter</label>
              <Select
                value={newJournalEntry.weather}
                onValueChange={(value) =>
                  setNewJournalEntry((prev) => ({ ...prev, weather: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wetter" />
                </SelectTrigger>
                <SelectContent>
                  {JOURNAL_WEATHER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Zusammenfassung</label>
                <VoiceInput
                  onTranscript={(text) =>
                    setNewJournalEntry((prev) => ({
                      ...prev,
                      // Append if there's already text, or just set it
                      summary: prev.summary ? `${prev.summary} ${text}` : text,
                    }))
                  }
                />
              </div>
              <Textarea
                value={newJournalEntry.summary}
                onChange={(event) =>
                  setNewJournalEntry((prev) => ({
                    ...prev,
                    summary: event.target.value,
                  }))
                }
                placeholder="Was wurde erledigt, besondere Vorkommnisse... (Tipp: Spracheingabe nutzen)"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Unterschrift (Vorarbeiter)
              </label>
              <SignaturePad
                onSave={(data) =>
                  setNewJournalEntry((prev) => ({ ...prev, signature: data }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Fotos oder Dokumente
              </label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleJournalAttachmentChange}
              />
              <p className="text-xs text-muted-foreground">
                {journalAttachmentCount} Datei(en) ausgewählt.
              </p>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-24 w-full rounded-md object-cover"
                />
              )}
            </div>
          </div>
        </DialogFrame>
      </MultiWindowDialog>

      <MultiWindowDialog
        open={isIssueDialogOpen}
        onOpenChange={setIsIssueDialogOpen}
      >
        <DialogFrame
          title="Vorfall melden"
          description="Dokumentiere Sicherheitsereignisse oder Materialabweichungen fuer die Bauleitung."
          width="max-w-xl"
          modal={false}
          onClose={() => setIsIssueDialogOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsIssueDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveIssueReport}
                disabled={!newIssueReport.title.trim()}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Melden
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titel *</label>
              <Input
                value={newIssueReport.title}
                onChange={(event) =>
                  setNewIssueReport((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="Kurze Bezeichnung"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Projekt</label>
              <Input
                value={newIssueReport.project}
                onChange={(event) =>
                  setNewIssueReport((prev) => ({
                    ...prev,
                    project: event.target.value,
                  }))
                }
                placeholder="Projekt oder Abschnitt"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ort</label>
              <Input
                value={newIssueReport.location}
                onChange={(event) =>
                  setNewIssueReport((prev) => ({
                    ...prev,
                    location: event.target.value,
                  }))
                }
                placeholder="Position oder Bauabschnitt"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Schweregrad</label>
                <Select
                  value={newIssueReport.severity}
                  onValueChange={(value) =>
                    setNewIssueReport((prev) => ({
                      ...prev,
                      severity: value as IssueSeverity,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="critical">Kritisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Beschreibung</label>
              <Textarea
                value={newIssueReport.description}
                onChange={(event) =>
                  setNewIssueReport((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Detailierte Beschreibung"
                rows={4}
              />
            </div>
          </div>
        </DialogFrame>
      </MultiWindowDialog>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-5 gap-1 p-2 text-xs">
          <Link
            to="/field"
            className="flex flex-col items-center py-2 text-blue-600"
          >
            <Home className="h-5 w-5" />
            Heute
          </Link>
          <Link
            to="/calendar"
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <Calendar className="h-5 w-5" />
            Termine
          </Link>
          <Link
            to="/projects"
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <Building className="h-5 w-5" />
            Projekte
          </Link>
          <Link
            to="/documents"
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <FileText className="h-5 w-5" />
            Docs
          </Link>
          <Link
            to="/teams"
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <Users className="h-5 w-5" />
            Team
          </Link>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default FieldWorker;
