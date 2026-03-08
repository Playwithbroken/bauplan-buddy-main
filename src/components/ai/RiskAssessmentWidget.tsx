/**
 * Risk Assessment Widget
 * AI-powered project risk analysis with visual indicators
 */

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  RefreshCw,
  Info,
  Clock,
  DollarSign,
  Users,
  Package,
  FileWarning,
  CheckCircle2,
} from "lucide-react";

export type RiskCategory =
  | "schedule" // Terminrisiken
  | "budget" // Kostenrisiken
  | "quality" // Qualitätsrisiken
  | "resources" // Ressourcenrisiken
  | "external" // Externe Risiken
  | "technical"; // Technische Risiken

export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type RiskTrend = "improving" | "stable" | "worsening";

export interface ProjectRisk {
  id: string;
  category: RiskCategory;
  title: string;
  description: string;
  severity: RiskSeverity;
  probability: number; // 0-100
  impact: number; // 0-100
  trend: RiskTrend;
  mitigationActions: string[];
  owner?: string;
  dueDate?: Date;
  status: "open" | "mitigating" | "resolved";
}

export interface RiskAssessment {
  overallScore: number; // 0-100, higher = more risk
  overallStatus: RiskSeverity;
  trend: RiskTrend;
  categoryScores: Record<RiskCategory, number>;
  risks: ProjectRisk[];
  lastUpdated: Date;
}

interface RiskAssessmentWidgetProps {
  /** Project ID for risk assessment */
  projectId?: string;
  /** Initial assessment data */
  initialData?: RiskAssessment;
  /** Compact mode */
  compact?: boolean;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Custom class name */
  className?: string;
  /** Refresh callback */
  onRefresh?: () => void;
}

// Category configuration
const CATEGORY_CONFIG: Record<
  RiskCategory,
  { label: string; icon: typeof Clock; color: string }
> = {
  schedule: { label: "Termine", icon: Clock, color: "text-blue-500" },
  budget: { label: "Kosten", icon: DollarSign, color: "text-green-500" },
  quality: { label: "Qualität", icon: CheckCircle2, color: "text-purple-500" },
  resources: { label: "Ressourcen", icon: Users, color: "text-orange-500" },
  external: { label: "Extern", icon: Package, color: "text-cyan-500" },
  technical: { label: "Technik", icon: FileWarning, color: "text-red-500" },
};

// Severity colors
const SEVERITY_CONFIG: Record<
  RiskSeverity,
  { label: string; color: string; bgColor: string }
> = {
  low: { label: "Niedrig", color: "text-green-600", bgColor: "bg-green-500" },
  medium: {
    label: "Mittel",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500",
  },
  high: { label: "Hoch", color: "text-orange-600", bgColor: "bg-orange-500" },
  critical: { label: "Kritisch", color: "text-red-600", bgColor: "bg-red-500" },
};

// Generate mock risk data
const generateMockRisks = (): ProjectRisk[] => [
  {
    id: "risk-1",
    category: "schedule",
    title: "Verzögerung bei Materiallieferung",
    description:
      "Lieferengpässe bei Stahlträgern könnten den Rohbau verzögern.",
    severity: "high",
    probability: 60,
    impact: 70,
    trend: "stable",
    mitigationActions: [
      "Alternative Lieferanten kontaktieren",
      "Bauablaufplan anpassen",
      "Puffertage einplanen",
    ],
    owner: "Projektleitung",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "mitigating",
  },
  {
    id: "risk-2",
    category: "budget",
    title: "Preisanstieg bei Energiekosten",
    description: "Steigende Energiepreise beeinflussen die Baukosten.",
    severity: "medium",
    probability: 70,
    impact: 40,
    trend: "worsening",
    mitigationActions: [
      "Langfristige Energieverträge prüfen",
      "Energieeffiziente Baumaschinen einsetzen",
    ],
    owner: "Bauleitung",
    status: "open",
  },
  {
    id: "risk-3",
    category: "resources",
    title: "Fachkräftemangel Elektroinstallation",
    description: "Verfügbarkeit von Elektrofachkräften für Phase 3 unsicher.",
    severity: "medium",
    probability: 50,
    impact: 55,
    trend: "improving",
    mitigationActions: [
      "Frühzeitige Reservierung bei Subunternehmer",
      "Alternativfirmen identifizieren",
    ],
    owner: "Projektleitung",
    status: "mitigating",
  },
  {
    id: "risk-4",
    category: "external",
    title: "Wetterbedingungen April",
    description: "Mögliche Frostperioden können Betonarbeiten beeinflussen.",
    severity: "low",
    probability: 30,
    impact: 40,
    trend: "stable",
    mitigationActions: [
      "Wetterdaten überwachen",
      "Frostschutzmaßnahmen bereithalten",
    ],
    status: "open",
  },
  {
    id: "risk-5",
    category: "quality",
    title: "Ausführungsqualität Trockenbau",
    description:
      "Qualitätsschwankungen beim aktuellen Subunternehmer beobachtet.",
    severity: "medium",
    probability: 45,
    impact: 50,
    trend: "stable",
    mitigationActions: [
      "Engmaschigere Qualitätskontrollen",
      "Nachbesserungsfristen verschärfen",
    ],
    owner: "Bauleitung",
    status: "mitigating",
  },
];

