import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppointmentDialog, {
  AppointmentFormData,
} from "@/components/AppointmentDialog";
import { StoredAppointment } from "@/services/appointmentService";
import { useAppointments, useCreateAppointment } from "@/hooks/useAppointments";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { toast } from "@/hooks/use-toast";
import {
  Building,
  Plus,
  FolderOpen,
  Edit,
  Trash2,
  Users,
  MapPin,
  Calendar,
  Euro,
  Search,
  Filter,
  Calculator,
  Clock,
  CheckCircle,
  BarChart3,
  Target,
  AlertTriangle,
  MessageSquare,
  Archive,
  AlertCircle,
  TrendingUp,
  Activity,
  Receipt,
  Star,
  UserPlus,
  Mail,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { InvoiceGenerationDialog } from "@/components/dialogs/InvoiceGenerationDialog";
import { NachkalkulationView } from "@/components/project/NachkalkulationView";
import { MultiWindowDialog, Dialog } from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { initializeSampleData } from "@/utils/sampleDataInit";

import DocumentDownloadList, {
  DocumentDownloadItem,
} from "@/components/project/DocumentDownloadList";
import ExcelSyncPanel from "@/components/project/ExcelSyncPanel";
import { AdvancedDocumentManager } from "@/components/dialogs/AdvancedDocumentManager";
import { ProjectProgressDashboard } from "@/components/project/ProjectProgressDashboard";

type ProjectTaskStatus = "completed" | "in-progress" | "pending";
type ProjectTaskPriority = "low" | "medium" | "high" | "critical";

type ProjectOverviewMilestone = {
  name: string;
  date: string;
  completed: boolean;
  progress: number;
};

type ProjectOverviewTask = {
  id: number;
  name: string;
  assignee: string;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  dueDate: string;
  progress: number;
};

type ProjectOverviewRisk = {
  level: "low" | "medium" | "high";
  description: string;
  impact: string;
};

type ProjectOverview = {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  team: number;
  location: string;
  phase: string;
  startDate: string;
  endDate: string;
  customer: string;
  customerId: string;
  customerEmail?: string;
  customerAddress?: string;
  address: string;
  description: string;
  documents: string[];
  milestones: ProjectOverviewMilestone[];
  tasks: ProjectOverviewTask[];
  risks: ProjectOverviewRisk[];
  teamMembers?: ProjectTeamMember[];
};

interface ProjectTeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  hourlyRate?: number;
  isExternal: boolean;
  joinedAt: string;
}

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});
const formatCurrency = (value: number) => currencyFormatter.format(value);

import { ProjectService } from "@/services/projectService";

