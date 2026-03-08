import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DollarSign,
  Euro,
  Receipt,
  Calculator,
  Download,
  RefreshCw,
  Target,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  FinancialReportingService,
  ProfitLossStatement,
  CashFlowStatement,
  FinancialRatio,
  TaxReport,
} from "@/services/financialReportingService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

const FinancialReports: React.FC = () => {
  const { toast } = useToast();
  const [financialService] = useState(() =>
    FinancialReportingService.getInstance()
  );
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [profitLossData, setProfitLossData] =
    useState<ProfitLossStatement | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowStatement | null>(
    null
  );
  const [financialRatios, setFinancialRatios] = useState<FinancialRatio[]>([]);
  const [taxReport, setTaxReport] = useState<TaxReport | null>(null);
  const [loading, setLoading] = useState(false);

  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
  ];

  // Define callback before effects to avoid TDZ errors
  const loadFinancialData = React.useCallback(async () => {
    setLoading(true);
    try {
      const startDate =
        selectedPeriod === "year"
          ? new Date(parseInt(selectedYear), 0, 1)
          : new Date(parseInt(selectedYear), selectedMonth - 1, 1);

      const endDate =
        selectedPeriod === "year"
          ? new Date(parseInt(selectedYear), 11, 31)
          : new Date(parseInt(selectedYear), selectedMonth, 0);

      const period = {
        id: `${selectedPeriod}-${selectedYear}-${selectedMonth}`,
        name:
          selectedPeriod === "year"
            ? `Jahr ${selectedYear}`
            : `${getMonthName(selectedMonth)} ${selectedYear}`,
        startDate,
        endDate,
        type: selectedPeriod as "month" | "year",
      };

      const [plData, cfData, ratios, taxData] = await Promise.all([
        financialService.generateProfitLossStatement(period),
        financialService.generateCashFlowStatement(period),
        financialService.generateFinancialRatios(period),
        financialService.generateTaxReport(period),
      ]);

      setProfitLossData(plData);
      setCashFlowData(cfData);
      setFinancialRatios(ratios);
      setTaxReport(taxData);
    } catch (error) {
      toast({
        title: "Fehler beim Laden der Finanzdaten",
        description: "Die Finanzdaten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedYear, selectedMonth, financialService, toast]);

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod, selectedYear, selectedMonth, loadFinancialData]);

  const getMonthName = (month: number): string => {
    const monthNames = [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ];
    return monthNames[month - 1];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const exportReport = (format: "pdf" | "excel" | "csv") => {
    toast({
      title: "Export wird vorbereitet",
      description: `Der Bericht wird als ${format.toUpperCase()} exportiert.`,
    });
  };

  const getProfitLossChartData = () => {
    if (!profitLossData) return [];
    return Object.entries(profitLossData.revenue.revenueByCategory).map(
      ([category, amount]) => ({
        name: category,
        revenue: amount,
        expenses: profitLossData.expenses.expensesByCategory[category] || 0,
        profit:
          amount - (profitLossData.expenses.expensesByCategory[category] || 0),
      })
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finanzberichte</h2>
          <p className="text-muted-foreground">
            Umfassende Finanzanalyse und Gewinn-Verlust-Rechnung
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monat</SelectItem>
              <SelectItem value="year">Jahr</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriod === "month" && (
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {getMonthName(i + 1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={loadFinancialData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profit-loss" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profit-loss">Gewinn & Verlust</TabsTrigger>
          <TabsTrigger value="cash-flow">Cashflow</TabsTrigger>
          <TabsTrigger value="ratios">Kennzahlen</TabsTrigger>
          <TabsTrigger value="tax">Steuern</TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss" className="space-y-4">
          {profitLossData && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Gesamtumsatz
                    </CardTitle>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(profitLossData.revenue.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(profitLossData.metrics.revenueGrowth)}{" "}
                      vs. Vorperiode
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Gesamtkosten
                    </CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(profitLossData.expenses.totalExpenses)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kostenverhältnis:{" "}
                      {formatPercentage(profitLossData.metrics.expenseRatio)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Nettogewinn
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(profitLossData.profit.netProfit)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gewinnmarge:{" "}
                      {formatPercentage(profitLossData.profit.profitMargin)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ROI</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPercentage(
                        profitLossData.metrics.returnOnInvestment
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Durchschn. Projektwert:{" "}
                      {formatCurrency(
                        profitLossData.metrics.averageProjectValue
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Umsatz vs. Kosten nach Kategorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getProfitLossChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            `€${(value / 1000).toFixed(0)}k`
                          }
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3b82f6" name="Umsatz" />
                        <Bar dataKey="expenses" fill="#ef4444" name="Kosten" />
                        <Bar dataKey="profit" fill="#10b981" name="Gewinn" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Umsatzverteilung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={Object.entries(
                            profitLossData.revenue.revenueByCategory
                          ).map(([category, amount], index) => ({
                            name: category,
                            value: amount,
                            fill: colors[index % colors.length],
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {Object.entries(
                            profitLossData.revenue.revenueByCategory
                          ).map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={colors[index % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          {cashFlowData && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Operative Aktivitäten
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Nettoeinkommen:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          cashFlowData.operatingActivities.netIncome
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Netto-Cashflow:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(
                          cashFlowData.operatingActivities.netCashFromOperations
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Investitionsaktivitäten
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Ausrüstungskäufe:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          cashFlowData.investingActivities.equipmentPurchases
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Netto-Cashflow:</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(
                          cashFlowData.investingActivities.netCashFromInvesting
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Finanzierungsaktivitäten
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Kreditaufnahmen:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          cashFlowData.financingActivities.loanProceeds
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Netto-Cashflow:</span>
                      <span className="font-bold">
                        {formatCurrency(
                          cashFlowData.financingActivities.netCashFromFinancing
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Cashflow-Übersicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatCurrency(cashFlowData.beginningCash)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Anfangsbestand
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${
                          cashFlowData.netCashFlow >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(cashFlowData.netCashFlow)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Netto-Cashflow
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatCurrency(cashFlowData.endingCash)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Endbestand
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {financialRatios.map((ratio, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{ratio.name}</CardTitle>
                    <Badge
                      variant={
                        ratio.trend === "improving"
                          ? "default"
                          : ratio.trend === "declining"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {ratio.trend === "improving" && (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      )}
                      {ratio.trend === "declining" && (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {ratio.trend}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {ratio.value.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {ratio.description}
                  </div>
                  {ratio.benchmark && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Benchmark: {ratio.benchmark.toFixed(2)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          {taxReport && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      MwSt. eingenommen
                    </CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(taxReport.vatCollected)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      MwSt. gezahlt
                    </CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(taxReport.vatPaid)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      MwSt. Saldo
                    </CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        taxReport.netVatLiability >= 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(taxReport.netVatLiability)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Geschätzte Steuerschuld
                    </CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(taxReport.estimatedTaxLiability)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Steuerliche Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Einkommen & Abzüge</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Steuerpflichtiges Einkommen:</span>
                          <span className="font-medium">
                            {formatCurrency(taxReport.taxableIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Abzugsfähige Ausgaben:</span>
                          <span className="font-medium">
                            {formatCurrency(taxReport.deductibleExpenses)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Quartalszahlungen</h4>
                      <div className="space-y-2 text-sm">
                        {taxReport.quarterlyPayments.map((payment, index) => (
                          <div key={index} className="flex justify-between">
                            <span>
                              Q{index + 1}{" "}
                              {taxReport.period.startDate.getFullYear()}:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(payment)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Export-Optionen</CardTitle>
          <CardDescription>
            Exportieren Sie Ihre Finanzberichte in verschiedenen Formaten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => exportReport("pdf")} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              PDF Export
            </Button>
            <Button onClick={() => exportReport("excel")} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel Export
            </Button>
            <Button onClick={() => exportReport("csv")} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReports;
