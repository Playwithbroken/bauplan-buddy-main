import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  ProjectProgressService,
  ProjectProgressReport,
} from "@/services/projectProgressService";

interface ProjectProgressDashboardProps {
  projectId: string;
  projectName: string;
}

export function ProjectProgressDashboard({
  projectId,
  projectName,
}: ProjectProgressDashboardProps) {
  const { toast } = useToast();
  const [progressReport, setProgressReport] =
    useState<ProjectProgressReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgressData = useCallback(async () => {
    try {
      setIsLoading(true);
      const report = ProjectProgressService.generateProgressReport(projectId);
      setProgressReport(report);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fortschrittsdaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    void loadProgressData();
  }, [loadProgressData]);

  const getStatusColor = (status: string) => {
    const colors = {
      on_track: "bg-green-100 text-green-800",
      at_risk: "bg-yellow-100 text-yellow-800",
      delayed: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!progressReport) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <div className="text-lg font-medium mb-2">
            Keine Fortschrittsdaten
          </div>
          <div className="text-muted-foreground">
            Fortschrittsdaten für dieses Projekt sind nicht verfügbar.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Projekt-Fortschritt
          </h2>
          <p className="text-muted-foreground">{projectName}</p>
        </div>
        <Button onClick={loadProgressData}>Aktualisieren</Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gesamtfortschritt
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressReport.overallProgress}%
            </div>
            <Progress value={progressReport.overallProgress} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {progressReport.timeline.delayDays > 0 &&
                `${progressReport.timeline.delayDays} Tage Verzögerung`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilensteine</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                progressReport.milestones.filter((m) => m.status === "achieved")
                  .length
              }
              /{progressReport.milestones.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Erreichte Meilensteine
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risiken</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {progressReport.risks.highPriorityCount}
            </div>
            <div className="text-xs text-muted-foreground">
              Hochrisiko-Faktoren
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zeitplan</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              className={getStatusColor(
                progressReport.timeline.criticalPathStatus
              )}
            >
              {progressReport.timeline.criticalPathStatus === "on_track"
                ? "Pünktlich"
                : progressReport.timeline.criticalPathStatus === "at_risk"
                ? "Gefährdet"
                : "Verspätet"}
            </Badge>
            <div className="text-xs text-muted-foreground mt-2">
              Voraussichtlich:{" "}
              {new Date(
                progressReport.timeline.estimatedCompletion
              ).toLocaleDateString("de-DE")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {progressReport.recommendations.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Empfehlungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {progressReport.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-orange-700">
                  • {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="phases">Phasen</TabsTrigger>
          <TabsTrigger value="milestones">Meilensteine</TabsTrigger>
          <TabsTrigger value="risks">Risiken</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Phases Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Phasen-Fortschritt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progressReport.phases.length > 0 ? (
                  progressReport.phases.map((phase) => (
                    <div key={phase.phaseId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {phase.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {phase.progress}%
                        </span>
                      </div>
                      <Progress value={phase.progress} />
                      <div className="text-xs text-muted-foreground">
                        {phase.completedTasks}/{phase.totalTasks} Aufgaben
                        {phase.delayDays > 0 &&
                          ` • ${phase.delayDays} Tage Verzögerung`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Phasen-Daten verfügbar
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Budget-Übersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Geplant</div>
                    <div className="text-lg font-semibold">
                      {progressReport.budget.planned.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Tatsächlich
                    </div>
                    <div className="text-lg font-semibold">
                      {progressReport.budget.actual.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Fakturiert (In Rechnung)
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      {progressReport.budget.invoiced.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Verbaut (Physisch)
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {progressReport.budget.built.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-muted-foreground">
                    Prognose Gesamtkosten
                  </div>
                  <div className="text-xl font-bold">
                    {progressReport.budget.forecastedTotal.toLocaleString(
                      "de-DE",
                      {
                        style: "currency",
                        currency: "EUR",
                      }
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Abgerechnet vs. Budget</span>
                    <span>
                      {progressReport.budget.planned > 0
                        ? Math.round(
                            (progressReport.budget.invoiced /
                              progressReport.budget.planned) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      progressReport.budget.planned > 0
                        ? (progressReport.budget.invoiced /
                            progressReport.budget.planned) *
                          100
                        : 0
                    }
                    className="h-1 bg-blue-100"
                  />
                </div>
                <div
                  className={`text-sm ${
                    progressReport.budget.variance >= 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {progressReport.budget.variance >= 0 ? "+" : ""}
                  {progressReport.budget.variance.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}{" "}
                  Abweichung
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="phases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detaillierte Phasen-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {progressReport.phases.map((phase) => (
                  <div
                    key={phase.phaseId}
                    className="border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{phase.name}</h4>
                        <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {phase.startDate
                              ? new Date(phase.startDate).toLocaleDateString(
                                  "de-DE"
                                )
                              : "-"}
                            {" - "}
                            {phase.endDate
                              ? new Date(phase.endDate).toLocaleDateString(
                                  "de-DE"
                                )
                              : "-"}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          phase.status === "completed"
                            ? "default"
                            : phase.status === "in_progress"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {phase.status === "completed"
                          ? "Abgeschlossen"
                          : phase.status === "in_progress"
                          ? "Läuft"
                          : "Geplant"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Fortschritt</span>
                        <span>{phase.progress}%</span>
                      </div>
                      <Progress value={phase.progress} className="h-2" />
                    </div>
                    {phase.delayDays > 0 && (
                      <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {phase.delayDays} Tage Verzögerung
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meilenstein-Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-muted ml-3 space-y-6">
                {progressReport.milestones.map((milestone) => (
                  <div
                    key={milestone.milestoneId}
                    className="mb-8 ml-6 relative"
                  >
                    <span
                      className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-9 ring-4 ring-background ${
                        milestone.status === "achieved"
                          ? "bg-green-100 text-green-600"
                          : milestone.status === "in_progress"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {milestone.status === "achieved" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : milestone.status === "in_progress" ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </span>
                    <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {milestone.name}
                      {milestone.delayDays > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded ml-3">
                          +{milestone.delayDays} Tage
                        </span>
                      )}
                    </h3>
                    <time className="block mb-2 text-sm font-normal leading-none text-muted-foreground">
                      {new Date(milestone.plannedDate).toLocaleDateString(
                        "de-DE"
                      )}
                    </time>
                    <div className="text-sm font-normal text-muted-foreground">
                      {milestone.prerequisitesComplete}/
                      {milestone.totalPrerequisites} Voraussetzungen erfüllt
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Projekt-Risiken</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Risiko hinzufügen
            </Button>
          </div>

          {/* Risk Categories Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(progressReport.risks.byCategory).map(
              ([category, count]) => (
                <Card key={category}>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {category}
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {progressReport.risks.all &&
              progressReport.risks.all.map((risk) => (
                <Card
                  key={risk.id}
                  className={`border-l-4 ${
                    risk.severity === "critical" || risk.severity === "high"
                      ? "border-l-red-500"
                      : risk.severity === "medium"
                      ? "border-l-yellow-500"
                      : "border-l-blue-500"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="capitalize">
                        {risk.category}
                      </Badge>
                      <Badge
                        variant={
                          risk.status === "mitigated" ? "secondary" : "default"
                        }
                      >
                        {risk.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">
                      {risk.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {risk.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Priorität: {risk.severity}
                      </span>
                      <span>
                        {new Date(risk.identifiedAt).toLocaleDateString(
                          "de-DE"
                        )}
                      </span>
                    </div>
                    {risk.owner && (
                      <div className="mt-2 text-xs font-medium">
                        Verantwortlich: {risk.owner}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            {(!progressReport.risks.all ||
              progressReport.risks.all.length === 0) && (
              <div className="col-span-full text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                Keine Risiken identifiziert.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjectProgressDashboard;
