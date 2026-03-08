import React, { useState, useMemo } from "react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  PieChart as PieChartIcon,
} from "lucide-react";
import financialReportingService from "@/services/financialReportingService";
import { BWAStatement } from "@/components/finance/BWAStatement";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export const BWA: React.FC = () => {
  const [year, setYear] = useState("2024");
  const [month, setMonth] = useState("3"); // April (0-indexed)

  const period = useMemo(
    () =>
      financialReportingService.createMonthlyPeriod(
        parseInt(year),
        parseInt(month)
      ),
    [year, month]
  );

  const data = useMemo(
    () => financialReportingService.generateProfitLossStatement(period),
    [period]
  );

  const ratios = useMemo(
    () => financialReportingService.generateFinancialRatios(period),
    [period]
  );

  const chartData = useMemo(
    () => [
      { name: "Umsatz", amount: data.revenue.totalRevenue },
      { name: "Aufwand", amount: data.expenses.totalExpenses },
      { name: "Rohertrag", amount: data.profit.grossProfit },
      { name: "Ergebnis", amount: data.profit.netProfit },
    ],
    [data]
  );

  const expenseBreakdown = useMemo(
    () =>
      Object.entries(data.expenses.expensesByCategory).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      })),
    [data]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Finanzen", href: "/analytics" },
        { label: "BWA" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <p className="text-muted-foreground">
              Strategische Finanzübersicht für die Geschäftsführung
            </p>
          </div>
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[100px] border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Jahr" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[130px] border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Monat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Januar</SelectItem>
                <SelectItem value="1">Februar</SelectItem>
                <SelectItem value="2">März</SelectItem>
                <SelectItem value="3">April</SelectItem>
                <SelectItem value="4">Mai</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-9 px-2">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                    Umsatzerlöse
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.revenue.totalRevenue)}
                  </p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium">
                <Badge
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 border-none text-white gap-1"
                >
                  <ArrowUpRight className="h-3 w-3" /> 12.5%
                </Badge>
                <span className="opacity-70">vs. Vormonat</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                    Rohertrag
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.profit.grossProfit)}
                  </p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium">
                <Badge
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 border-none text-white gap-1"
                >
                  <ArrowUpRight className="h-3 w-3" /> 8.2%
                </Badge>
                <span className="opacity-70">
                  Margin: {data.profit.profitMargin.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                    EBIT
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.profit.operatingProfit)}
                  </p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Calculator className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium">
                <Badge
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 border-none text-white gap-1"
                >
                  Stabil
                </Badge>
                <span className="opacity-70">Ziel: IST + 4%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                    Netto Cashflow
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.profit.netProfit * 0.9)}
                  </p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Filter className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium">
                <Badge
                  variant="destructive"
                  className="bg-white/20 hover:bg-white/30 border-none text-white gap-1"
                >
                  <ArrowDownRight className="h-3 w-3" /> 2.1%
                </Badge>
                <span className="opacity-70">Liq. 2. Grades</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ertrags- & Kostenstruktur</CardTitle>
              <CardDescription>
                Vergleich der Hauptkennzahlen für {period.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.amount < 0
                              ? "#EF4444"
                              : index === 0
                              ? "#3B82F6"
                              : index === 3
                              ? "#10B981"
                              : "#6366F1"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aufwand nach Kategorien</CardTitle>
                  <CardDescription>
                    Verteilung der betrieblichen Aufwendungen
                  </CardDescription>
                </div>
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statement */}
        <BWAStatement data={data} />
      </div>
    </LayoutWithSidebar>
  );
};

export default BWA;
