import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const priceTrendData = [
  { month: "Jan", price: 92, predicted: 92 },
  { month: "Feb", price: 95, predicted: 95 },
  { month: "Mar", price: 98, predicted: 98 },
  { month: "Apr", price: 105, predicted: 105 },
  { month: "Mai", predicted: 108 },
  { month: "Jun", predicted: 112 },
  { month: "Jul", predicted: 110 },
];

const demandForecastData = [
  { week: "W14", baseline: 400, projectDemand: 400 },
  { week: "W15", baseline: 420, projectDemand: 420 },
  { week: "W16", baseline: 410, projectDemand: 850 },
  { week: "W17", baseline: 430, projectDemand: 920 },
  { week: "W18", baseline: 425, projectDemand: 425 },
];

export const ProcurementAIInsights: React.FC = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="overflow-hidden border-indigo-100 dark:border-indigo-900 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900">
                <BrainCircuit className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Preis-Prognose: Baustahl
                </CardTitle>
                <CardDescription>
                  KI-Modell basierend auf Marktindikatoren
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
            >
              Konfidenz: 88%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Aktueller Trend</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">+12.4%</span>
                <ArrowUpRight className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Empfehlung</p>
              <Badge className="bg-green-600">Frühzeitig kaufen</Badge>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#4F46E5" }}
                  activeDot={{ r: 6 }}
                  name="Echtpreis"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="KI-Prognose"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Alert className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-400 text-xs font-semibold">
              Markt-Warnung
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-500 text-[11px]">
              Lieferengpässe bei Importstahl aus der EU ab Juni erwartet.
              Deckung für Q3 sichern.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-emerald-100 dark:border-emerald-900 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900">
                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Projektbedarf-Forecasting
                </CardTitle>
                <CardDescription>
                  Materialbedarf vs. Projektphasen (Wochenansicht)
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
            >
              Präzision: 92%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Spitzenlast erwartet
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-indigo-600">
                  KW 16-17
                </span>
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Bedarf +120%</p>
              <p className="text-xs text-muted-foreground font-medium">
                Projekt: Wohnquartier MUC
              </p>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandForecastData}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="projectDemand"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorDemand)"
                  name="Gesamtbedarf"
                />
                <Area
                  type="monotone"
                  dataKey="baseline"
                  stroke="#94A3B8"
                  fill="transparent"
                  strokeDasharray="4 4"
                  name="Standard-Lagerbestand"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                Kapazitäts-Limit
              </p>
              <p className="text-sm font-semibold">95% erreicht</p>
            </div>
            <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                Lagerkosten-Optim.
              </p>
              <p className="text-sm font-semibold text-green-600">
                €2.400 gesp.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
