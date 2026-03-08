/**
 * Budget Burn-Down Chart Component
 * Visualizes project budget consumption over time with forecast
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Calendar,
  Euro,
} from "lucide-react";

export interface BudgetDataPoint {
  date: Date;
  planned: number;
  actual: number;
  forecast?: number;
  milestone?: string;
}

export interface BudgetBurnDownProps {
  /** Project name */
  projectName: string;
  /** Total budget */
  totalBudget: number;
  /** Data points for the chart */
  data: BudgetDataPoint[];
  /** Project start date */
  startDate: Date;
  /** Project end date */
  endDate: Date;
  /** Current date for highlighting */
  currentDate?: Date;
  /** Show forecast line */
  showForecast?: boolean;
  /** Custom class name */
  className?: string;
  /** Refresh callback */
  onRefresh?: () => void;
  /** Export callback */
  onExport?: () => void;
}

// Calculate budget status
const getBudgetStatus = (
  variance: number
): { label: string; color: string; icon: typeof CheckCircle2 } => {
  if (variance >= 0) {
    return { label: "Im Budget", color: "text-green-600", icon: CheckCircle2 };
  }
  if (variance >= -5) {
    return {
      label: "Leicht über Budget",
      color: "text-yellow-600",
      icon: AlertTriangle,
    };
  }
  return { label: "Über Budget", color: "text-red-600", icon: AlertTriangle };
};

// Format currency
const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)} Mio €`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)} T€`;
  }
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
};