// Calculate overall score from risks
const calculateOverallScore = (risks: ProjectRisk[]): number => {
  if (risks.length === 0) return 0;

  const weightedScores = risks.map((risk) => {
    const severityWeight = { low: 1, medium: 2, high: 3, critical: 4 }[
      risk.severity
    ];
    return (risk.probability / 100) * (risk.impact / 100) * severityWeight * 25;
  });

  return Math.min(
    100,
    Math.round((weightedScores.reduce((a, b) => a + b, 0) / risks.length) * 2)
  );
};

// Determine overall status from score
const getOverallStatus = (score: number): RiskSeverity => {
  if (score < 25) return "low";
  if (score < 50) return "medium";
  if (score < 75) return "high";
  return "critical";
};

export function RiskAssessmentWidget({
  projectId,
  initialData,
  compact = false,
  showDetails = true,
  className,
  onRefresh,
}: RiskAssessmentWidgetProps) {
  const [isLoading, setIsLoading] = useState(!initialData);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(
    initialData || null
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());

  // Fetch risk assessment
  useEffect(() => {
    if (initialData) return;

    const fetchAssessment = async () => {
      setIsLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const risks = generateMockRisks();
      const overallScore = calculateOverallScore(risks);

      // Calculate category scores
      const categoryScores: Record<RiskCategory, number> = {
        schedule: 0,
        budget: 0,
        quality: 0,
        resources: 0,
        external: 0,
        technical: 0,
      };

      risks.forEach((risk) => {
        const score = (risk.probability / 100) * (risk.impact / 100) * 100;
        categoryScores[risk.category] = Math.max(
          categoryScores[risk.category],
          score
        );
      });

      setAssessment({
        overallScore,
        overallStatus: getOverallStatus(overallScore),
        trend: "stable",
        categoryScores,
        risks,
        lastUpdated: new Date(),
      });

      setIsLoading(false);
    };

    fetchAssessment();
  }, [initialData, projectId]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    onRefresh?.();

    // Re-fetch (simulated)
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (assessment) {
      setAssessment({
        ...assessment,
        lastUpdated: new Date(),
      });
    }

    setIsLoading(false);
  };

  // Toggle risk expansion
  const toggleRisk = (riskId: string) => {
    setExpandedRisks((prev) => {
      const next = new Set(prev);
      if (next.has(riskId)) {
        next.delete(riskId);
      } else {
        next.add(riskId);
      }
      return next;
    });
  };

  // Memoized sorted risks by severity
  const sortedRisks = useMemo(() => {
    if (!assessment) return [];
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...assessment.risks].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }, [assessment]);

  // Trend icon
  const TrendIcon = ({ trend }: { trend: RiskTrend }) => {
    if (trend === "improving") {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    if (trend === "worsening") {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Risikobewertung wird geladen...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) return null;

  const {
    overallScore,
    overallStatus,
    trend,
    categoryScores,
    risks,
    lastUpdated,
  } = assessment;

  // Compact view
  if (compact) {
    return (
      <TooltipProvider>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
            className
          )}
        >
          <div className="relative">
            <div
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center text-white font-bold",
                SEVERITY_CONFIG[overallStatus].bgColor
              )}
            >
              {overallScore}
            </div>
            {trend !== "stable" && (
              <div className="absolute -bottom-1 -right-1">
                <TrendIcon trend={trend} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Risiko-Score</span>
              <Badge
                variant="outline"
                className={SEVERITY_CONFIG[overallStatus].color}
              >
                {SEVERITY_CONFIG[overallStatus].label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {
                risks.filter(
                  (r) => r.severity === "high" || r.severity === "critical"
                ).length
              }{" "}
              kritische Risiken
            </p>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risikobewertung
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {lastUpdated.toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall score */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={cn(
                  "h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-bold",
                  SEVERITY_CONFIG[overallStatus].bgColor
                )}
              >
                {overallScore}
              </div>
              {trend !== "stable" && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  <TrendIcon trend={trend} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Gesamtrisiko</span>
                <Badge
                  variant="outline"
                  className={SEVERITY_CONFIG[overallStatus].color}
                >
                  {SEVERITY_CONFIG[overallStatus].label}
                </Badge>
              </div>
              <Progress value={overallScore} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Niedrig</span>
                <span className="text-xs text-muted-foreground">Kritisch</span>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-3 gap-2">
            {(
              Object.entries(CATEGORY_CONFIG) as [
                RiskCategory,
                (typeof CATEGORY_CONFIG)[RiskCategory]
              ][]
            ).map(([category, config]) => {
              const score = categoryScores[category];
              const status = getOverallStatus(score);
              return (
                <Tooltip key={category}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center p-2 rounded bg-muted/50 cursor-default">
                      <config.icon
                        className={cn("h-4 w-4 mb-1", config.color)}
                      />
                      <span className="text-xs font-medium">
                        {config.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] mt-1",
                          SEVERITY_CONFIG[status].color
                        )}
                      >
                        {Math.round(score)}%
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {config.label}: {SEVERITY_CONFIG[status].label} (
                      {Math.round(score)}%)
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Detailed risks */}
          {showDetails && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {risks.length} Risiken identifiziert
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-2 mt-2">
                {sortedRisks.map((risk) => (
                  <Collapsible
                    key={risk.id}
                    open={expandedRisks.has(risk.id)}
                    onOpenChange={() => toggleRisk(risk.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            SEVERITY_CONFIG[risk.severity].bgColor
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {risk.title}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {CATEGORY_CONFIG[risk.category].label}
                        </Badge>
                        <TrendIcon trend={risk.trend} />
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform shrink-0",
                            expandedRisks.has(risk.id) && "rotate-180"
                          )}
                        />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="mt-2 ml-4 p-3 rounded-lg border bg-background/50 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {risk.description}
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">
                              Wahrscheinlichkeit:
                            </span>{" "}
                            <span className="font-medium">
                              {risk.probability}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Auswirkung:
                            </span>{" "}
                            <span className="font-medium">{risk.impact}%</span>
                          </div>
                          {risk.owner && (
                            <div>
                              <span className="text-muted-foreground">
                                Verantwortlich:
                              </span>{" "}
                              <span className="font-medium">{risk.owner}</span>
                            </div>
                          )}
                          {risk.dueDate && (
                            <div>
                              <span className="text-muted-foreground">
                                Frist:
                              </span>{" "}
                              <span className="font-medium">
                                {risk.dueDate.toLocaleDateString("de-DE")}
                              </span>
                            </div>
                          )}
                        </div>

                        {risk.mitigationActions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1">
                              Maßnahmen:
                            </p>
                            <ul className="space-y-1">
                              {risk.mitigationActions.map((action, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-muted-foreground flex items-start gap-1"
                                >
                                  <span>•</span>
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            risk.status === "resolved"
                              ? "text-green-600"
                              : risk.status === "mitigating"
                              ? "text-yellow-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {risk.status === "resolved"
                            ? "Gelöst"
                            : risk.status === "mitigating"
                            ? "In Bearbeitung"
                            : "Offen"}
                        </Badge>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default RiskAssessmentWidget;
