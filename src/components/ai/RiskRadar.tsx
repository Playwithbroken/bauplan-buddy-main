import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  riskPredictionService,
  ProjectRiskProfile,
} from "@/services/riskPredictionService";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RiskRadarProps {
  projectId?: string;
}

export const RiskRadar: React.FC<RiskRadarProps> = ({ projectId = "demo" }) => {
  const [riskProfile, setRiskProfile] =
    React.useState<ProjectRiskProfile | null>(null);

  React.useEffect(() => {
    // Simulate loading analysis
    const profile = riskPredictionService.analyzeProjectRisks(projectId);
    setRiskProfile(profile);
  }, [projectId]);

  if (!riskProfile) return <div>Loading risks...</div>;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="h-full border-l-4 border-l-orange-500 bg-gradient-to-br from-card to-orange-500/5">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Predictive Risk Radar</CardTitle>
          </div>
          <Badge
            variant={
              riskProfile.overallRiskScore > 50 ? "destructive" : "outline"
            }
          >
            {riskPredictionService.getRiskLevel(riskProfile.overallRiskScore)}{" "}
            Risk
          </Badge>
        </div>
        <CardDescription>AI-forecasted project vulnerabilities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Overall Score */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                className="text-muted/20"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
              />
              <motion.circle
                className={riskPredictionService.getRiskColor(
                  riskProfile.overallRiskScore
                )}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={
                  251.2 - (251.2 * riskProfile.overallRiskScore) / 100
                }
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="48"
                cy="48"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{
                  strokeDashoffset:
                    251.2 - (251.2 * riskProfile.overallRiskScore) / 100,
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold">
                {riskProfile.overallRiskScore}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                Score
              </span>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-4">
          {riskProfile.factors.map((factor, index) => (
            <div key={factor.category} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="capitalize font-medium flex items-center gap-2">
                  {factor.category}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {getTrendIcon(factor.trend)}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Trend: {factor.trend}</p>
                        <ul className="list-disc pl-4 mt-1">
                          {factor.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span
                  className={`text-xs font-bold ${riskPredictionService.getRiskColor(
                    factor.score
                  )}`}
                >
                  {factor.score}%
                </span>
              </div>
              <Progress
                value={factor.score}
                className="h-2"
                indicatorClassName={
                  factor.score > 70
                    ? "bg-red-500"
                    : factor.score > 40
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }
              />
            </div>
          ))}
        </div>

        {/* Predictions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="bg-background/50 p-2 rounded border text-center">
            <p className="text-xs text-muted-foreground">Predicted Delay</p>
            <p className="font-bold text-orange-600">
              +{riskProfile.predictedDelayDays} Days
            </p>
          </div>
          <div className="bg-background/50 p-2 rounded border text-center">
            <p className="text-xs text-muted-foreground">Budget Overrun</p>
            <p className="font-bold text-red-600">
              €{riskProfile.predictedBudgetOverrun}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
