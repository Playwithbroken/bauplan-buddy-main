/**
 * KPI Widget Component
 * Customizable KPI widgets for dashboard displays
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Settings,
  Info,
  Euro,
  Percent,
  Hash,
  Clock,
  Target,
  AlertCircle,
} from "lucide-react";

export type KPIType =
  | "currency"
  | "percentage"
  | "number"
  | "duration"
  | "ratio";

export type KPITrend = "up" | "down" | "stable";
export type KPIStatus = "good" | "warning" | "danger" | "neutral";

export interface KPIData {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  target?: number;
  type: KPIType;
  unit?: string;
  trend: KPITrend;
  trendPercentage?: number;
  status: KPIStatus;
  description?: string;
  sparklineData?: number[];
}

export interface KPIWidgetProps {
  data: KPIData;
  variant?: "default" | "compact" | "detailed";
  showTrend?: boolean;
  showTarget?: boolean;
  showSparkline?: boolean;
  onRefresh?: () => void;
  onSettings?: () => void;
  className?: string;
  isLoading?: boolean;
}

// Format value based on type
const formatValue = (value: number, type: KPIType, unit?: string): string => {
  switch (type) {
    case "currency":
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(value);
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "duration":
      if (value >= 24) {
        return `${Math.round(value / 24)} Tage`;
      }
      return `${Math.round(value)} Std`;
    case "ratio":
      return value.toFixed(2);
    case "number":
    default:
      return (
        new Intl.NumberFormat("de-DE").format(value) + (unit ? ` ${unit}` : "")
      );
  }
};

// Get icon for KPI type
const getTypeIcon = (type: KPIType) => {
  switch (type) {
    case "currency":
      return Euro;
    case "percentage":
      return Percent;
    case "duration":
      return Clock;
    case "ratio":
      return Target;
    case "number":
    default:
      return Hash;
  }
};

// Status colors
const STATUS_COLORS: Record<KPIStatus, string> = {
  good: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  danger: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
};

const STATUS_BG_COLORS: Record<KPIStatus, string> = {
  good: "bg-green-100 dark:bg-green-900/30",
  warning: "bg-yellow-100 dark:bg-yellow-900/30",
  danger: "bg-red-100 dark:bg-red-900/30",
  neutral: "bg-muted",
};

// Simple sparkline component
const Sparkline = ({ data, status }: { data: number[]; status: KPIStatus }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;
  const stepX = width / (data.length - 1);

  const points = data
    .map((value, i) => {
      const x = i * stepX;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const strokeColor =
    status === "good"
      ? "stroke-green-500"
      : status === "danger"
      ? "stroke-red-500"
      : "stroke-yellow-500";

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        className={cn("stroke-2", strokeColor)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export function KPIWidget({
  data,
  variant = "default",
  showTrend = true,
  showTarget = true,
  showSparkline = false,
  onRefresh,
  onSettings,
  className,
  isLoading = false,
}: KPIWidgetProps) {
  const TypeIcon = getTypeIcon(data.type);
  const formattedValue = formatValue(data.value, data.type, data.unit);

  // Calculate target progress
  const targetProgress = useMemo(() => {
    if (!data.target || data.target === 0) return null;
    return Math.min(100, (data.value / data.target) * 100);
  }, [data.value, data.target]);

  // Trend indicator
  const TrendIndicator = () => {
    if (!showTrend) return null;

    const trendColor =
      data.trend === "up"
        ? data.status === "danger"
          ? "text-red-500"
          : "text-green-500"
        : data.trend === "down"
        ? data.status === "danger"
          ? "text-green-500"
          : "text-red-500"
        : "text-muted-foreground";

    const TrendIcon =
      data.trend === "up"
        ? TrendingUp
        : data.trend === "down"
        ? TrendingDown
        : Minus;

    return (
      <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
        <TrendIcon className="h-3 w-3" />
        {data.trendPercentage !== undefined && (
          <span>
            {data.trendPercentage > 0 ? "+" : ""}
            {data.trendPercentage.toFixed(1)}%
          </span>
        )}
      </div>
    );
  };

  // Compact variant
  if (variant === "compact") {
    return (
      <TooltipProvider>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg",
            STATUS_BG_COLORS[data.status],
            className
          )}
        >
          <TypeIcon className={cn("h-5 w-5", STATUS_COLORS[data.status])} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {data.title}
            </p>
            <p className={cn("font-bold", STATUS_COLORS[data.status])}>
              {isLoading ? "..." : formattedValue}
            </p>
          </div>
          <TrendIndicator />
        </div>
      </TooltipProvider>
    );
  }

  // Detailed variant
  if (variant === "detailed") {
    return (
      <TooltipProvider>
        <Card className={className}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TypeIcon
                  className={cn("h-4 w-4", STATUS_COLORS[data.status])}
                />
                {data.title}
              </CardTitle>
              <div className="flex items-center gap-1">
                {data.description && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{data.description}</TooltipContent>
                  </Tooltip>
                )}
                {onSettings && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onSettings}
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onRefresh}
                  >
                    <RefreshCw
                      className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
                    />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p
                  className={cn(
                    "text-3xl font-bold",
                    STATUS_COLORS[data.status]
                  )}
                >
                  {isLoading ? "..." : formattedValue}
                </p>
                {data.previousValue !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Vorher:{" "}
                    {formatValue(data.previousValue, data.type, data.unit)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <TrendIndicator />
                {showSparkline && data.sparklineData && (
                  <Sparkline data={data.sparklineData} status={data.status} />
                )}
              </div>
            </div>

            {showTarget && data.target && targetProgress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ziel</span>
                  <span className="font-medium">
                    {formatValue(data.target, data.type, data.unit)}
                  </span>
                </div>
                <Progress value={targetProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {targetProgress.toFixed(0)}% erreicht
                </p>
              </div>
            )}

            <Badge
              variant="outline"
              className={cn("text-xs", STATUS_COLORS[data.status])}
            >
              {data.status === "good" && "Im Plan"}
              {data.status === "warning" && "Aufmerksamkeit"}
              {data.status === "danger" && "Kritisch"}
              {data.status === "neutral" && "Neutral"}
            </Badge>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  // Default variant
  return (
    <TooltipProvider>
      <Card className={cn("relative overflow-hidden", className)}>
        <div
          className={cn(
            "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10",
            STATUS_BG_COLORS[data.status]
          )}
        />

        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{data.title}</p>
              <p
                className={cn("text-2xl font-bold", STATUS_COLORS[data.status])}
              >
                {isLoading ? "..." : formattedValue}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div
                className={cn("p-2 rounded-lg", STATUS_BG_COLORS[data.status])}
              >
                <TypeIcon
                  className={cn("h-5 w-5", STATUS_COLORS[data.status])}
                />
              </div>
              <TrendIndicator />
            </div>
          </div>

          {showTarget && data.target && targetProgress !== null && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Ziel: {formatValue(data.target, data.type, data.unit)}
                </span>
                <span>{targetProgress.toFixed(0)}%</span>
              </div>
              <Progress value={targetProgress} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default KPIWidget;