// SVG Chart component
const BurnDownChart = ({
  data,
  totalBudget,
  width = 600,
  height = 300,
  showForecast = true,
  currentDate,
}: {
  data: BudgetDataPoint[];
  totalBudget: number;
  width?: number;
  height?: number;
  showForecast?: boolean;
  currentDate?: Date;
}) => {
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const xScale = useMemo(() => {
    const minDate = Math.min(...data.map((d) => d.date.getTime()));
    const maxDate = Math.max(...data.map((d) => d.date.getTime()));
    const range = maxDate - minDate || 1;
    return (date: Date) => ((date.getTime() - minDate) / range) * chartWidth;
  }, [data, chartWidth]);

  const yScale = useMemo(() => {
    return (value: number) => chartHeight - (value / totalBudget) * chartHeight;
  }, [chartHeight, totalBudget]);

  // Generate paths
  const plannedPath = useMemo(() => {
    if (data.length < 2) return "";
    return data
      .map(
        (d, i) =>
          `${i === 0 ? "M" : "L"} ${xScale(d.date)} ${yScale(d.planned)}`
      )
      .join(" ");
  }, [data, xScale, yScale]);

  const actualPath = useMemo(() => {
    const actualData = data.filter(
      (d) => d.actual > 0 || d.date <= (currentDate || new Date())
    );
    if (actualData.length < 2) return "";
    return actualData
      .map(
        (d, i) => `${i === 0 ? "M" : "L"} ${xScale(d.date)} ${yScale(d.actual)}`
      )
      .join(" ");
  }, [data, xScale, yScale, currentDate]);

  const forecastPath = useMemo(() => {
    if (!showForecast) return "";
    const forecastData = data.filter((d) => d.forecast !== undefined);
    if (forecastData.length < 2) return "";
    return forecastData
      .map(
        (d, i) =>
          `${i === 0 ? "M" : "L"} ${xScale(d.date)} ${yScale(d.forecast!)}`
      )
      .join(" ");
  }, [data, xScale, yScale, showForecast]);

  // Y-axis labels
  const yLabels = useMemo(() => {
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = totalBudget * (1 - i / steps);
      return { value, y: yScale(value) };
    });
  }, [totalBudget, yScale]);

  // X-axis labels
  const xLabels = useMemo(() => {
    const labelCount = Math.min(6, data.length);
    const step = Math.floor(data.length / labelCount);
    return data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map((d) => ({
        date: d.date,
        x: xScale(d.date),
      }));
  }, [data, xScale]);

  // Current date line position
  const currentX = currentDate ? xScale(currentDate) : null;

  // Milestones
  const milestones = data.filter((d) => d.milestone);

  return (
    <svg width={width} height={height} className="select-none">
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {/* Grid lines */}
        {yLabels.map(({ value, y }) => (
          <g key={value}>
            <line
              x1={0}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
            <text
              x={-8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {formatCurrency(value)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ date, x }) => (
          <text
            key={date.toISOString()}
            x={x}
            y={chartHeight + 20}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {date.toLocaleDateString("de-DE", {
              month: "short",
              year: "2-digit",
            })}
          </text>
        ))}

        {/* Current date line */}
        {currentX !== null && currentX >= 0 && currentX <= chartWidth && (
          <g>
            <line
              x1={currentX}
              y1={0}
              x2={currentX}
              y2={chartHeight}
              stroke="currentColor"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <text
              x={currentX}
              y={-8}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              Heute
            </text>
          </g>
        )}

        {/* Planned line */}
        <path
          d={plannedPath}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          strokeDasharray="4 4"
        />

        {/* Forecast line */}
        {forecastPath && (
          <path
            d={forecastPath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="2 2"
            strokeOpacity={0.6}
          />
        )}

        {/* Actual line */}
        <path
          d={actualPath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data
          .filter((d) => d.actual > 0)
          .map((d, i) => (
            <circle
              key={i}
              cx={xScale(d.date)}
              cy={yScale(d.actual)}
              r={4}
              fill="hsl(var(--primary))"
              className="cursor-pointer hover:r-6 transition-all"
            />
          ))}

        {/* Milestones */}
        {milestones.map((d, i) => (
          <g
            key={i}
            transform={`translate(${xScale(d.date)}, ${chartHeight + 30})`}
          >
            <circle r={4} fill="hsl(var(--primary))" />
            <text
              y={15}
              textAnchor="middle"
              className="fill-muted-foreground text-[8px]"
            >
              {d.milestone}
            </text>
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${chartWidth - 150}, 10)`}>
          <g>
            <line
              x1={0}
              y1={0}
              x2={20}
              y2={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeWidth={2}
            />
            <text x={25} y={4} className="fill-muted-foreground text-[10px]">
              Geplant
            </text>
          </g>
          <g transform="translate(0, 16)">
            <line
              x1={0}
              y1={0}
              x2={20}
              y2={0}
              stroke="hsl(var(--primary))"
              strokeWidth={3}
            />
            <text x={25} y={4} className="fill-muted-foreground text-[10px]">
              Ist
            </text>
          </g>
          {showForecast && (
            <g transform="translate(0, 32)">
              <line
                x1={0}
                y1={0}
                x2={20}
                y2={0}
                stroke="hsl(var(--primary))"
                strokeDasharray="2 2"
                strokeWidth={2}
                strokeOpacity={0.6}
              />
              <text x={25} y={4} className="fill-muted-foreground text-[10px]">
                Prognose
              </text>
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};

export function BudgetBurnDown({
  projectName,
  totalBudget,
  data,
  startDate,
  endDate,
  currentDate = new Date(),
  showForecast = true,
  className,
  onRefresh,
  onExport,
}: BudgetBurnDownProps) {
  const [timeRange, setTimeRange] = useState<"all" | "3m" | "6m" | "1y">("all");

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (timeRange === "all") return data;

    const now = new Date();
    const monthsBack = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
    const cutoffDate = new Date(now);
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

    return data.filter((d) => d.date >= cutoffDate);
  }, [data, timeRange]);

  // Calculate current values
  const currentActual = useMemo(() => {
    const latest = [...data]
      .filter((d) => d.actual > 0)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    return latest?.actual || 0;
  }, [data]);

  const currentPlanned = useMemo(() => {
    // Find planned value for current date
    const sorted = [...data].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const current =
      sorted.find((d) => d.date >= currentDate) || sorted[sorted.length - 1];
    return current?.planned || 0;
  }, [data, currentDate]);

  const variance =
    totalBudget > 0
      ? ((currentPlanned - currentActual) / totalBudget) * 100
      : 0;
  const status = getBudgetStatus(variance);
  const StatusIcon = status.icon;

  const remainingBudget = totalBudget - currentActual;
  const burnRate = useMemo(() => {
    const actualData = data.filter((d) => d.actual > 0);
    if (actualData.length < 2) return 0;
    const firstActual = actualData[0];
    const lastActual = actualData[actualData.length - 1];
    const days =
      (lastActual.date.getTime() - firstActual.date.getTime()) /
      (1000 * 60 * 60 * 24);
    return days > 0 ? (lastActual.actual - firstActual.actual) / days : 0;
  }, [data]);

  // Forecast completion
  const forecastCompletion = useMemo(() => {
    if (burnRate <= 0) return null;
    const daysRemaining = remainingBudget / burnRate;
    const forecastDate = new Date(currentDate);
    forecastDate.setDate(forecastDate.getDate() + daysRemaining);
    return forecastDate;
  }, [burnRate, remainingBudget, currentDate]);

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Budget Burn-Down
              </CardTitle>
              <Badge variant="outline" className={status.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={timeRange}
                onValueChange={(v) => setTimeRange(v as typeof timeRange)}
              >
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Gesamt</SelectItem>
                  <SelectItem value="3m">3 Monate</SelectItem>
                  <SelectItem value="6m">6 Monate</SelectItem>
                  <SelectItem value="1y">1 Jahr</SelectItem>
                </SelectContent>
              </Select>
              {onExport && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onExport}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{projectName}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Gesamt</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(totalBudget)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Gesamtbudget</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Verbraucht</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(currentActual)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Aktuell verbrauchtes Budget</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Verbleibend</p>
                  <p
                    className={cn(
                      "font-bold text-lg",
                      remainingBudget < 0 ? "text-red-600" : "text-green-600"
                    )}
                  >
                    {formatCurrency(remainingBudget)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Restbudget</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Abweichung</p>
                  <p className={cn("font-bold text-lg", status.color)}>
                    {variance > 0 ? "+" : ""}
                    {variance.toFixed(1)}%
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Abweichung vom Plan</TooltipContent>
            </Tooltip>
          </div>

          {/* Chart */}
          <div className="w-full overflow-x-auto">
            <BurnDownChart
              data={filteredData}
              totalBudget={totalBudget}
              width={600}
              height={280}
              showForecast={showForecast}
              currentDate={currentDate}
            />
          </div>

          {/* Forecast info */}
          {forecastCompletion && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    Prognose Budgetverbrauch:
                  </span>{" "}
                  <span className="font-medium">
                    {forecastCompletion.toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Basierend auf aktuellem Burn-Rate von{" "}
                  {formatCurrency(burnRate * 30)}/Monat
                </p>
              </div>
              {forecastCompletion > endDate && (
                <Badge variant="outline" className="text-green-600">
                  Im Zeitplan
                </Badge>
              )}
              {forecastCompletion <= endDate && (
                <Badge variant="outline" className="text-yellow-600">
                  Vorzeitiger Verbrauch
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default BudgetBurnDown;
