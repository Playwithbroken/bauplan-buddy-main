import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Activity,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import aiInsightsService, {
  type ProjectInsight,
  type InsightType,
  type InsightSeverity,
} from "@/services/aiInsightsService";

interface InsightsPanelProps {
  className?: string;
  maxInsights?: number;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  className,
  maxInsights = 4,
}) => {
  const [insights, setInsights] = useState<ProjectInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading insights
    const loadInsights = async () => {
      setLoading(true);
      // In production, this would fetch real project data
      const mockInsights = aiInsightsService.generateMockInsights();

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setInsights(mockInsights.slice(0, maxInsights));
      setLoading(false);
    };

    loadInsights();
  }, [maxInsights]);

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case "risk":
        return AlertTriangle;
      case "opportunity":
        return TrendingUp;
      case "recommendation":
        return Lightbulb;
      case "trend":
        return Activity;
    }
  };

  const getInsightColor = (type: InsightType, severity: InsightSeverity) => {
    if (type === "risk") {
      return severity === "high"
        ? "from-red-500 to-orange-500"
        : severity === "medium"
        ? "from-orange-500 to-yellow-500"
        : "from-yellow-500 to-amber-500";
    }
    if (type === "opportunity") {
      return "from-green-500 to-emerald-500";
    }
    if (type === "recommendation") {
      return "from-blue-500 to-cyan-500";
    }
    return "from-purple-500 to-pink-500";
  };

  const getSeverityBadge = (severity: InsightSeverity) => {
    const variants = {
      high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      medium:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return variants[severity];
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Insights
          </CardTitle>
          <CardDescription>Analyzing your projects...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-muted rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-2 border-purple-200 dark:border-purple-800",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Smart recommendations and risk detection
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Activity className="w-3 h-3" />
            {insights.length} insights
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="popLayout">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            const isExpanded = expandedId === insight.id;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-xl border-2 transition-all duration-300",
                    isExpanded
                      ? "border-purple-300 dark:border-purple-700"
                      : "border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                  )}
                >
                  {/* Gradient background */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-r opacity-10",
                      getInsightColor(insight.type, insight.severity)
                    )}
                  />

                  <div className="relative p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center",
                          getInsightColor(insight.type, insight.severity)
                        )}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm leading-tight">
                            {insight.title}
                          </h4>
                          <Badge className={getSeverityBadge(insight.severity)}>
                            {insight.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : insight.id)
                        }
                      >
                        {isExpanded ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Confidence indicator */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Confidence:
                      </span>
                      <Progress
                        value={insight.confidence * 100}
                        className="h-1.5 flex-1"
                      />
                      <span className="text-xs font-medium">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-3 pt-3 border-t border-border"
                        >
                          {/* Impact */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              Impact:
                            </p>
                            <p className="text-sm">{insight.impact}</p>
                          </div>

                          {/* Action items */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              Recommended Actions:
                            </p>
                            <ul className="space-y-1.5">
                              {insight.actionItems.map((action, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <ChevronRight className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="flex-1">
                              Take Action
                            </Button>
                            <Button size="sm" variant="outline">
                              Dismiss
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {insights.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No insights available yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