const Projects = () => {
  const [projectsList, setProjectsList] = useState<ProjectOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(
    undefined,
  );
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [activeProject, setActiveProject] = useState<ProjectOverview | null>(
    null,
  );
  const [isProjectDialogFullscreen, setIsProjectDialogFullscreen] =
    useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState("active");
  const [newProjectBudget, setNewProjectBudget] = useState(0);
  const [newProjectProgress, setNewProjectProgress] = useState(0);
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<string[]>([]);
  const [selectedProjectForInvoice, setSelectedProjectForInvoice] = useState<{
    id: string;
    name: string;
    customer: string;
    customerId: string;
    customerEmail?: string;
    customerAddress?: string;
  } | null>(null);
  const [showNachkalkulationDialog, setShowNachkalkulationDialog] =
    useState(false);
  const [
    selectedProjectForNachkalkulation,
    setSelectedProjectForNachkalkulation,
  ] = useState<ProjectOverview | null>(null);

  const [excelSyncing, setExcelSyncing] = useState(false);
  const [lastExcelSyncMessage, setLastExcelSyncMessage] = useState<
    string | null
  >(null);

  // Team management state
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [newMember, setNewMember] = useState<Partial<ProjectTeamMember>>({
    name: "",
    role: "",
    email: "",
    phone: "",
    hourlyRate: 0,
    isExternal: false,
  });

  const openProjectCreation = useCallback(() => {
    setActiveTab("create");
    window.requestAnimationFrame(() => {
      const projectNameInput = document.getElementById(
        "projectName",
      ) as HTMLInputElement | null;
      projectNameInput?.focus();
    });
  }, [setActiveTab]);

  const locationWantsCreate =
    (location.state as { openCreate?: boolean } | undefined)?.openCreate ===
    true;
  const locationWantsProjectId = (
    location.state as { openProjectId?: string } | undefined
  )?.openProjectId;

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const projects = await ProjectService.getAll();
      setProjectsList(projects as unknown as ProjectOverview[]);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    initializeSampleData();
  }, []);

  useEffect(() => {
    if (locationWantsCreate) {
      openProjectCreation();
      navigate(location.pathname, { replace: true });
    }
  }, [locationWantsCreate, location.pathname, navigate, openProjectCreation]);

  // API hooks for appointments
  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useAppointments();
  const createAppointmentMutation = useCreateAppointment();

  // We'll use the projectsList state instead of mock data
  const projects = projectsList;

  useEffect(() => {
    if (locationWantsProjectId) {
      const project =
        projects.find((p) => p.id === locationWantsProjectId) || null;
      if (project) {
        setActiveProject(project);
      }
      navigate(location.pathname, { replace: true });
    }
  }, [locationWantsProjectId, projects, location.pathname, navigate]);

  useEffect(() => {
    const handleNewProject = () => openProjectCreation();
    window.addEventListener(
      "app:new-project",
      handleNewProject as EventListener,
    );
    return () => {
      window.removeEventListener(
        "app:new-project",
        handleNewProject as EventListener,
      );
    };
  }, [openProjectCreation]);

  // Favorite functionality
  const toggleFavoriteProject = useCallback((projectId: string) => {
    setFavoriteProjectIds((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      }
      return [projectId, ...prev.filter((id) => id !== projectId)];
    });
  }, []);

  const favoriteProjectIdSet = useMemo(
    () => new Set(favoriteProjectIds),
    [favoriteProjectIds],
  );

  const favoriteProjects = useMemo(() => {
    const map = new Map(
      projects.map((project) => [project.id, project] as const),
    );
    return favoriteProjectIds
      .map((id) => map.get(id))
      .filter((project): project is ProjectOverview => Boolean(project));
  }, [favoriteProjectIds, projects]);

  const visibleFavoriteProjects = useMemo(
    () => favoriteProjects.slice(0, 6),
    [favoriteProjects],
  );
  const hiddenFavoriteCount =
    favoriteProjects.length - visibleFavoriteProjects.length;

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        (project.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.customer || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (project.location || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (project.id || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "planning":
        return "outline";
      case "quote":
        return "outline";
      case "paused":
        return "destructive";
      case "archived":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleAddTeamMember = () => {
    if (!activeProject || !newMember.name || !newMember.role) {
      toast({
        title: "Fehlende Daten",
        description: "Name und Rolle sind erforderlich.",
        variant: "destructive",
      });
      return;
    }

    const member: ProjectTeamMember = {
      id: `TM-${Date.now()}`,
      name: newMember.name,
      role: newMember.role,
      email: newMember.email || "",
      phone: newMember.phone || "",
      hourlyRate: newMember.hourlyRate || 0,
      isExternal: newMember.isExternal || false,
      joinedAt: new Date().toISOString().split("T")[0],
    };

    // Update project with new team member
    const updatedProject = {
      ...activeProject,
      teamMembers: [...(activeProject.teamMembers || []), member],
      team: (activeProject.teamMembers?.length || 0) + 1,
    };

    setActiveProject(updatedProject);
    setNewMember({
      name: "",
      role: "",
      email: "",
      phone: "",
      hourlyRate: 0,
      isExternal: false,
    });
    setShowAddMemberDialog(false);

    toast({
      title: "Mitarbeiter hinzugefuegt",
      description: `${member.name} wurde zum Team hinzugefuegt.`,
    });
  };

  const handleRemoveTeamMember = (memberId: string) => {
    if (!activeProject) return;

    const updatedProject = {
      ...activeProject,
      teamMembers:
        activeProject.teamMembers?.filter((m) => m.id !== memberId) || [],
      team: Math.max(0, (activeProject.teamMembers?.length || 1) - 1),
    };

    setActiveProject(updatedProject);

    toast({
      title: "Mitarbeiter entfernt",
      description: "Der Mitarbeiter wurde aus dem Team entfernt.",
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "completed":
        return "Fertig";
      case "planning":
        return "Planung";
      case "quote":
        return "Angebot";
      case "paused":
        return "Pausiert";
      case "archived":
        return "Archiviert";
      default:
        return "Unbekannt";
    }
  };

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + p.progress, 0) / projects.length,
        )
      : 0;

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const projectAppointmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    appointments.forEach((appointment) => {
      if (!appointment.projectId || appointment.projectId === "no-project") {
        return;
      }
      counts.set(
        appointment.projectId,
        (counts.get(appointment.projectId) ?? 0) + 1,
      );
    });
    return counts;
  }, [appointments]);

  const upcomingAppointments = useMemo<StoredAppointment[]>(() => {
    const now = Date.now();
    return [...appointments]
      .filter((appointment) => {
        const timestamp = new Date(
          `${appointment.date}T${appointment.startTime || "00:00"}`,
        ).getTime();
        return !Number.isNaN(timestamp) && timestamp >= now;
      })
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.startTime || "00:00"}`).getTime() -
          new Date(`${b.date}T${b.startTime || "00:00"}`).getTime(),
      )
      .slice(0, 8);
  }, [appointments]);

  const handleCreateProjectAppointment = useCallback(
    (projectId?: string) => {
      setSelectedProject(
        projectId && projectId !== "no-project" ? projectId : undefined,
      );
      setShowAppointmentDialog(true);
      setActiveTab("termine");
    },
    [setSelectedProject, setShowAppointmentDialog, setActiveTab],
  );

  const handleOpenInvoiceDialog = useCallback(
    (project: ProjectOverview) => {
      setSelectedProjectForInvoice({
        id: project.id,
        name: project.name,
        customer: project.customer,
        customerId: project.customerId,
        customerEmail: project.customerEmail,
        customerAddress: project.customerAddress ?? project.address,
      });
      setShowInvoiceDialog(true);
    },
    [setSelectedProjectForInvoice, setShowInvoiceDialog],
  );

  const handleInvoiceDialogChange = useCallback(
    (open: boolean) => {
      setShowInvoiceDialog(open);
      if (!open) {
        setSelectedProjectForInvoice(null);
      }
    },
    [setShowInvoiceDialog, setSelectedProjectForInvoice],
  );

  const handleOpenNachkalkulation = useCallback(
    (project: ProjectOverview) => {
      setSelectedProjectForNachkalkulation(project);
      setShowNachkalkulationDialog(true);
    },
    [setSelectedProjectForNachkalkulation, setShowNachkalkulationDialog],
  );

  const handleNachkalkulationDialogChange = useCallback(
    (open: boolean) => {
      setShowNachkalkulationDialog(open);
      if (!open) {
        setSelectedProjectForNachkalkulation(null);
      }
    },
    [setShowNachkalkulationDialog],
  );

  const handleDocumentDownload = useCallback(
    (documentName: string, projectName: string) => {
      toast({
        title: "Download gestartet",
        description: `${documentName} (${projectName}) wird vorbereitet.`,
      });
    },
    [],
  );

  const documentDownloads = useMemo<DocumentDownloadItem[]>(() => {
    const accentByStatus: Record<string, string> = {
      active: "text-blue-500",
      planning: "text-amber-500",
      completed: "text-green-500",
      paused: "text-slate-500",
    };
    return projects.flatMap((project) =>
      project.documents.map((docName, index) => ({
        id: `${project.id}-${index}`,
        title: docName,
        description: `${project.name} - ${project.customer}`,
        accentColorClass:
          accentByStatus[project.status] ?? "text-muted-foreground",
        onDownload: () => handleDocumentDownload(docName, project.name),
      })),
    );
  }, [projects, handleDocumentDownload]);

  const handleExcelUpload = useCallback((files: File[]) => {
    if (!files.length) return;
    setExcelSyncing(true);
    const fileCountText = `${files.length} Datei${
      files.length > 1 ? "en" : ""
    }`;
    setLastExcelSyncMessage(`Synchronisation gestartet (${fileCountText})`);
    setTimeout(() => {
      setExcelSyncing(false);
      setLastExcelSyncMessage(
        `Zuletzt synchronisiert am ${new Date().toLocaleString("de-DE")}`,
      );
      toast({
        title: "Excel synchronisiert",
        description: `${fileCountText} verarbeitet.`,
      });
    }, 1200);
  }, []);

  const handleCreateProject = async () => {
    const nameInput = document.getElementById(
      "projectName",
    ) as HTMLInputElement;
    const customerInput = document.getElementById(
      "customer",
    ) as HTMLInputElement;
    const locationInput = document.getElementById(
      "location",
    ) as HTMLInputElement;
    const budgetInput = document.getElementById("budget") as HTMLInputElement;
    const startDateInput = document.getElementById(
      "startDate",
    ) as HTMLInputElement;
    const endDateInput = document.getElementById("endDate") as HTMLInputElement;
    const descriptionInput = document.getElementById(
      "description",
    ) as HTMLTextAreaElement;

    if (!nameInput?.value) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Projektnamen ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      await ProjectService.create({
        name: nameInput.value,
        customer: customerInput?.value || "Unbekannter Kunde",
        location: locationInput?.value || "",
        budget: Number(budgetInput?.value) || 0,
        startDate:
          startDateInput?.value || new Date().toISOString().split("T")[0],
        endDate: endDateInput?.value || "",
        description: descriptionInput?.value || "",
        status: "active",
        progress: 0,
        spent: 0,
        team: 1,
        updatedAt: new Date().toISOString(),
      } as any);

      toast({
        title: "Projekt erstellt",
        description: `Das Projekt "${nameInput.value}" wurde erfolgreich angelegt.`,
      });

      // Reset form
      if (nameInput) nameInput.value = "";
      if (customerInput) customerInput.value = "";
      if (locationInput) locationInput.value = "";
      if (budgetInput) budgetInput.value = "";
      if (startDateInput) startDateInput.value = "";
      if (endDateInput) endDateInput.value = "";
      if (descriptionInput) descriptionInput.value = "";

      fetchProjects();
      setActiveTab("overview");
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Das Projekt konnte nicht erstellt werden.",
      });
    }
  };

  // Handle appointment creation
  const handleSaveAppointment = async (
    appointmentData: AppointmentFormData,
  ) => {
    try {
      const savedAppointment =
        await createAppointmentMutation.mutateAsync(appointmentData);
      const relatedProject = savedAppointment.projectId
        ? projectById.get(savedAppointment.projectId)
        : undefined;
      const startDateTime = new Date(
        `${savedAppointment.date}T${savedAppointment.startTime || "00:00"}`,
      );
      const formattedDate = Number.isNaN(startDateTime.getTime())
        ? savedAppointment.date
        : startDateTime.toLocaleString("de-DE");

      toast({
        title: "Termin erstellt",
        description: `${savedAppointment.title}${
          relatedProject ? ` - ${relatedProject.name}` : ""
        } am ${formattedDate}.`,
      });

      setShowAppointmentDialog(false);
      setSelectedProject(undefined);
      setActiveTab("termine");
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Der Termin konnte nicht erstellt werden.",
      });
    }
  };

  const pageWrapperClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background overflow-auto p-6"
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";

  const contentWrapperClass = isFullscreen
    ? "space-y-6 max-h-[calc(100vh-220px)] overflow-auto pr-1"
    : "space-y-6";

  const baseFilterRowClass = compactView
    ? "flex items-center space-x-3 mb-4"
    : "flex items-center space-x-4 mb-6";
  const filterRowClass = isFullscreen
    ? `${baseFilterRowClass} sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/60 rounded-md px-3 py-2`
    : baseFilterRowClass;

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Projekte" },
      ]}
    >
      <div
        className={`p-4 md:p-8 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen ${
          isFullscreen ? "fixed inset-0 z-[100] overflow-auto" : ""
        }`}
      >
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <OfflineIndicator className="hidden md:flex" />
            <SyncStatusIndicator showDetailed={false} />
            <Button
              variant="subtle"
              size="compact"
              onClick={() => setIsFullscreen((prev) => !prev)}
              aria-label={
                isFullscreen ? "Ansicht verkleinern" : "Ansicht vergroessern"
              }
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="subtle"
              size="compact"
              onClick={() => setActiveTab("create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neues Projekt
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              size="compact"
              onClick={() => setShowAppointmentDialog(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Termin hinzufuegen
            </Button>
          </div>
        </div>

        <div className={contentWrapperClass}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Gesamt Projekte
                </CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeProjects} aktiv
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Gesamtbudget
                </CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalBudget)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(totalSpent)} ausgegeben
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Durchschn. Fortschritt
                </CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgProgress}%</div>
                <Progress value={avgProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Groesse
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + (Number(p.team) || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Mitarbeiter gesamt
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-8 h-14 p-2 bg-muted/50 rounded-lg">
              <TabsTrigger
                value="overview"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Uebersicht
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="termine"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Termine
              </TabsTrigger>
              <TabsTrigger
                value="gantt"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Gantt / Timeline
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Aufgaben
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Neues Projekt
              </TabsTrigger>
              <TabsTrigger
                value="excel"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Excel Integration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Favorites Section */}
              {visibleFavoriteProjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ihre Favoriten</CardTitle>
                    <CardDescription>
                      Markierte Projekte erscheinen hier an erster Stelle und
                      lassen sich jederzeit anpassen.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {visibleFavoriteProjects.map((project) => {
                        const isFavorite = favoriteProjectIdSet.has(project.id);
                        return (
                          <div
                            key={project.id}
                            className="border rounded-lg p-4 bg-muted/40 dark:bg-muted/10 hover:border-primary transition"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-base">
                                    {project.name}
                                  </h3>
                                  <Badge
                                    variant={getStatusColor(project.status)}
                                  >
                                    {getStatusText(project.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {project.customer} - {project.location}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={
                                  isFavorite
                                    ? "text-yellow-500"
                                    : "text-muted-foreground"
                                }
                                aria-pressed={isFavorite}
                                onClick={() =>
                                  toggleFavoriteProject(project.id)
                                }
                                aria-label={
                                  isFavorite
                                    ? "Favorit entfernen"
                                    : "Als Favorit markieren"
                                }
                              >
                                <Star
                                  className="h-5 w-5"
                                  fill={isFavorite ? "currentColor" : "none"}
                                />
                              </Button>
                            </div>
                            <div className="mt-4 space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span>Fortschritt</span>
                                <span>{project.progress}%</span>
                              </div>
                              <Progress value={project.progress} />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Budget</span>
                                <span>
                                  EUR {project.budget.toLocaleString("de-DE")}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              className="mt-4 w-full"
                              onClick={() => setActiveProject(project)}
                            >
                              Details anzeigen
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    {hiddenFavoriteCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-4">
                        +{hiddenFavoriteCount} weitere Favoriten. Nutzen Sie die
                        Suchfunktion, um sie aufzurufen.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Search and Filter */}
              <Card
                className={
                  isFullscreen
                    ? "sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border border-border/60"
                    : undefined
                }
              >
                <CardHeader>
                  <CardTitle>Projekte verwalten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={filterRowClass}>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 h-4 w-4" />
                      <Input
                        placeholder="Projekte durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="min-w-[200px]">
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status filtern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Status</SelectItem>
                          <SelectItem value="active">Aktiv</SelectItem>
                          <SelectItem value="completed">Fertig</SelectItem>
                          <SelectItem value="planning">Planung</SelectItem>
                          <SelectItem value="quote">Angebot</SelectItem>
                          <SelectItem value="paused">Pausiert</SelectItem>
                          <SelectItem value="archived">Archiviert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Projects List */}
                  <div className="space-y-6">
                    {filteredProjects.map((project) => {
                      const isFavorite = favoriteProjectIdSet.has(project.id);
                      const appointmentCount =
                        projectAppointmentCounts.get(project.id) ?? 0;
                      const documentCount = project.documents.length;
                      return (
                        <Card
                          key={project.id}
                          className="hover:shadow-lg transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                  <Building className="h-8 w-8 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-xl font-semibold">
                                      {project.name}
                                    </h3>
                                    <Badge
                                      variant={getStatusColor(project.status)}
                                    >
                                      {getStatusText(project.status)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {project.id} | {project.customer}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {project.description}
                                  </p>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>{project.location}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <span>{project.team} Mitarbeiter</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>
                                        {project.startDate} - {project.endDate}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Euro className="h-4 w-4 text-muted-foreground" />
                                      <span>
                                        {formatCurrency(project.budget)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span>
                                      {appointmentCount} geplante Termin
                                      {appointmentCount === 1 ? "" : "e"}
                                    </span>
                                    <span>
                                      | {documentCount} Dokument
                                      {documentCount === 1 ? "" : "e"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={
                                  isFavorite
                                    ? "text-yellow-500"
                                    : "text-muted-foreground"
                                }
                                aria-pressed={isFavorite}
                                onClick={() =>
                                  toggleFavoriteProject(project.id)
                                }
                                aria-label={
                                  isFavorite
                                    ? "Favorit entfernen"
                                    : "Als Favorit markieren"
                                }
                              >
                                <Star
                                  className="h-5 w-5"
                                  fill={isFavorite ? "currentColor" : "none"}
                                />
                              </Button>
                              <div className="text-right">
                                <div className="text-2xl font-bold mb-1">
                                  {project.progress}%
                                </div>
                                <Progress
                                  value={project.progress}
                                  className="w-32 mb-3"
                                />
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(project.spent)} /{" "}
                                  {formatCurrency(project.budget)}
                                </div>
                              </div>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setActiveProject(project)}
                              >
                                <FolderOpen className="mr-2 h-4 w-4" />
                                Details & Dokumente
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleCreateProjectAppointment(project.id)
                                }
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Termin planen
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleOpenInvoiceDialog(project)}
                              >
                                <Receipt className="mr-2 h-4 w-4" />
                                Rechnung
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleOpenNachkalkulation(project)
                                }
                              >
                                <Calculator className="mr-2 h-4 w-4" />
                                Nachkalkulation
                              </Button>

                              <Button
                                variant="outline"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  // Navigate to chat with project context
                                  navigate("/chat", {
                                    state: { projectId: project.id },
                                  });
                                }}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Chat starten
                              </Button>

                              {project.status !== "archived" ? (
                                <Button
                                  variant="outline"
                                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={async () => {
                                    if (
                                      confirm(
                                        `Möchten Sie das Projekt "${project.name}" wirklich archivieren?`,
                                      )
                                    ) {
                                      await ProjectService.archive(project.id);
                                      fetchProjects();
                                      toast({
                                        title: "Projekt archiviert",
                                        description:
                                          "Das Projekt wurde in das Archiv verschoben.",
                                      });
                                    }
                                  }}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archivieren
                                </Button>
                              ) : (
                                <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 rounded-md border border-amber-200">
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                  <span className="text-xs text-amber-700 font-medium">
                                    Archiviert
                                  </span>
                                </div>
                              )}

                              {/* Retention Check (10 years) */}
                              {(() => {
                                const startDate = new Date(project.startDate);
                                const tenYearsAgo = new Date();
                                tenYearsAgo.setFullYear(
                                  tenYearsAgo.getFullYear() - 10,
                                );
                                if (startDate < tenYearsAgo) {
                                  return (
                                    <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-md border border-red-200">
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                      <span className="text-xs text-red-700 font-medium">
                                        Aufbewahrungsfrist abgelaufen (10j)
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Projekt-Dokumente</CardTitle>
                  <CardDescription>
                    Schneller Zugriff auf zuletzt verwendete Dateien aus Ihren
                    Projekten.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documentDownloads.length > 0 ? (
                    <DocumentDownloadList
                      items={documentDownloads}
                      downloadLabel="Herunterladen"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Momentan sind keine Dokumente hinterlegt.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    <span>Projekt Timeline</span>
                  </CardTitle>
                  <CardDescription>
                    Chronologische Ansicht von Meilensteinen, Terminen und
                    Projektfortschritten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted/20">
                      <Clock className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Timeline wird geladen...
                    </h3>
                    <p className="text-sm">
                      Die Timeline-Visualisierung wird derzeit ueberarbeitet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="termine" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span>Projekt-Termine</span>
                  </CardTitle>
                  <CardDescription>
                    Alle geplanten Termine fuer Ihre Projekte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appointmentsLoading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                      <Activity className="h-8 w-8 animate-spin" />
                      <span>Termine werden geladen...</span>
                    </div>
                  ) : appointmentsError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                      {appointmentsError instanceof Error
                        ? appointmentsError.message
                        : "Termine konnten nicht geladen werden."}
                    </div>
                  ) : upcomingAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                      <Calendar className="h-8 w-8 text-muted-foreground/60" />
                      <span>Keine Termine geplant.</span>
                      <Button
                        variant="outline"
                        onClick={() => handleCreateProjectAppointment()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Termin erstellen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.map((appointment) => {
                        const projectInfo = appointment.projectId
                          ? projectById.get(appointment.projectId)
                          : undefined;
                        const appointmentDate = new Date(
                          `${appointment.date}T${
                            appointment.startTime || "00:00"
                          }`,
                        );
                        const formattedDate = Number.isNaN(
                          appointmentDate.getTime(),
                        )
                          ? appointment.date
                          : appointmentDate.toLocaleString("de-DE", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            });

                        return (
                          <div
                            key={appointment.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted p-4"
                          >
                            <div>
                              <div className="font-medium text-sm sm:text-base">
                                {appointment.title}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {formattedDate}
                              </div>
                              {appointment.location && (
                                <div className="text-xs text-muted-foreground">
                                  {appointment.location}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="outline">
                                {projectInfo ? projectInfo.name : "Allgemein"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleCreateProjectAppointment(
                                    appointment.projectId,
                                  )
                                }
                              >
                                <Edit className="mr-2 h-3 w-3" />
                                Bearbeiten
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gantt" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span>Gantt Chart & Zeitplanung</span>
                  </CardTitle>
                  <CardDescription>
                    Visuelle Darstellung der Projektzeitleisten und
                    Abhaengigkeiten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted/20">
                      <BarChart3 className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Gantt-Diagramm wird geladen...
                    </h3>
                    <p className="text-sm">
                      Die interaktive Gantt-Ansicht wird derzeit ueberarbeitet
                      und steht bald zur Verfuegung.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    <span>Aufgaben & To-Do's</span>
                  </CardTitle>
                  <CardDescription>
                    Alle offenen und erledigten Aufgaben in Ihren Projekten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted/20">
                      <Target className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Aufgaben werden geladen...
                    </h3>
                    <p className="text-sm">
                      Die Aufgaben-Verwaltung wird derzeit ueberarbeitet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Projekt-Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    Detaillierte Analysen und Kennzahlen fuer Ihre Projekte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Budgetverteilung</h4>
                      <div className="space-y-3">
                        {projects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{project.name}</span>
                            <span className="text-sm font-medium">
                              {formatCurrency(project.budget)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Fortschrittstrends</h4>
                      <div className="space-y-3">
                        {projects.map((project) => (
                          <div key={project.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{project.name}</span>
                              <span className="text-sm font-medium">
                                {project.progress}%
                              </span>
                            </div>
                            <Progress
                              value={project.progress}
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-muted/20">
                      <TrendingUp className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Erweiterte Analytics
                    </h3>
                    <p className="text-sm">
                      Detaillierte Diagramme und Berichte werden in der
                      naechsten Version verfuegbar sein.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Neues Projekt anlegen</CardTitle>
                  <CardDescription>
                    Erstellen Sie ein neues Bauprojekt
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="projectName">Projektname</Label>
                        <Input
                          id="projectName"
                          placeholder="z.B. Wohnhaus Familie Mueller"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer">Kunde</Label>
                        <Input
                          id="customer"
                          placeholder="Kundenname oder Firma"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Standort</Label>
                        <Input id="location" placeholder="Stadt oder Region" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="budget">Budget (EUR)</Label>
                        <Input id="budget" type="number" placeholder="450000" />
                      </div>
                      <div>
                        <Label htmlFor="startDate">Startdatum</Label>
                        <Input id="startDate" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="endDate">Enddatum (geplant)</Label>
                        <Input id="endDate" type="date" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Projektbeschreibung</Label>
                    <Textarea
                      id="description"
                      placeholder="Detaillierte Beschreibung des Metallbau-Projekts..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("overview")}
                    >
                      Abbrechen
                    </Button>
                    <Button onClick={handleCreateProject}>
                      Projekt anlegen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="excel" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Excel Integration</CardTitle>
                  <CardDescription>
                    Verwalten Sie Ihre Projekte mit Excel-Vorlagen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ExcelSyncPanel
                    onUpload={handleExcelUpload}
                    isSyncing={excelSyncing}
                    statusDescription={
                      lastExcelSyncMessage ??
                      "Laden Sie aktualisierte Excel-Dateien hoch, um Kalkulationen abzugleichen."
                    }
                  />
                  {!lastExcelSyncMessage && (
                    <p className="text-sm text-muted-foreground">
                      Nach dem Hochladen werden relevante Kennzahlen automatisch
                      im Dashboard aktualisiert.
                    </p>
                  )}
                  {lastExcelSyncMessage && (
                    <p className="text-sm text-muted-foreground">
                      {lastExcelSyncMessage}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Appointment Dialog */}
        <AppointmentDialog
          isOpen={showAppointmentDialog}
          onClose={() => setShowAppointmentDialog(false)}
          onSave={handleSaveAppointment}
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            customer: p.customer,
            status: p.status,
          }))}
          selectedProject={selectedProject}
        />

        {/* Invoice Generation Dialog */}
        <InvoiceGenerationDialog
          open={showInvoiceDialog}
          onOpenChange={handleInvoiceDialogChange}
          projectData={selectedProjectForInvoice}
        />

        {/* Nachkalkulation Dialog */}
        <MultiWindowDialog
          open={showNachkalkulationDialog}
          onOpenChange={handleNachkalkulationDialogChange}
        >
          <DialogFrame
            width="max-w-5xl"
            title={`Nachkalkulation${
              selectedProjectForNachkalkulation
                ? ` - ${selectedProjectForNachkalkulation.name}`
                : ""
            }`}
            onClose={() => handleNachkalkulationDialogChange(false)}
            modal={false}
          >
            {selectedProjectForNachkalkulation ? (
              <NachkalkulationView
                projectId={selectedProjectForNachkalkulation.id}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Waehlen Sie ein Projekt, um die Nachkalkulation anzuzeigen.
              </p>
            )}
          </DialogFrame>
        </MultiWindowDialog>

        {/* Project Details Dialog with Documents and Team */}
        <MultiWindowDialog
          open={!!activeProject}
          onOpenChange={(open) => {
            if (!open) {
              setActiveProject(null);
              setIsProjectDialogFullscreen(false);
            }
          }}
        >
          <DialogFrame
            title={
              activeProject
                ? `Projekt: ${activeProject.name} (${activeProject.id})`
                : "Projektansicht"
            }
            width="max-w-[95vw]"
            fullscreen={isProjectDialogFullscreen}
            showFullscreenToggle={false}
            showMinimizeToggle={false}
            modal={false}
            onClose={() => {
              setActiveProject(null);
              setIsProjectDialogFullscreen(false);
            }}
            headerActions={
              <Button
                variant="outline"
                size="icon"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setIsProjectDialogFullscreen((prev) => !prev)}
                aria-label={
                  isProjectDialogFullscreen
                    ? "Detailansicht verkleinern"
                    : "Detailansicht vergroessern"
                }
              >
                {isProjectDialogFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            }
          >
            <div className="space-y-6 pb-6">
              <Tabs defaultValue="overview" className="w-full">
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-2">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Ueberblick</TabsTrigger>
                    <TabsTrigger value="fortschritt">Fortschritt</TabsTrigger>
                    <TabsTrigger value="documents">Dokumente</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Projektinformationen</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">
                            Kunde:
                          </span>{" "}
                          {activeProject?.customer}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Status:
                          </span>{" "}
                          {activeProject?.status}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Ort:
                          </span>{" "}
                          {activeProject?.location}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Zeitraum:
                          </span>{" "}
                          {activeProject?.startDate} - {activeProject?.endDate}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Budget:
                          </span>{" "}
                          {formatCurrency(activeProject?.budget || 0)}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Ausgaben:
                          </span>{" "}
                          {formatCurrency(activeProject?.spent || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Fortschritt</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Gesamtfortschritt</span>
                            <span>{activeProject?.progress}%</span>
                          </div>
                          <Progress value={activeProject?.progress || 0} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="fortschritt" className="space-y-4">
                  {activeProject && (
                    <ProjectProgressDashboard
                      projectId={activeProject.id}
                      projectName={activeProject.name}
                    />
                  )}
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  {activeProject && (
                    <AdvancedDocumentManager projectId={activeProject.id} />
                  )}
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Team-Mitglieder</CardTitle>
                        <Button onClick={() => setShowAddMemberDialog(true)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Mitarbeiter hinzufuegen
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {activeProject?.teamMembers &&
                        activeProject.teamMembers.length > 0 ? (
                          <div className="grid gap-4">
                            {activeProject.teamMembers.map((member) => (
                              <Card key={member.id} className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">
                                        {member.name}
                                      </h4>
                                      <Badge
                                        variant={
                                          member.isExternal
                                            ? "secondary"
                                            : "default"
                                        }
                                      >
                                        {member.role}
                                      </Badge>
                                      {member.isExternal && (
                                        <Badge variant="outline">Extern</Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                      {member.email && (
                                        <div className="flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {member.email}
                                        </div>
                                      )}
                                      {member.phone && (
                                        <div className="flex items-center gap-1">
                                          <span>Tel:</span>
                                          {member.phone}
                                        </div>
                                      )}
                                      {member.hourlyRate &&
                                        member.hourlyRate > 0 && (
                                          <div>
                                            Stundensatz:{" "}
                                            {formatCurrency(member.hourlyRate)}
                                            /h
                                          </div>
                                        )}
                                      <div>
                                        Beigetreten:{" "}
                                        {new Date(
                                          member.joinedAt,
                                        ).toLocaleDateString("de-DE")}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveTeamMember(member.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4" />
                            <p>Noch keine Team-Mitglieder hinzugefuegt</p>
                            <p className="text-sm">
                              Klicken Sie auf "Mitarbeiter hinzufuegen" um das
                              Team zu erweitanz
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </DialogFrame>
        </MultiWindowDialog>

        {/* Add Team Member Dialog */}
        <MultiWindowDialog
          open={showAddMemberDialog}
          onOpenChange={setShowAddMemberDialog}
        >
          <DialogFrame
            title="Mitarbeiter hinzufuegen"
            width="max-w-3xl"
            modal={false}
            onClose={() => setShowAddMemberDialog(false)}
            footer={
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMemberDialog(false)}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleAddTeamMember}>Hinzufuegen</Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Name *</Label>
                <Input
                  id="member-name"
                  value={newMember.name || ""}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-role">Rolle *</Label>
                <Input
                  id="member-role"
                  value={newMember.role || ""}
                  onChange={(e) =>
                    setNewMember({ ...newMember, role: e.target.value })
                  }
                  placeholder="Projektleiter, Konstrukteur, Schweisser..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email">E-Mail</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={newMember.email || ""}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                  placeholder="max.mustermann@bauplan-buddy.de"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-phone">Telefon</Label>
                <Input
                  id="member-phone"
                  value={newMember.phone || ""}
                  onChange={(e) =>
                    setNewMember({ ...newMember, phone: e.target.value })
                  }
                  placeholder="+49 89 12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-rate">Stundensatz (EUR)</Label>
                <Input
                  id="member-rate"
                  type="number"
                  value={newMember.hourlyRate || ""}
                  onChange={(e) =>
                    setNewMember({
                      ...newMember,
                      hourlyRate: Number(e.target.value),
                    })
                  }
                  placeholder="85"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="member-external"
                  checked={newMember.isExternal || false}
                  onChange={(e) =>
                    setNewMember({ ...newMember, isExternal: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="member-external">Externer Mitarbeiter</Label>
              </div>
            </div>
          </DialogFrame>
        </MultiWindowDialog>
      </div>
    </LayoutWithSidebar>
  );
};

export default Projects;
