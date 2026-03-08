import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardFullSkeleton } from "@/components/skeletons/DashboardSkeletons";
import { LiveMetricsWidget } from "@/components/dashboard/LiveMetricsWidget";
import { InsightsPanel } from "@/components/ai/InsightsPanel";
import { AutomationCards } from "@/components/ai/AutomationCards";
import { RiskRadar } from "@/components/ai/RiskRadar";
import { TemplateWizard } from "@/components/ai/TemplateWizard";
import { automationService } from "@/services/automationService";
import { aiInsightsService } from "@/services/aiInsightsService";
import {
  LogOut,
  Settings,
  Calendar,
  FolderOpen,
  FileText,
  Users,
  BarChart3,
  Shield,
  UserPlus,
  Rocket,
  CheckCircle,
  X,
} from "lucide-react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { useDashboardConfig, WidgetId } from "@/hooks/useDashboardConfig";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { LayoutGrid, Save, RotateCcw, Plus } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const Dashboard = () => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configWidget, setConfigWidget] = useState<WidgetId | null>(null);

  const {
    isEditMode,
    setIsEditMode,
    widgets,
    removeWidget,
    toggleWidget,
    moveWidget,
    updateWidgetSettings,
    resetConfig,
  } = useDashboardConfig();

  useEffect(() => {
    // Simulate loading data
    const loadDashboard = async () => {
      setLoading(true);
      // Check if this is first login (no team members invited yet)
      const hasInvitedTeam = localStorage.getItem("bauplan_team_invited");
      const onboardingCompleted = localStorage.getItem(
        "bauplan_onboarding_completed",
      );

      if (onboardingCompleted && !hasInvitedTeam) {
        setShowQuickStart(true);
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const dismissQuickStart = () => {
    setShowQuickStart(false);
    localStorage.setItem("bauplan_quickstart_dismissed", "true");
  };

  const goToTeamInvite = () => {
    navigate("/teams");
  };

  if (!user) return null;

  // Show skeleton while loading
  if (loading) {
    return <DashboardFullSkeleton />;
  }

  const handleLogout = async () => {
    await logout();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "user":
        return "bg-green-100 text-green-800";
      case "client":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const visibleWidgets = widgets
      .filter((w) => w.visible)
      .sort((a, b) => a.order - b.order);

    const sourceWidget = visibleWidgets[result.source.index];
    const destWidget = visibleWidgets[result.destination.index];

    const fromAbsIndex = widgets.findIndex((w) => w.id === sourceWidget.id);
    const toAbsIndex = widgets.findIndex((w) => w.id === destWidget.id);

    moveWidget(fromAbsIndex, toAbsIndex);
  };

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Dashboard" },
      ]}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name || user?.firstName || "Admin"}!
            </h2>
            <p className="mt-2 text-muted-foreground">
              Here's what's happening with your projects today.
            </p>
          </div>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetConfig}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsEditMode(false)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4" /> Save Layout
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Add Widget
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Available Widgets</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {widgets.map((w) => (
                      <DropdownMenuItem
                        key={w.id}
                        onClick={() => toggleWidget(w.id)}
                        className="flex justify-between items-center"
                      >
                        <span className="capitalize">
                          {w.id.replace(/([A-Z])/g, " $1")}
                        </span>
                        {w.visible && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" /> Customize
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Render Widgets Dynamically */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard-widgets">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-6"
              >
                {widgets
                  .filter((w) => w.visible)
                  .sort((a, b) => a.order - b.order)
                  .map((widget, index) => (
                    <Draggable
                      key={widget.id}
                      draggableId={widget.id}
                      index={index}
                      isDragDisabled={!isEditMode}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(snapshot.isDragging && "z-50")}
                        >
                          <DashboardWidget
                            title={widget.id
                              .replace(/([A-Z])/g, " $1")
                              .toUpperCase()}
                            isEditable={isEditMode}
                            onRemove={() => removeWidget(widget.id)}
                            onConfig={() => setConfigWidget(widget.id)}
                            compact={widget.settings?.compact}
                            dragHandleProps={provided.dragHandleProps}
                          >
                            {widget.id === "welcome" && showQuickStart && (
                              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-blue-200 dark:border-blue-800">
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Rocket className="h-6 w-6 text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                          🎉 Willkommen bei Bauplan Buddy!
                                        </h3>
                                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                                          Laden Sie jetzt Ihre Mitarbeiter ein,
                                          um gemeinsam an Projekten zu arbeiten.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                          <Button
                                            onClick={goToTeamInvite}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                          >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Mitarbeiter einladen
                                          </Button>
                                          <Button
                                            variant="outline"
                                            onClick={dismissQuickStart}
                                            className="border-gray-300 dark:border-gray-600"
                                          >
                                            Später
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={dismissQuickStart}
                                      className="ml-4 hover:bg-white/50 dark:hover:bg-gray-800/50"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {widget.id === "metrics" && (
                              <LiveMetricsWidget
                                metrics={[
                                  {
                                    title: "Active Projects",
                                    value: 12,
                                    change: 15,
                                    changeLabel: "from last month",
                                    icon: FolderOpen,
                                    color: "blue",
                                  },
                                  {
                                    title: "Appointments Today",
                                    value: 8,
                                    change: 8,
                                    changeLabel: "upcoming",
                                    icon: Calendar,
                                    color: "purple",
                                  },
                                  {
                                    title: "Pending Documents",
                                    value: 5,
                                    change: -12,
                                    changeLabel: "need approval",
                                    icon: FileText,
                                    color: "orange",
                                  },
                                  ...(hasRole(["admin", "manager"])
                                    ? [
                                        {
                                          title: "Team Members",
                                          value: 24,
                                          change: 9,
                                          changeLabel: "new this week",
                                          icon: Users,
                                          color: "green" as const,
                                        },
                                      ]
                                    : []),
                                ]}
                              />
                            )}

                            {widget.id === "insights" && (
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <InsightsPanel
                                  className="lg:col-span-2"
                                  maxInsights={4}
                                />
                                <AutomationCards
                                  suggestions={automationService.generateSuggestions(
                                    aiInsightsService.generateMockInsights(),
                                  )}
                                />
                              </div>
                            )}

                            {widget.id === "actions" && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-primary/50">
                                  <CardHeader>
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-5 w-5 text-primary group-hover:text-primary/80" />
                                      <CardTitle>Calendar</CardTitle>
                                    </div>
                                    <CardDescription>
                                      Manage your appointments
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <Button
                                      className="w-full"
                                      onClick={() => navigate("/calendar")}
                                    >
                                      View Calendar
                                    </Button>
                                  </CardContent>
                                </Card>

                                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-primary/50">
                                  <CardHeader>
                                    <div className="flex items-center space-x-2">
                                      <FolderOpen className="h-5 w-5 text-emerald-600 group-hover:text-emerald-500" />
                                      <CardTitle>Projects</CardTitle>
                                    </div>
                                    <CardDescription>
                                      Manage your projects
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <Button
                                      className="w-full"
                                      onClick={() => navigate("/projects")}
                                    >
                                      View Projects
                                    </Button>
                                  </CardContent>
                                </Card>

                                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-primary/50">
                                  <CardHeader>
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-5 w-5 text-purple-600 group-hover:text-purple-500" />
                                      <CardTitle>Documents</CardTitle>
                                    </div>
                                    <CardDescription>
                                      Access project files
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <Button
                                      className="w-full"
                                      onClick={() => navigate("/documents")}
                                    >
                                      View Documents
                                    </Button>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {widget.id === "riskRadar" && (
                              <div className="p-12 border-2 border-dashed rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                                <div className="text-center">
                                  <Shield className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                                  <p className="text-sm font-medium text-slate-500">
                                    Risk Radar (Coming Soon)
                                  </p>
                                </div>
                              </div>
                            )}
                          </DashboardWidget>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Permissions Debug (for development) */}
        {process.env.NODE_ENV === "development" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Permissions (Dev Mode)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <strong>Role:</strong> {user.role}
                </div>
                <div>
                  <strong>Permissions:</strong> {user.permissions.join(", ")}
                </div>
                <div>
                  <strong>User ID:</strong> {user.id}
                </div>
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
                <div>
                  <strong>Last Login:</strong>{" "}
                  {user.lastLogin?.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Widget Config Dialog */}
        <MultiWindowDialog
          open={!!configWidget}
          onOpenChange={() => setConfigWidget(null)}
        >
          <DialogFrame
            title="Widget konfigurieren"
            width="max-w-xl"
            modal={false}
            onClose={() => setConfigWidget(null)}
            footer={
              <Button onClick={() => setConfigWidget(null)}>Fertig</Button>
            }
          >
            <DialogDescription className="pb-4">
              Passen Sie das Widget "{configWidget?.replace(/([A-Z])/g, " $1")}"
              an Ihre Bedürfnisse an.
            </DialogDescription>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Kompakt-Modus</Label>
                  <p className="text-xs text-muted-foreground">
                    Weniger Platz beanspruchen
                  </p>
                </div>
                <Switch
                  checked={
                    widgets.find((w) => w.id === configWidget)?.settings
                      ?.compact || false
                  }
                  onCheckedChange={(checked) =>
                    configWidget &&
                    updateWidgetSettings(configWidget, { compact: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Echtzeit-Updates</Label>
                  <p className="text-xs text-muted-foreground">
                    Daten automatisch aktualisieren
                  </p>
                </div>
                <Switch
                  checked={
                    widgets.find((w) => w.id === configWidget)?.settings
                      ?.realtime !== false
                  }
                  onCheckedChange={(checked) =>
                    configWidget &&
                    updateWidgetSettings(configWidget, { realtime: checked })
                  }
                />
              </div>
            </div>
          </DialogFrame>
        </MultiWindowDialog>
      </div>
    </LayoutWithSidebar>
  );
};

export default Dashboard;
